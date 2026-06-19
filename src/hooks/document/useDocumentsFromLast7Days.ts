// src/hooks/documents/useDocumentsFromLast7Days.ts
import { useQuery } from '@tanstack/react-query';
import type { DocumentResponse } from '@/api/documentApi/documentApi.types';
import { fetchDocumentsFromLast7Days } from '@/api/documentApi/documentApi';

export function useDocumentsFromLast7Days() {
  return useQuery<DocumentResponse[], Error>({
    queryKey: ['documents-last-7-days'],
    queryFn: () => fetchDocumentsFromLast7Days(),
  });
}
