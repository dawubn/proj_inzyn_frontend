// src/api/documentApi/documentApi.types.ts

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

export interface DocumentResponse {
  id: string;
  original_filename: string;
  status: string;
  created_at: string;
}

export interface DocumentsPage {
  items: DocumentResponse[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export type AllowedDocumentMimeType = 'application/pdf' | 'image/jpeg' | 'image/png';

export const ALLOWED_DOCUMENT_MIME_TYPES: AllowedDocumentMimeType[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

// Both limits must stay in sync with server-side multipart and file count constraints.
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES_COUNT = 5;

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
} as const;

export type KnownStatus = keyof typeof STATUS_CONFIG_MAP;
