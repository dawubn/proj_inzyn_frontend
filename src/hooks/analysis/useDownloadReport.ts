import { useMutation } from '@tanstack/react-query';
import { fetchReportPdf, type ReportFile } from '@/api/documents-wrapper';

function saveFile({ blob, filename }: ReportFile) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking right after click() can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useDownloadReport() {
  return useMutation<void, Error, string>({
    mutationFn: async (analysisId) => saveFile(await fetchReportPdf(analysisId)),
  });
}
