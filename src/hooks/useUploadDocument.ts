import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadedDocumentResponse } from '@/api/documents.types';
import { uploadDocument } from '@/api/documents';

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<UploadedDocumentResponse, Error, File>({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      // po udanym uploadzie odświeżamy listy dokumentów
      void queryClient.invalidateQueries({
        queryKey: ['documents'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['recent-documents'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents-last-7-days'],
      });
    },
  });
}
