import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/auth/useMe';
import { useListRedactionsApiV1RedactionsGet } from '@/api/generated/redactions/redactions';
import { getStatusConfig } from '@/api/documents-wrapper';
import { formatDate } from '@/lib/formatters';

interface Analysis {
  id: string;
  document_id: string;
  status: string;
  created_at: string;
  processing_stage?: string;
  irregularities_count?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user } = useMe();

  const userName = user?.full_name?.trim() || user?.email || '';

  const { data: analysisData } = useListRedactionsApiV1RedactionsGet({
    query: {
      queryKey: ['recentAnalysis'],
    },
  });

  const analyses: Analysis[] = Array.isArray(analysisData?.data) ? analysisData.data : [];

  // Calculate total irregularities from all analyses
  const totalIrregularities = analyses.reduce((sum, analysis) => {
    const count = analysis.irregularities_count;
    return sum + (count?.critical || 0) + (count?.high || 0) + (count?.medium || 0);
  }, 0);

  return (
    <div className="w-full max-w-full px-1 sm:px-2 lg:h-full lg:overflow-hidden lg:px-4">
      <div className="mx-auto flex w-full max-w-400 flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:h-full lg:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="max-w-full overflow-hidden text-2xl font-semibold tracking-tight text-[#111111] sm:max-w-[70%] sm:text-[32px]">
              <h2 className="text-lg font-semibold text-[#111111]">Account:</h2>
              <span className="block truncate">{userName}</span>

            </h1>
            <Button
              onClick={() => navigate('/document-analysis')}
              className="h-10 w-full rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A] sm:w-auto sm:min-w-[190px]"
            >
              Add new documents
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-12 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.22fr_1fr] lg:items-stretch">
          <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5 lg:flex lg:flex-col lg:h-full">
            <h2 className="text-lg font-semibold text-[#111111]">Last analysis</h2>
            <div className="mt-4 flex-1 overflow-y-auto min-h-0">
              {analyses.length === 0 ? (
                <p className="text-sm text-[#737373]">No analysis yet.</p>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis) => {
                    const cfg = getStatusConfig(analysis.status);
                    return (
                      <div
                        key={analysis.id}
                        className="min-w-0 cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition"
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#111827]">
                              Analysis {analysis.id.slice(0, 8)}...
                            </p>
                            <p className={`truncate text-xs font-semibold ${cfg.color}`}>
                              {cfg.label} • {formatDate(analysis.created_at)}
                            </p>
                          </div>
                          {analysis.irregularities_count && (
                            <div className="flex gap-1.5 flex-shrink-0">
                              {analysis.irregularities_count.critical ? (
                                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                                  {analysis.irregularities_count.critical}
                                </span>
                              ) : null}
                              {analysis.irregularities_count.high ? (
                                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                                  {analysis.irregularities_count.high}
                                </span>
                              ) : null}
                              {analysis.irregularities_count.medium ? (
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                                  {analysis.irregularities_count.medium}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
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
                  {totalIrregularities}
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
                Analysis Statistics
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: 'Total analyses', value: analyses.length },
                  { label: 'Irregularities detected', value: totalIrregularities },
                  { label: 'Completed', value: analyses.filter(a => a.status === 'completed').length },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <p className="wrap-break-word text-xs font-semibold leading-4 text-[#6B7280]">
                      {stat.label}
                    </p>
                    <p className="mt-2 wrap-break-word text-lg font-bold text-[#111827] tabular-nums">
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
