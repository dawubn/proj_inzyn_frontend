import type {
  DocumentResponse,
  DocumentType,
  DocumentAnalysisResponse,
  PaginatedResponseDocumentResponse,
} from '@/api/generated/model';
import {
  uploadDocumentApiV1DocumentsPost,
  listUserDocumentsApiV1DocumentsGet,
} from '@/api/generated/documents/documents';
import {
  listRedactionsApiV1RedactionsGet,
  triggerLegalAnalysisApiV1RedactionsLegalAnalysisPost,
  getRedactionApiV1RedactionsAnalysisIdGet,
  deleteRedactionApiV1RedactionsAnalysisIdDelete,
} from '@/api/generated/redactions/redactions';

export interface UploadedDocumentResponse {
  id: string;
  filename?: string;
  original_filename?: string;
  status?: string;
}

export interface AnalysisResponse {
  id: string;
  status?: string;
  queue_position?: number | null;
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

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-detect',
  invoice: 'Invoice',
  contract: 'Contract',
  id_card: 'ID Card',
  passport: 'Passport',
  bank_statement: 'Bank Statement',
  tax_form: 'Tax Form',
  financial_report: 'Financial Report',
  government_tender: 'Government Tender',
  law_and_regulation: 'Law & Regulation',
  manual: 'Manual',
  patent: 'Patent',
  scientific_article: 'Scientific Article',
  lawsuit: 'Lawsuit',
  power_of_attorney: 'Power of Attorney',
  application: 'Application',
  unknown: 'Unknown',
  other: 'Other',
};

export function getDocumentTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Legal Analysis Report';
  return DOCUMENT_TYPE_LABELS[type] ?? type;
}

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
  queued: { label: 'Waiting for analysis', color: 'text-[#D97706]' },
  uploaded: { label: 'Queued', color: 'text-[#D97706]' },
  pending: { label: 'Queued', color: 'text-[#D97706]' },
  failed: { label: 'Problem with execution', color: 'text-[#B91C1C]' },
  archived: { label: 'Archived', color: 'text-[#6B7280]' },
  cancelled: { label: 'Cancelled', color: 'text-[#6B7280]' },
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

export async function uploadDocument(
  file: File,
  documentType = 'auto',
): Promise<UploadedDocumentResponse> {
  const response = await uploadDocumentApiV1DocumentsPost(
    { file, document_type: (documentType === 'auto' ? 'unknown' : documentType) as DocumentType },
    { credentials: 'include' },
  );
  if (response.status !== 201) throw new Error('Document upload failed');
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
    { credentials: 'include' },
  );

  if (response.status !== 202) {
    throw new Error('Document analysis failed');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysis = response.data as any;
  return {
    id: analysis.analysis_id || documentId,
    status: analysis.status,
    queue_position: analysis.queue_position ?? null,
  };
}

export async function cancelAnalysis(analysisId: string): Promise<DocumentAnalysisResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await fetch(
    `${apiUrl}/api/v1/redactions/${encodeURIComponent(analysisId)}/cancel`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 409 ? 'Analysis has already finished.' : 'Could not cancel the analysis.',
    );
  }

  return response.json() as Promise<DocumentAnalysisResponse>;
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

  return Array.from(documentMap.values())
    .slice(0, 10)
    .map((analysis) => ({
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
      suggested_document_type: null,
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
    suggested_document_type: null,
    description: null,
  }));
}

export async function fetchDocuments(
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponseDocumentResponse> {
  const response = await listUserDocumentsApiV1DocumentsGet(
    { page, page_size: pageSize },
    { credentials: 'include' },
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
    { credentials: 'include' },
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

export async function patchDocumentType(
  documentId: string,
  documentType: string,
): Promise<DocumentResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/v1/documents/${documentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ document_type: documentType }),
  });

  if (!response.ok) {
    throw new Error('Failed to update document type');
  }

  return response.json() as Promise<DocumentResponse>;
}

export async function confirmDocumentType(
  documentId: string,
  confirmedType: string,
): Promise<DocumentResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/v1/documents/${documentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ suggested_document_type: confirmedType }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm document type');
  }

  return response.json() as Promise<DocumentResponse>;
}

export async function getAnalysisStatus(analysisId: string): Promise<DocumentAnalysisResponse> {
  const response = await getRedactionApiV1RedactionsAnalysisIdGet(analysisId, {
    credentials: 'include',
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch analysis status');
  }

  return response.data as DocumentAnalysisResponse;
}

// Fetches every page of the user's documents (used where only a name lookup is needed)
export async function fetchAllDocuments(): Promise<DocumentResponse[]> {
  let page = 1;
  const all: DocumentResponse[] = [];

  while (true) {
    const response = await fetchDocuments(page, 100);
    all.push(...response.items);

    if (page >= response.pages) {
      break;
    }

    page += 1;
  }

  return all;
}

export type PreviewVariant = 'original' | 'redacted';

export interface PageInfo {
  page: number;
  width: number;
  height: number;
}

export interface PagesManifest {
  variants: PreviewVariant[];
  pages: PageInfo[];
}

export async function fetchPagesManifest(analysisId: string): Promise<PagesManifest> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/v1/redactions/${analysisId}/pages`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch document pages');
  }

  return response.json() as Promise<PagesManifest>;
}

export function getPageImageUrl(
  analysisId: string,
  page: number,
  variant: PreviewVariant,
  size: 'sm' | 'lg',
): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${apiUrl}/api/v1/redactions/${analysisId}/pages/${page}/image?variant=${variant}&size=${size}`;
}

export function getDocumentDownloadUrl(documentId: string): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${apiUrl}/api/v1/documents/${documentId}/download`;
}

export interface ReportFile {
  blob: Blob;
  filename: string;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = header.match(/filename="([^"]+)"/i);
  return plain ? plain[1] : null;
}

export async function fetchReportPdf(analysisId: string): Promise<ReportFile> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/v1/reports/${analysisId}/pdf`, {
    credentials: 'include',
  });

  if (response.status === 409) {
    throw new Error('The report will be available once the analysis is completed.');
  }
  if (!response.ok) {
    throw new Error('Failed to download the report. Please try again.');
  }

  return {
    blob: await response.blob(),
    filename:
      filenameFromDisposition(response.headers.get('Content-Disposition')) ??
      `report_${analysisId.slice(0, 8)}.pdf`,
  };
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
  const response = await deleteRedactionApiV1RedactionsAnalysisIdDelete(analysisId, {
    credentials: 'include',
  });

  if (response.status !== 204) {
    throw new Error('Failed to delete analysis');
  }
}
