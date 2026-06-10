import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { uploadDocument, startDocumentAnalysis } from "@/api/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getTotalFileSize(files: File[]) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return formatFileSize(totalSize);
}

export default function DocumentAnalysis() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("automatic");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  function validateFiles(files: File[]) {
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type));

    if (invalidFile) {
      return "Supported formats: PDF, JPG, PNG.";
    }

    return "";
  }

  function handleFileSelect(files: File[]) {
    const validationError = validateFiles(files);

    setErrorMessage("");

    if (validationError) {
      setSelectedFiles([]);
      setErrorMessage(validationError);
      return;
    }

    setSelectedFiles(files);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      handleFileSelect(files);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files ?? []);

    if (files.length > 0) {
      handleFileSelect(files);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  async function handleStartAnalysis() {
    if (selectedFiles.length === 0) {
      setErrorMessage("Select at least one document first.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setErrorMessage("");

      const progressInterval = window.setInterval(() => {
        setProgress((currentProgress) => {
          if (currentProgress >= 85) {
            return currentProgress;
          }

          return currentProgress + 5;
        });
      }, 300);

      for (const file of selectedFiles) {
        console.log("Uploading file:", file.name);

        const uploadedDocument = await uploadDocument(file);

        console.log("Uploaded document:", uploadedDocument);

        await startDocumentAnalysis(uploadedDocument.id);

        console.log("Analysis started for:", file.name);
      }

      window.clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        navigate("/analysis-result");
      }, 1200);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while processing the documents.");
      setIsProcessing(false);
      setProgress(0);
    }
  }

  if (isProcessing && selectedFiles.length > 0) {
    return (
      <div className="flex min-h-[calc(100vh-220px)] items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold">Document Processing</h1>

          <div className="mx-auto mt-14 rounded-xl border border-gray-300 px-8 py-5">
            <p className="text-xl font-bold">
              {selectedFiles.length} selected files
            </p>
            <p className="text-xl font-bold">
              {getTotalFileSize(selectedFiles)}
            </p>
          </div>

          <p className="mt-10 text-sm font-semibold">{progress}%</p>

          <Progress
            value={progress}
            className="mt-3 h-3 bg-gray-200 [&>div]:bg-slate-950"
          />

          <p className="mt-5 text-sm text-gray-700">
            Your documents are being analyzed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center">
      <Card className="w-full max-w-3xl border border-gray-200 bg-gray-50 shadow-none ring-0">
        <CardContent className="px-20 py-10">
          <h1 className="text-center text-4xl font-bold">Upload Documents</h1>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mx-auto mt-16 flex max-w-sm flex-col items-center rounded-xl border border-dashed border-black bg-white px-10 py-14 text-center"
          >
            <p className="text-xl font-bold">
              Drag the files here
              <br />
              or
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleInputChange}
              className="hidden"
            />

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 w-40 cursor-pointer bg-slate-950 text-white hover:bg-slate-900"
            >
              [Select files]
            </Button>
          </div>

          <p className="mt-3 text-center text-sm">
            Supported formats: PDF, JPG, PNG
          </p>

          {selectedFiles.length > 0 && (
            <div className="mx-auto mt-5 max-w-sm rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">
                Selected files:
              </p>

              <div className="mt-3 space-y-2">
                {selectedFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-4 text-sm text-gray-600"
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="mt-4 text-center text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="mx-auto mt-16 max-w-sm">
            <label className="text-sm font-medium">
              Select a Documents profile:
            </label>

            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger className="mt-4 w-full border border-gray-200 bg-white ring-0 focus:ring-0 [&_svg]:text-gray-400">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>

              <SelectContent
                className="border border-gray-200 bg-white shadow-lg ring-0"
                position="popper"
              >
                <SelectItem
                  value="automatic"
                  className="cursor-pointer focus:bg-gray-100"
                >
                  Automatic Recognition
                </SelectItem>

                <SelectItem
                  value="invoice"
                  className="cursor-pointer focus:bg-gray-100"
                >
                  Invoice
                </SelectItem>

                <SelectItem
                  value="contract"
                  className="cursor-pointer focus:bg-gray-100"
                >
                  Contract
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            disabled={selectedFiles.length === 0}
            onClick={handleStartAnalysis}
            className="mx-auto mt-20 flex h-14 w-full max-w-sm cursor-pointer bg-slate-950 text-base font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start your analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
