// src/api/documentService.ts

import type { AllowedDocumentMimeType, StatusConfig, KnownStatus } from './documents.types';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  STATUS_CONFIG_MAP,
  DEFAULT_STATUS_CONFIG,
} from './documents.types';
import { formatDate, formatFileSize } from '@/lib/formatters'; // albo względna ścieżka

function isKnownStatus(status: string): status is KnownStatus {
  return status in STATUS_CONFIG_MAP;
}

export function getStatusConfig(status: string | undefined): StatusConfig {
  if (!status || !isKnownStatus(status)) {
    return DEFAULT_STATUS_CONFIG;
  }

  return STATUS_CONFIG_MAP[status];
}

export function isProblem(status: string | undefined): boolean {
  return status === 'failed';
}

export function isDuringAnalysis(status: string | undefined): boolean {
  return status === 'processing';
}

export { formatDate, formatFileSize };

export function getTotalFileSize(files: File[]): string {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return formatFileSize(totalSize);
}

export function validateFiles(files: File[]): string {
  const invalidFile = files.find(
    (file) => !ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as AllowedDocumentMimeType),
  );

  if (invalidFile) {
    return 'Supported formats: PDF, JPG, PNG.';
  }

  return '';
}
