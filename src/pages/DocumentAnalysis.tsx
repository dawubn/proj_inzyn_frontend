import { reanalyzeDocument } from '@/lib/analysisSubmission';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Upload, X } from 'lucide-react';

import { formatFileSize } from '@/lib/formatters';
import { processingUrl } from '@/lib/analysisStatus';
import {
  DOCUMENT_TYPE_LABELS,
  MAX_FILES_COUNT,
  fetchDocuments,
  patchDocumentType,
  startDocumentAnalysis,
  uploadDocument,
  validateFiles,
} from '@/api/documents-wrapper';

type QueueItem = {
  id: string;
  name: string;
  size: number;
  profile: string;
  source: 'device' | 'library';
  file?: File;
  documentId?: string;
  lastModified?: number;
};

const AUTO = 'auto';

const PROFILE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).filter(
  ([key]) => key !== 'unknown' && key !== 'other',
);

function nameWithoutExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
}

const btnBase =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10';

const btnDark = `${btnBase} border-transparent bg-[#171717] text-white enabled:hover:bg-[#2A2A2A]`;

const btnLight = `${btnBase} border-gray-300 bg-white text-gray-900 enabled:hover:bg-gray-50`;

const btnDanger = `${btnBase} border-[#e7caca] bg-white text-[#a33636] enabled:hover:bg-[#fff3f3]`;

const selectCls =
  'block min-h-11 w-full min-w-0 cursor-pointer rounded-lg border border-gray-300 bg-white py-1.5 pl-2.5 pr-7 text-base text-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:text-sm';

const rowGrid = 'flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_290px] sm:items-stretch';

