// src/api/documentApi/documentApi.Service.ts

import type { AllowedDocumentMimeType, StatusConfig, KnownStatus } from './documentApi.types';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_COUNT,
  STATUS_CONFIG_MAP,
  DEFAULT_STATUS_CONFIG,
} from './documentApi.types';
import { formatFileSize } from '@/lib/formatters';

function isKnownStatus(status: string): status is KnownStatus {
  return status in STATUS_CONFIG_MAP;
}

export function getStatusConfig(status: string | undefined): StatusConfig {
  if (!status || !isKnownStatus(status)) return DEFAULT_STATUS_CONFIG;
  return STATUS_CONFIG_MAP[status];
}

// Helpers below intentionally kept as named functions — they serve as
// readable intent markers in UI logic rather than raw string comparisons.
export function isProblem(status: string | undefined): boolean {
  return status === 'failed';
}

export function isDuringAnalysis(status: string | undefined): boolean {
  return status === 'processing';
}

export function getTotalFileSize(files: File[]): string {
  return formatFileSize(files.reduce((sum, file) => sum + file.size, 0));
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
