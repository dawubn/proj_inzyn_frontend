// src/api/documentApi/documentApi.ts

import { API_URL, authorizedFetch } from '@/api/auth/auth';

export interface UploadedDocumentResponse {
  id: string;
  original_filename: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResponse {
  id: string;
  document_id: string;
  status: string;
  created_at: string;
}

export interface DocumentResponse {
  id: string;
  original_filename: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentsPage {
  items: DocumentResponse[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface DashboardAnalysis {
  id: string;
  document_id: string;
  status: string;
  created_at: string;
  processing_stage?: string;
  irregularities_count?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
}

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

  const response = await authorizedFetch(`${API_URL}/api/v1/documents?page=1&page_size=100`);

  if (!response.ok) {
    throw new Error('Failed to fetch last 7 days documents');
  }

  const data = (await response.json()) as DocumentsPage;
  const items = Array.isArray(data.items) ? data.items : [];

  return items.filter((doc) => {
    const created = new Date(doc.created_at);
    return created >= from && created <= now;
  });
}

export async function fetchDashboardAnalyses(limit = 50): Promise<DashboardAnalysis[]> {
  const response = await authorizedFetch(`${API_URL}/api/v1/redactions`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analyses');
  }

  const data = (await response.json()) as DashboardAnalysis[];
  if (!Array.isArray(data)) {
    return [];
  }

  return data.slice(0, limit);
}
