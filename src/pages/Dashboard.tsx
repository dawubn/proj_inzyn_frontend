// src/pages/Dashboard.tsx

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
<<<<<<< Updated upstream

import { Button } from '@/components/ui/button';
import { getUserDisplayName } from '@/api/auth/auth';
import { useMe } from '@/hooks/auth/useMe';
import { fetchRecentDocuments, fetchDocumentsFromLast7Days } from '@/api/documentApi/documentApi';
import { getDocumentStatus } from '@/api/documentApi/documentApi.Service';
import { formatDate } from '@/lib/formatters';
=======
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/auth/useMe';
import { getStatusConfig } from '@/api/documents-wrapper';
import { formatDate } from '@/lib/formatters';
import { fetchDashboardAnalyses, type DashboardAnalysis } from '@/api/documentApi/documentApi';

const MAX_ANALYSES_FOR_STATS = 50;
const MAX_ANALYSES_IN_LIST = 10;
>>>>>>> Stashed changes

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user } = useMe();

  const userName = getUserDisplayName(user);

<<<<<<< Updated upstream
  const { data: documents = [] } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn: fetchRecentDocuments,
  });

  const { data: statisticsDocuments = [] } = useQuery({
    queryKey: ['documentsFromLast7Days'],
    queryFn: fetchDocumentsFromLast7Days,
  });

  const analyzedCount = statisticsDocuments.length;
  const irregularitiesCount = statisticsDocuments.filter(
    (d) => getDocumentStatus(d.status).isProblem,
  ).length;
  const inProgressCount = statisticsDocuments.filter(
    (d) => getDocumentStatus(d.status).isDuringAnalysis,
  ).length;
=======
  const { data: allAnalysesRaw, isLoading: isRedactionsLoading } = useQuery<DashboardAnalysis[]>({
    queryKey: ['dashboard-analyses'],
    queryFn: () => fetchDashboardAnalyses(MAX_ANALYSES_FOR_STATS),
    staleTime: 60_000,
  });

  const allAnalyses: DashboardAnalysis[] = Array.isArray(allAnalysesRaw) ? allAnalysesRaw : [];

  const analyses: DashboardAnalysis[] = allAnalyses.slice(0, MAX_ANALYSES_IN_LIST);

  const analysesWithLabels = allAnalyses.map((analysis) => {
    const cfg = getStatusConfig(analysis.status);
    return {
      analysis,
      label: cfg.label,
      cfg,
    };
  });

  const isFailed = (label: string) => {
    const l = label.toLowerCase();
    return l.includes('failed') || l.includes('error');
  };

  const isPending = (label: string) => {
    const l = label.toLowerCase();
    return l.includes('pending') || l.includes('progress');
  };

  const isCompleted = (label: string) => {
    const l = label.toLowerCase();
    return l.includes('completed');
  };

  const documentsRequiringAttention = analysesWithLabels.filter(({ label }) =>
    isFailed(label),
  ).length;

  const irregularitiesDetected = analysesWithLabels.filter(({ label }) => isPending(label)).length;

  const totalAnalyses = allAnalyses.length;

  const completedAnalyses = analysesWithLabels.filter(({ label }) => isCompleted(label)).length;
