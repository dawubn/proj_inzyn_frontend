// src/api/documentApi/documentApi.ts

import { getApiUrl, getAuthHeaders } from '@/api/http';
import type {
  UploadedDocumentResponse,
  AnalysisResponse,
  DocumentResponse,
  DocumentsPage,
} from './documentApi.types';

const API_URL = getApiUrl();

export async function uploadDocument(file: File): Promise<UploadedDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/v1/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Document upload failed');
  }

  return response.json();
}

export async function startDocumentAnalysis(documentId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/api/v1/documents/${documentId}/analyses`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Document analysis failed');
  }

  return response.json();
}

export async function fetchRecentDocuments(): Promise<DocumentResponse[]> {
  const response = await fetch(`${API_URL}/api/v1/documents?page=1&page_size=10`, {
    headers: getAuthHeaders(),
  });

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

  const response = await fetch(
    `${API_URL}/api/v1/documents?page=1&page_size=100&date_from=${dateFrom}&date_to=${dateTo}`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch last 7 days documents');
  }

  const data = (await response.json()) as DocumentsPage;
  return Array.isArray(data.items) ? data.items : [];
}
