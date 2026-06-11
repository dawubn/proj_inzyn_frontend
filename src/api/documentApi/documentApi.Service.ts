// src/api/documentApi/documentService.ts

import type { AllowedDocumentMimeType, StatusConfig, KnownStatus } from './documentApi.types';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  STATUS_CONFIG_MAP,
  DEFAULT_STATUS_CONFIG,
} from './documentApi.types';

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

export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

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