>>>>>>> Stashed changes

  return (
    <div className="w-full max-w-full px-1 sm:px-2 lg:h-full lg:overflow-hidden lg:px-4">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:h-full lg:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
<<<<<<< Updated upstream
            <h1 className="max-w-full overflow-hidden text-2xl font-semibold tracking-tight text-[#111111] sm:max-w-[70%] sm:text-[32px]">
              <span className="block truncate">{userName ? `Hi, ${userName}` : 'Hi'}</span>
            </h1>
=======
            <div className="max-w-full overflow-hidden sm:max-w-[70%]">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[#111111] sm:text-[32px]">
                Hi, {userName}
              </h1>
            </div>
>>>>>>> Stashed changes
            <Button
              onClick={() => navigate('/document-analysis')}
              className="h-10 w-full rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A] sm:w-auto sm:min-w-[190px]"
            >
              Add new documents
            </Button>
          </div>
        </div>

<<<<<<< Updated upstream
        <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-12 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.22fr_1fr] lg:items-start">
          <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5 lg:min-h-[280px]">
            <h2 className="text-lg font-semibold text-[#111111]">Last documents analysis</h2>
            <div className="mt-4">
              {documents.length === 0 ? (
                <p className="text-sm text-[#737373]">No documents yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const status = getDocumentStatus(doc.status);
                    return (
                      <div key={doc.id} className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#111827]">
                          {doc.original_filename}
                        </p>
                        <p className={`truncate text-xs font-semibold ${status.color}`}>
                          {status.label} • {formatDate(doc.created_at)}
                        </p>
=======
        <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-12 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.22fr_1fr] lg:items-stretch">
          <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm sm:p-4 lg:flex lg:flex-col lg:h-full">
            <h2 className="text-base sm:text-lg font-semibold text-[#111111]">Last analysis</h2>
            <div className="mt-3 flex-1 overflow-y-auto min-h-0">
              {isRedactionsLoading ? (
                <p className="text-xs sm:text-sm text-[#737373]">Loading...</p>
              ) : analyses.length === 0 ? (
                <p className="text-xs sm:text-sm text-[#737373]">No analysis yet.</p>
              ) : (
                <div className="space-y-2">
                  {analyses.map((analysis) => {
                    const cfg = getStatusConfig(analysis.status);
                    return (
                      <div
                        key={analysis.id}
                        className="min-w-0 cursor-pointer rounded-md px-2 py-1.5 hover:bg-gray-50 transition"
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs sm:text-sm font-medium text-[#111827] leading-tight">
                              Analysis {analysis.id.slice(0, 8)}...
                            </p>
                            <p
                              className={`truncate text-[10px] sm:text-xs font-semibold leading-tight ${cfg.color}`}
                            >
                              {cfg.label} • {formatDate(analysis.created_at)}
                            </p>
                          </div>
                          {analysis.irregularities_count && (
                            <div className="flex gap-1 flex-shrink-0">
                              {analysis.irregularities_count.critical ? (
                                <span className="bg-red-100 text-red-800 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded">
                                  {analysis.irregularities_count.critical}
                                </span>
                              ) : null}
                              {analysis.irregularities_count.high ? (
                                <span className="bg-orange-100 text-orange-800 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded">
                                  {analysis.irregularities_count.high}
                                </span>
                              ) : null}
                              {analysis.irregularities_count.medium ? (
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded">
                                  {analysis.irregularities_count.medium}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
>>>>>>> Stashed changes
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold leading-tight text-[#111111]">
                Documents requiring attention
              </h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-4xl font-semibold tracking-tight text-black tabular-nums">
<<<<<<< Updated upstream
                  {irregularitiesCount}
=======
                  {documentsRequiringAttention}
>>>>>>> Stashed changes
                </span>
                <Button
                  onClick={() => navigate('/history')}
                  className="h-10 rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A]"
                >
                  Check your analysis history
                </Button>
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5">
<<<<<<< Updated upstream
              <h2 className="text-lg font-semibold text-[#111111]">
                Statistics from the last 7 days
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: 'Documents analyzed', value: analyzedCount },
                  { label: 'Irregularities detected', value: irregularitiesCount },
                  { label: 'Documents in progress', value: inProgressCount },
=======
              <h2 className="text-lg font-semibold text-[#111111]">Analysis Statistics</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: 'Total analyses', value: totalAnalyses },
                  { label: 'Irregularities detected', value: irregularitiesDetected },
                  { label: 'Completed', value: completedAnalyses },
>>>>>>> Stashed changes
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <p className="break-words text-xs font-semibold leading-4 text-[#6B7280]">
                      {stat.label}
                    </p>
                    <p className="mt-2 break-words text-lg font-bold text-[#111827] tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
