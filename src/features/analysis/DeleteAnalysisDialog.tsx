import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteAnalysis } from '@/hooks/analysis/useDeleteAnalysis';

export interface AnalysisToDelete {
  id: string;
  /** Shown in the dialog so the user knows exactly what is being deleted. */
  name: string;
}

interface DeleteAnalysisDialogProps {
  analysis: AnalysisToDelete | null;
  onClose: () => void;
  onDeleted?: (analysisId: string) => void;
}

/** Confirmation dialog that deletes the analysis on confirm; stays open with an error on failure. */
export function DeleteAnalysisDialog({ analysis, onClose, onDeleted }: DeleteAnalysisDialogProps) {
  const deleteMutation = useDeleteAnalysis();
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (open || deleteMutation.isPending) return;
    setError(null);
    onClose();
  };

  const handleDelete = () => {
    if (!analysis) return;
    setError(null);
    deleteMutation.mutate(analysis.id, {
      onSuccess: () => {
        onClose();
        onDeleted?.(analysis.id);
      },
      onError: () => setError('Failed to delete the analysis. Please try again.'),
    });
  };

  return (
    <AlertDialog open={analysis != null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <AlertDialogTitle>Delete analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium break-all text-gray-900">{analysis?.name}</span> and its
              results will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            className="h-10 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </AlertDialogCancel>
          {/* Not AlertDialogAction: that closes immediately, before the delete finishes */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-10 cursor-pointer rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
