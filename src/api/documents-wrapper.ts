import type { DocumentResponse, DocumentAnalysisResponse, PaginatedResponseDocumentResponse } from '@/api/generated/model';
import { uploadDocumentApiV1DocumentsPost, listUserDocumentsApiV1DocumentsGet } from '@/api/generated/documents/documents';
import { listRedactionsApiV1RedactionsGet, triggerLegalAnalysisApiV1RedactionsLegalAnalysisPost, getRedactionApiV1RedactionsAnalysisIdGet } from '@/api/generated/redactions/redactions';

export interface UploadedDocumentResponse {
  id: string;
  filename?: string;
  original_filename?: string;
  status?: string;
}

export interface AnalysisResponse {
  id: string;
  status?: string;
}

export interface DocumentsPage {
  items: DocumentResponse[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES_COUNT = 5;

export type AllowedDocumentMimeType = 'application/pdf' | 'image/jpeg' | 'image/png';

export const ALLOWED_DOCUMENT_MIME_TYPES: AllowedDocumentMimeType[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function validateFiles(files: File[]): string {
  if (files.length > MAX_FILES_COUNT)
    return `You can upload up to ${MAX_FILES_COUNT} files at once.`;

  const invalidType = files.find(
    (file) => !ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as AllowedDocumentMimeType),
  );
  if (invalidType) return 'Supported formats: PDF, JPG, PNG.';

  const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
  if (oversized) return `File size must not exceed ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`;

  return '';
}

export function getTotalFileSize(files: File[]): string {
  return formatFileSize(files.reduce((sum, file) => sum + file.size, 0));
}

export type StatusConfig = {
  label: string;
  color: string;
};

export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Unknown status',
  color: 'text-[#6B7280]',
};

export const STATUS_CONFIG_MAP = {
  processed: { label: 'Completed', color: 'text-[#65A30D]' },
  processing: { label: 'During analysis', color: 'text-[#0284C7]' },
  queued: { label: 'Queued', color: 'text-[#D97706]' },
  uploaded: { label: 'Queued', color: 'text-[#D97706]' },
  pending: { label: 'Queued', color: 'text-[#D97706]' },
  failed: { label: 'Problem with execution', color: 'text-[#B91C1C]' },
  archived: { label: 'Archived', color: 'text-[#6B7280]' },
  completed: { label: 'Completed', color: 'text-[#65A30D]' },
  in_progress: { label: 'In progress', color: 'text-[#0284C7]' },
  ocr_in_progress: { label: 'OCR in progress', color: 'text-[#0284C7]' },
  ocr_completed: { label: 'OCR completed', color: 'text-[#65A30D]' },
  ocr_failed: { label: 'OCR failed', color: 'text-[#B91C1C]' },
  classifying: { label: 'Classifying', color: 'text-[#0284C7]' },
  validating: { label: 'Validating', color: 'text-[#0284C7]' },
} as const;

export type KnownStatus = keyof typeof STATUS_CONFIG_MAP;

function isKnownStatus(status: string): status is KnownStatus {
  return status in STATUS_CONFIG_MAP;
}

export function getStatusConfig(status: string | undefined): StatusConfig {
  if (!status || !isKnownStatus(status)) return DEFAULT_STATUS_CONFIG;
  return STATUS_CONFIG_MAP[status];
}

export function isProblem(status: string | undefined): boolean {
  return status === 'failed';
}

export function isDuringAnalysis(status: string | undefined): boolean {
  return status === 'processing';
}

export async function uploadDocument(file: File): Promise<UploadedDocumentResponse> {
  const response = await uploadDocumentApiV1DocumentsPost(
    { file },
    { credentials: 'include' }
  );

  if (response.status !== 201) {
    throw new Error('Document upload failed');
  }

  const doc = response.data as DocumentResponse;
  return {
    id: doc.id,
    filename: doc.original_filename,
    original_filename: doc.original_filename,
    status: doc.status,
  };
}

export async function startDocumentAnalysis(documentId: string): Promise<AnalysisResponse> {
  const response = await triggerLegalAnalysisApiV1RedactionsLegalAnalysisPost(
    undefined,
    { document_id: documentId },
    { credentials: 'include' }
  );

  if (response.status !== 202) {
    throw new Error('Document analysis failed');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysis = response.data as any;
  return {
    id: analysis.analysis_id || documentId,
    status: analysis.status,
  };
}

export async function fetchRecentDocuments(): Promise<DocumentResponse[]> {
  const response = await listRedactionsApiV1RedactionsGet({
    credentials: 'include',
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch documents');
  }

  const analyses = response.data as DocumentAnalysisResponse[];
  const documentMap = new Map<string, DocumentAnalysisResponse>();

  analyses.forEach((analysis) => {
    if (!documentMap.has(analysis.document_id)) {
      documentMap.set(analysis.document_id, analysis);
    }
  });

  return Array.from(documentMap.values()).slice(0, 10).map((analysis) => ({
    id: analysis.document_id,
    original_filename: `Document ${analysis.id}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: analysis.status as any,
    created_at: analysis.created_at,
    updated_at: analysis.updated_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file_extension: 'pdf' as any,
    file_size_bytes: 0,
    mime_type: 'application/pdf',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document_type: 'unknown' as any,
    description: null,
  }));
}

export async function fetchDocumentsFromLast7Days(): Promise<DocumentResponse[]> {
  const response = await listRedactionsApiV1RedactionsGet({
    credentials: 'include',
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch last 7 days documents');
  }

  const analyses = response.data as DocumentAnalysisResponse[];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const documentMap = new Map<string, DocumentAnalysisResponse>();

  analyses.forEach((analysis) => {
    const createdAt = new Date(analysis.created_at);
    if (createdAt >= sevenDaysAgo && !documentMap.has(analysis.document_id)) {
      documentMap.set(analysis.document_id, analysis);
    }
  });

  return Array.from(documentMap.values()).map((analysis) => ({
    id: analysis.document_id,
    original_filename: `Document ${analysis.id}`,
    status: analysis.status as any,
    created_at: analysis.created_at,
    updated_at: analysis.updated_at,
    file_extension: 'pdf' as any,
    file_size_bytes: 0,
    mime_type: 'application/pdf',
    document_type: 'unknown' as any,
    description: null,
  }));
}

export async function fetchDocuments(page: number = 1, pageSize: number = 20): Promise<PaginatedResponseDocumentResponse> {
  const response = await listUserDocumentsApiV1DocumentsGet(
    { page, page_size: pageSize },
    { credentials: 'include' }
  );

  if (response.status !== 200) {
    throw new Error('Failed to fetch documents');
  }

  return response.data as PaginatedResponseDocumentResponse;
}

export async function triggerLegalAnalysis(documentId: string): Promise<{ analysis_id: string }> {
  const response = await triggerLegalAnalysisApiV1RedactionsLegalAnalysisPost(
    undefined,
    { document_id: documentId },
    { credentials: 'include' }
  );

  if (response.status !== 202) {
    throw new Error('Failed to trigger legal analysis');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = response.data as any;
  return {
    analysis_id: result.analysis_id,
  };
}

export async function getAnalysisStatus(analysisId: string): Promise<DocumentAnalysisResponse> {
  const response = await getRedactionApiV1RedactionsAnalysisIdGet(
    analysisId,
    { credentials: 'include' }
  );

  if (response.status !== 200) {
    throw new Error('Failed to fetch analysis status');
  }

  return response.data as DocumentAnalysisResponse;
}
