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

export type StatusConfig = {
  label: string;
  color: string;
};

export const QUEUED_STATUS_CONFIG: StatusConfig = {
  label: 'Queued',
  color: 'text-[#D97706]',
};

export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Unknown status',
  color: 'text-[#6B7280]',
};

export const STATUS_CONFIG_MAP = {
  processed: {
    label: 'Completed',
    color: 'text-[#65A30D]',
  },
  processing: {
    label: 'During analysis',
    color: 'text-[#0284C7]',
  },
  queued: QUEUED_STATUS_CONFIG,
  uploaded: QUEUED_STATUS_CONFIG,
  pending: QUEUED_STATUS_CONFIG,
  failed: {
    label: 'Problem with execution',
    color: 'text-[#B91C1C]',
  },
  archived: {
    label: 'Archived',
    color: 'text-[#6B7280]',
  },
} as const;

export type KnownStatus = keyof typeof STATUS_CONFIG_MAP;
