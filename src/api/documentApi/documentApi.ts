// src/api/documentApi/documentApi.ts

import { API_URL, authorizedFetch } from '@/api/auth/auth';
import type {
  UploadedDocumentResponse,
  AnalysisResponse,
  DocumentResponse,
  DocumentsPage,
} from './documentApi.types';

export async function uploadDocument(file: File): Promise<UploadedDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authorizedFetch(`${API_URL}/api/v1/documents`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Document upload failed');
  }

  return response.json();
}

export async function startDocumentAnalysis(documentId: string): Promise<AnalysisResponse> {
  const response = await authorizedFetch(`${API_URL}/api/v1/documents/${documentId}/analyses`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Document analysis failed');
  }

  return response.json();
}

export async function fetchRecentDocuments(): Promise<DocumentResponse[]> {
  const response = await authorizedFetch(`${API_URL}/api/v1/documents?page=1&page_size=10`);

  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  const data = (await response.json()) as DocumentsPage;
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchDocumentsFromLast7Days(): Promise<DocumentResponse[]> {
  const now = new Date();
  const from = new Date();
  from.setDate(now.getDate() - 7);

  const dateFrom = from.toISOString().split('T')[0];
  const dateTo = now.toISOString().split('T')[0];

  const response = await authorizedFetch(
    `${API_URL}/api/v1/documents?page=1&page_size=100&date_from=${dateFrom}&date_to=${dateTo}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch last 7 days documents');
  }

  const data = (await response.json()) as DocumentsPage;
  return Array.isArray(data.items) ? data.items : [];
}
