// src/hooks/documents/useDocumentsFromLast7Days.ts
import { useQuery } from '@tanstack/react-query';
import type { DocumentResponse } from '@/api/generated/model';
import { fetchDocumentsFromLast7Days } from '@/api/documents-wrapper';

export function useDocumentsFromLast7Days() {
  return useQuery<DocumentResponse[], Error>({
    queryKey: ['documents-last-7-days'],
    queryFn: () => fetchDocumentsFromLast7Days(),
  });
}
