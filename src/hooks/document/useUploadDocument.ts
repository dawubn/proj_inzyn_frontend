// src/hooks/documents/useUploadDocument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadedDocumentResponse } from '@/api/documentApi/documentApi.types';
import { uploadDocument } from '@/api/documentApi/documentApi';

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<UploadedDocumentResponse, Error, File>({
    mutationFn: (file) => uploadDocument(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['documents-last-7-days'] });
    },
  });
}
