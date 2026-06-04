const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

export function getStatusConfig(status: string | undefined): { label: string; color: string } {
  switch (status) {
    case 'processed':
      return { label: 'Completed', color: 'text-[#65A30D]' };
    case 'processing':
      return { label: 'During analysis', color: 'text-[#0284C7]' };
    case 'queued':
    case 'uploaded':
    case 'pending':
      return { label: 'Queued', color: 'text-[#D97706]' };
    case 'failed':
      return { label: 'Problem with execution', color: 'text-[#B91C1C]' };
    case 'archived':
      return { label: 'Archived', color: 'text-[#6B7280]' };
    default:
      return { label: 'Unknown status', color: 'text-[#6B7280]' };
  }
}

export function isProblem(status: string | undefined): boolean {
  return status === 'failed';
}

export function isDuringAnalysis(status: string | undefined): boolean {
  return status === 'processing';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
  const invalidFile = files.find((file) => !allowedTypes.includes(file.type));

  if (invalidFile) {
    return 'Supported formats: PDF, JPG, PNG.';
  }

  return '';
}
