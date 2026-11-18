type UploadedDocument = { id: string };
type Analysis = { id: string; status?: string };
type SubmissionApi = {
  upload: (file: File, documentType: string) => Promise<UploadedDocument>;
  start: (documentId: string) => Promise<Analysis>;
};

export function createDocumentSubmission(api: SubmissionApi) {
  let uploaded: { file: File; documentType: string; id: string } | null = null;
  return async (files: File[], documentType: string): Promise<Analysis> => {
    if (files.length !== 1) throw new Error('Select one document at a time.');
    const file = files[0];
    if (uploaded?.file !== file || uploaded.documentType !== documentType) {
      const document = await api.upload(file, documentType);
      uploaded = { file, documentType, id: document.id };
    }
    const result = await api.start(uploaded.id);
    uploaded = null;
    return result;
  };
}

export async function reanalyzeDocument<T>(
  documentId: string,
  documentType: string,
  api: {
    updateType: (documentId: string, documentType: string) => Promise<unknown>;
    start: (documentId: string) => Promise<T>;
  },
): Promise<T> {
  if (documentType !== 'auto') await api.updateType(documentId, documentType);
  return api.start(documentId);
}