export default function DocumentAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const resumeAnalysisId = searchParams.get('resume')?.trim();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProfile, setBulkProfile] = useState('');
  const [libraryChoice, setLibraryChoice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const dragDepth = useRef(0);
  const startingRef = useRef(false);

  const {
    data: documentsData,
    isLoading: docsLoading,
    isError: docsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['user-documents'],
    queryFn: ({ pageParam = 1 }) => fetchDocuments(pageParam, 20),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const libraryDocs = useMemo(
    () => documentsData?.pages.flatMap((page) => page.items) ?? [],
    [documentsData],
  );

  const queuedDocumentIds = useMemo(
    () => new Set(queue.map((item) => item.documentId).filter((id): id is string => Boolean(id))),
    [queue],
  );

  useEffect(() => {
    if (resumeAnalysisId) {
      navigate(processingUrl([resumeAnalysisId]), { replace: true });
    }
  }, [resumeAnalysisId, navigate]);

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [errorMessage]);

  useEffect(() => {
    const valid = new Set(queue.map((item) => item.id));

    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [queue]);

  useEffect(() => {
    if (!selectAllRef.current) return;

    selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < queue.length;
  }, [selectedIds, queue.length]);

  const allSelected = queue.length > 0 && selectedIds.size === queue.length;

  const totalSize = queue.reduce((sum, item) => sum + item.size, 0);

  function toggleSelected(id: string, checked: boolean) {
    if (startingRef.current) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (checked) next.add(id);
      else next.delete(id);

      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    if (startingRef.current) return;

    setSelectedIds(checked ? new Set(queue.map((item) => item.id)) : new Set());
  }

  function updateProfile(id: string, profile: string) {
    if (startingRef.current) return;

    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, profile } : item)));
  }

  function removeItem(id: string) {
    if (startingRef.current) return;

    setQueue((prev) => prev.filter((item) => item.id !== id));
    setErrorMessage('');
  }

  function applyBulkProfile() {
    if (startingRef.current || !bulkProfile || selectedIds.size === 0) {
      return;
    }

    setQueue((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, profile: bulkProfile } : item)),
    );

    setBulkProfile('');
  }

  function removeSelected() {
    if (startingRef.current || selectedIds.size === 0) return;

    setQueue((prev) => prev.filter((item) => !selectedIds.has(item.id)));

    setSelectedIds(new Set());
    setBulkProfile('');
    setErrorMessage('');
  }

  function addFromLibrary() {
    if (startingRef.current) return;

    const doc = libraryDocs.find((item) => item.id === libraryChoice);

    if (!doc || queuedDocumentIds.has(doc.id)) return;

    if (queue.length >= MAX_FILES_COUNT) {
      setErrorMessage(`You can upload up to ${MAX_FILES_COUNT} files at once.`);
      return;
    }

    setQueue((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: doc.original_filename,
        size: doc.file_size_bytes ?? 0,
        profile: AUTO,
        source: 'library',
        documentId: doc.id,
      },
    ]);

    setLibraryChoice('');
    setErrorMessage('');
  }

  function addFiles(collection: FileList | File[]) {
    if (startingRef.current) return;

    const errors: string[] = [];
    const accepted: QueueItem[] = [];
    let slots = MAX_FILES_COUNT - queue.length;

    Array.from(collection).forEach((file) => {
      const validationError = validateFiles([file]);

      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        return;
      }

      const duplicate = [...queue, ...accepted].some(
        (item) =>
          item.source === 'device' &&
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      );

      if (duplicate) {
        errors.push(`${file.name}: already in the queue.`);
        return;
      }

      if (slots <= 0) {
        errors.push(`${file.name}: You can upload up to ${MAX_FILES_COUNT} files at once.`);
        return;
      }

      slots -= 1;

      accepted.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        profile: AUTO,
        source: 'device',
        file,
      });
    });

    setErrorMessage(errors.join('\n'));

    if (accepted.length > 0) {
      setQueue((prev) => [...prev, ...accepted]);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (startingRef.current) return;

    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = startingRef.current ? 'none' : 'copy';
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    dragDepth.current = 0;
    setIsDragging(false);

    if (startingRef.current) return;

    addFiles(event.dataTransfer.files);
  }

  function invalidateDocumentQueries() {
    void queryClient.invalidateQueries({
      queryKey: ['user-documents'],
    });

    void queryClient.invalidateQueries({
      queryKey: ['recent-documents'],
    });

    void queryClient.invalidateQueries({
      queryKey: ['documents-last-7-days'],
    });

    void queryClient.invalidateQueries({
      queryKey: ['dashboard-analyses'],
    });
  }

  async function handleStartAnalysis() {
    if (startingRef.current) return;

    if (queue.length === 0) {
      setErrorMessage('Select at least one document first.');
      return;
    }

    startingRef.current = true;
    setIsStarting(true);
    setErrorMessage('');
    setIsDragging(false);
    dragDepth.current = 0;

    const startedIds: string[] = [];
    const processed = new Set<string>();

    try {
      for (const item of queue) {
        let documentId = item.documentId;
        const isNewUpload = !documentId;

        if (!documentId) {
          if (!item.file) {
            throw new Error('The source file is missing. Add it again.');
          }

          const uploadedDocument = await uploadDocument(item.file, item.profile);
          documentId = uploadedDocument.id;

          // Zachowujemy ID uploadu na wypadek błędu uruchomienia analizy.
          setQueue((prev) =>
            prev.map((entry) =>
              entry.id === item.id ? { ...entry, documentId: uploadedDocument.id } : entry,
            ),
          );
        }

        const analysis = isNewUpload
          ? await startDocumentAnalysis(documentId)
          : await reanalyzeDocument(documentId, item.profile, {
              updateType: patchDocumentType,
              start: startDocumentAnalysis,
            });

        startedIds.push(analysis.id);
        processed.add(item.id);
      }

      setQueue([]);
      setSelectedIds(new Set());
      setBulkProfile('');

      navigate(processingUrl(startedIds));
    } catch (error) {
      const remainingItems = queue.filter((item) => !processed.has(item.id));

      const failedItem = remainingItems[0];

      const reason = error instanceof Error ? error.message : 'Failed to start analysis';

      const message = `${failedItem ? `${failedItem.name}: ` : ''}${reason}`;

      setQueue((prev) => prev.filter((item) => !processed.has(item.id)));

      if (startedIds.length > 0) {
        const notStartedNames = remainingItems.map((item) => item.name).join('\n');

        const warning = [
          message,
          `${startedIds.length} document(s) were already sent for analysis.`,
          'The following documents were not started. Add them again from your device or the document library:',
          notStartedNames,
        ].join('\n');

        navigate(processingUrl(startedIds), {
          state: { warning },
        });
      } else {
        setErrorMessage(message);
      }
    } finally {
      invalidateDocumentQueries();

      startingRef.current = false;
      setIsStarting(false);
    }
  }

  if (resumeAnalysisId) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] sm:px-2 lg:px-4">
      <section
        aria-labelledby="page-title"
        aria-busy={isStarting}
        className="rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] px-3 py-4 shadow-sm sm:px-8 sm:py-7"
      >
        <h1
          id="page-title"
          className="mb-5 text-center text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] sm:text-4xl"
        >
          Document Analysis
        </h1>

        {errorMessage && (
          <div
            ref={errorRef}
            role="alert"
            className="mb-3 whitespace-pre-line break-words rounded-lg border border-red-300 bg-red-50 p-3 text-sm leading-relaxed text-red-700 [overflow-wrap:anywhere]"
          >
            {errorMessage}
          </div>
        )}

        <section
          aria-labelledby="upload-title"
          className="mb-2.5 rounded-lg border border-[#E5E5E5] bg-white p-2 sm:px-3"
        >
          <h2
            id="upload-title"
            className="mb-1 text-center text-xs font-medium leading-snug text-[#6B7280]"
          >
            Add to analyze
          </h2>

          <div className="grid grid-cols-1 items-stretch gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-2 sm:grid-cols-[minmax(0,1fr)_26px_minmax(0,1fr)] sm:gap-3 sm:px-2.5 sm:py-2">
            <div className="flex min-w-0 flex-col items-center rounded-lg bg-white px-1 py-1 text-center">
              <FolderOpen className="mb-1 h-[18px] w-[18px] text-[#6B7280]" aria-hidden />

              <h3 className="mb-1.5 text-sm font-semibold">Previously uploaded</h3>

              <div className="flex w-full max-w-[350px] items-center gap-2">
                <label className="sr-only" htmlFor="library-select">
                  Choose a previously uploaded document
                </label>

                <select
                  id="library-select"
                  value={libraryChoice}
                  onChange={(event) => setLibraryChoice(event.target.value)}
                  disabled={isStarting || docsLoading}
                  className={`${selectCls} flex-1`}
                >
                  <option value="">
                    {docsLoading ? 'Loading documents...' : 'Choose a document'}
                  </option>

                  {libraryDocs.map((doc) => {
                    const added = queuedDocumentIds.has(doc.id);

                    return (
                      <option key={doc.id} value={doc.id} disabled={added}>
                        {doc.original_filename}
                        {added ? ' — added' : ''}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={addFromLibrary}
                  disabled={isStarting || !libraryChoice || queuedDocumentIds.has(libraryChoice)}
                  className={`${btnLight} shrink-0`}
                >
                  Add
                </button>
              </div>

              {docsError && (
                <p role="alert" className="mt-2 text-xs text-[#a33636]">
                  Could not load the document library.
                </p>
              )}

              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isStarting || isFetchingNextPage}
                  className="mt-1.5 min-h-11 text-xs text-[#6B7280] underline underline-offset-[3px] hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-8"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load more documents'}
                </button>
              )}
            </div>

            <div aria-hidden className="relative flex min-h-3 items-center justify-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-[#E5E5E5] sm:inset-x-auto sm:inset-y-0 sm:left-1/2 sm:top-0 sm:h-auto sm:w-px" />
              <span className="relative bg-white px-2 text-xs text-[#6B7280] sm:px-0 sm:py-2">
                or
              </span>
            </div>

            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex min-w-0 flex-col items-center rounded-lg bg-white px-1 py-1 text-center ${
                isDragging ? 'outline-2 outline-offset-2 outline-dashed outline-[#171717]' : ''
              }`}
            >
              <Upload className="mb-1 h-[18px] w-[18px] text-[#6B7280]" aria-hidden />

              <h3 className="mb-1.5 text-sm font-semibold">From this device</h3>

              <div className="flex min-h-[30px] flex-wrap items-center justify-center gap-2">
                <span className="hidden text-xs text-[#6B7280] sm:inline">Drop files here or</span>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isStarting}
                  onChange={handleInputChange}
                  className="peer sr-only"
                  id="file-input"
                />

                <label
                  htmlFor="file-input"
                  className={`${btnDark} cursor-pointer hover:bg-[#2A2A2A] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#171717] peer-disabled:cursor-not-allowed peer-disabled:opacity-40 peer-disabled:hover:bg-[#171717]`}
                >
                  Select files
                </label>
              </div>

              <p className="mt-1.5 text-xs leading-normal text-[#6B7280]">
                PDF, JPG, PNG · up to 20 MB per file · max {MAX_FILES_COUNT} files
              </p>
            </div>
          </div>
        </section>

        {selectedIds.size > 0 && (
          <section
            aria-label="Actions for selected documents"
            className="mb-2 grid grid-cols-2 items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white p-2.5 sm:flex sm:flex-wrap sm:gap-2.5 sm:px-3"
          >
            <span className="col-span-2 whitespace-nowrap text-sm font-semibold sm:col-auto">
              {selectedIds.size} selected
            </span>

            <span aria-hidden className="hidden h-6 w-px bg-[#E5E5E5] sm:block" />

            <label className="sr-only" htmlFor="bulk-profile">
              Choose document type for selected files
            </label>

            <select
              id="bulk-profile"
              value={bulkProfile}
              disabled={isStarting}
              onChange={(event) => setBulkProfile(event.target.value)}
              className={`${selectCls} col-span-2 sm:col-auto sm:min-w-[140px] sm:flex-1`}
            >
              <option value="">Choose document type</option>

              {PROFILE_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={applyBulkProfile}
              disabled={isStarting || !bulkProfile}
              className={btnDark}
            >
              Apply
              <span className="hidden sm:inline">&nbsp;for selected</span>
            </button>

            <button
              type="button"
              onClick={removeSelected}
              disabled={isStarting}
              className={btnDanger}
            >
              Remove
              <span className="hidden sm:inline">&nbsp;selected</span>
            </button>
          </section>
        )}

        <section
          aria-label="Documents for analysis"
          className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white"
        >
          <div className="flex min-h-11 items-stretch border-b border-[#E5E5E5] bg-[#F9FAFB] sm:grid sm:grid-cols-[minmax(0,1fr)_290px]">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                disabled={queue.length === 0 || isStarting}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                aria-label="Select all documents"
                className="h-5 w-5 shrink-0 cursor-pointer accent-[#171717] disabled:cursor-not-allowed sm:h-4 sm:w-4"
              />

              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-normal">
                <strong className="text-xs font-semibold text-[#6B7280]">Documents</strong>

                <span className="text-xs text-[#6B7280]">
                  - {queue.length} {queue.length === 1 ? 'file' : 'files'} ·{' '}
                  {formatFileSize(totalSize)}
                </span>
              </div>
            </div>

            <strong className="hidden items-center border-l border-[#E5E5E5] px-3.5 py-3 text-xs font-semibold leading-normal text-[#6B7280] sm:flex">
              Document profile type
            </strong>
          </div>

          {queue.length > 0 && (
            <ul className="m-0 list-none p-0">
              {queue.map((item) => {
                const selected = selectedIds.has(item.id);

                return (
                  <li
                    key={item.id}
                    className={`${rowGrid} border-b border-[#E5E5E5] bg-white last:border-b-0 sm:min-h-14 ${
                      selected ? 'shadow-[inset_3px_0_0_#171717]' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 px-3 pb-1 pt-3 sm:px-4 sm:py-2.5">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={isStarting}
                        onChange={(event) => toggleSelected(item.id, event.target.checked)}
                        aria-label={`Select ${item.name}`}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-[#171717] disabled:cursor-not-allowed sm:h-4 sm:w-4"
                      />

                      <div className="flex min-w-0 items-center gap-[.75ch]">
                        <span
                          title={item.name}
                          className="block min-w-0 truncate text-sm font-semibold"
                        >
                          {nameWithoutExtension(item.name)}
                        </span>

                        <span className="shrink-0 whitespace-nowrap text-xs text-[#6B7280]">
                          {extensionOf(item.name)} - {formatFileSize(item.size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 px-3 pb-3 pt-1 sm:gap-2.5 sm:border-l sm:border-[#E5E5E5] sm:py-2.5 sm:pl-3.5 sm:pr-3">
                      <div className="min-w-0 flex-1">
                        <select
                          aria-label={`Document profile type for ${item.name}`}
                          value={item.profile}
                          disabled={isStarting}
                          onChange={(event) => updateProfile(item.id, event.target.value)}
                          className={selectCls}
                        >
                          {PROFILE_OPTIONS.map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={isStarting}
                        aria-label={`Remove ${item.name} from the queue`}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-gray-400 enabled:hover:bg-[#fff0f0] enabled:hover:text-[#a33636] disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {queue.length === 0 && (
            <div className="px-4 py-7 text-center">
              <span aria-hidden className="mb-2.5 block text-3xl text-gray-400">
                +
              </span>

              <p className="mb-1.5 text-sm font-semibold">No documents added yet</p>

              <span className="text-xs text-[#6B7280]">
                Add documents above to create your analysis queue.
              </span>
            </div>
          )}
        </section>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void handleStartAnalysis()}
            disabled={queue.length === 0 || isStarting}
            className={`${btnDark} w-full max-w-[320px] sm:w-auto sm:min-w-[260px] sm:px-8`}
          >
            {isStarting ? 'Uploading and starting analyses...' : 'Analyze documents'}
          </button>
        </div>

        {isStarting && (
          <p role="status" aria-live="polite" className="mt-3 text-center text-xs text-[#6B7280]">
            Please stay on this page until the documents have been submitted.
          </p>
        )}
      </section>
    </div>
  );
}
