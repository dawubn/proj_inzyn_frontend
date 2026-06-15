//src/hooks/analysis/useFileSelection.ts

import { useState } from 'react';
import { validateFiles } from '@/api/documentApi/documentApi.Service';

export type FileEntry = {
  id: string;
  file: File;
};

export function useFileSelection() {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedFiles = fileEntries.map((e) => e.file);

  function handleFiles(files: File[]) {
    const merged = [...selectedFiles, ...files];
    const validationError = validateFiles(merged);
    setErrorMessage(validationError);

    if (validationError) return;

    const newEntries = files.map((file) => ({ id: crypto.randomUUID(), file }));
    setFileEntries((current) => [...current, ...newEntries]);
  }

  function handleRemoveFile(id: string) {
    setFileEntries((current) => current.filter((e) => e.id !== id));
    setErrorMessage('');
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) handleFiles(files);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) handleFiles(files);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  return {
    fileEntries,
    selectedFiles,
    errorMessage,
    setErrorMessage,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handleRemoveFile,
  };
}
