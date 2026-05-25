const API_URL = import.meta.env.VITE_API_URL;

export interface UploadedDocumentResponse {
  id: string;
  filename?: string;
  original_filename?: string;
  status?: string;
}

export interface AnalysisResponse {
  id: string;
  status?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function uploadDocument(file: File): Promise<UploadedDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/v1/documents`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Document upload failed");
  }

  return response.json();
}

export async function startDocumentAnalysis(
  documentId: string,
): Promise<AnalysisResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/documents/${documentId}/analyses`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Document analysis failed");
  }

  return response.json();
}