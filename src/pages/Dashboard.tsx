// src/pages/Dashboard.tsx

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/auth/useMe';
import { fetchRecentDocuments, fetchDocumentsFromLast7Days } from '@/api/documentApi/documentApi';
import {
  getStatusConfig,
  isProblem,
  isDuringAnalysis,
} from '@/api/documentApi/documentApi.Service';
import { formatDate } from '@/lib/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user } = useMe();

  const userName = user?.full_name?.trim() || user?.email || '';

  const { data: documents = [] } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn: fetchRecentDocuments,
  });

  const { data: statisticsDocuments = [] } = useQuery({
    queryKey: ['documentsFromLast7Days'],
    queryFn: fetchDocumentsFromLast7Days,
  });

  const analyzedCount = statisticsDocuments.length;
  const irregularitiesCount = statisticsDocuments.filter((d) => isProblem(d.status)).length;
  const inProgressCount = statisticsDocuments.filter((d) => isDuringAnalysis(d.status)).length;

  return (
    <div className="w-full max-w-full px-1 sm:px-2 lg:h-full lg:overflow-hidden lg:px-4">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:h-full lg:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="max-w-full overflow-hidden text-2xl font-semibold tracking-tight text-[#111111] sm:max-w-[70%] sm:text-[32px]">
              <span className="block truncate">Hi, {userName}</span>
            </h1>
            <Button
              onClick={() => navigate('/document-analysis')}
              className="h-10 w-full rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A] sm:w-auto sm:min-w-[190px]"
            >
              Add new documents
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-12 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.22fr_1fr] lg:items-start">
          <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5 lg:min-h-[280px]">
            <h2 className="text-lg font-semibold text-[#111111]">Last documents analysis</h2>
            <div className="mt-4">
              {documents.length === 0 ? (
                <p className="text-sm text-[#737373]">No documents yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const cfg = getStatusConfig(doc.status);
                    return (
                      <div key={doc.id} className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#111827]">
                          {doc.original_filename}
                        </p>
                        <p className={`truncate text-xs font-semibold ${cfg.color}`}>
                          {cfg.label} • {formatDate(doc.created_at)}
                        </p>
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
                  {irregularitiesCount}
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
              <h2 className="text-lg font-semibold text-[#111111]">
                Statistics from the last 7 days
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: 'Documents analyzed', value: analyzedCount },
                  { label: 'Irregularities detected', value: irregularitiesCount },
                  { label: 'Documents in progress', value: inProgressCount },
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
