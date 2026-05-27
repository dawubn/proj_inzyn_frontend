import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getMe } from '@/api/auth';

interface DocumentItem {
  id: string;
  name: string;
  status: 'in_progress' | 'error' | 'completed';
  date: string;
}

interface Stats {
  analyzedLast30Days: number;
  irregularitiesLast30Days: number;
  avgAnalysisTime: string;
}

interface AttentionStats {
  documentsInProgress: number;
}

const STATUS_CONFIG: Record<DocumentItem['status'], { label: string; color: string }> = {
  in_progress: { label: 'During analysis', color: 'text-sky-600' },
  error: { label: 'Problem with execution', color: 'text-red-700' },
  completed: { label: 'Completed', color: 'text-lime-600' },
};

const EMPTY_RECENT_DOCUMENTS: DocumentItem[] = [];
const EMPTY_ATTENTION: AttentionStats = { documentsInProgress: 0 };
const EMPTY_STATS: Stats = {
  analyzedLast30Days: 0,
  irregularitiesLast30Days: 0,
  avgAnalysisTime: '00:00 min',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [recentDocuments, setRecentDocuments] = useState<DocumentItem[]>(EMPTY_RECENT_DOCUMENTS);
  const [attention, setAttention] = useState<AttentionStats>(EMPTY_ATTENTION);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    void fetch(`${import.meta.env.VITE_API_URL}/api/v1/documents/recent`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accesstoken')}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: DocumentItem[]) => {
        setRecentDocuments(Array.isArray(data) ? data : EMPTY_RECENT_DOCUMENTS);
      })
      .catch(() => setRecentDocuments(EMPTY_RECENT_DOCUMENTS));

    void fetch(`${import.meta.env.VITE_API_URL}/api/v1/documents/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accesstoken')}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Partial<Stats & AttentionStats>) => {
        setAttention({
          documentsInProgress:
            typeof data.documentsInProgress === 'number' ? data.documentsInProgress : 0,
        });
        setStats({
          analyzedLast30Days:
            typeof data.analyzedLast30Days === 'number' ? data.analyzedLast30Days : 0,
          irregularitiesLast30Days:
            typeof data.irregularitiesLast30Days === 'number' ? data.irregularitiesLast30Days : 0,
          avgAnalysisTime:
            typeof data.avgAnalysisTime === 'string' && data.avgAnalysisTime.trim().length > 0
              ? data.avgAnalysisTime
              : '00:00 min',
        });
      })
      .catch(() => {
        setAttention(EMPTY_ATTENTION);
        setStats(EMPTY_STATS);
      });

    void getMe()
      .then((user) => {
        const u = user as { fullname?: string; email?: string };
        const resolvedName =
          typeof u.fullname === 'string' && u.fullname.trim().length > 0 ? u.fullname : u.email;
        setUserName(resolvedName || 'User');
      })
      .catch(() => setUserName('User'));
  }, []);

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
              {recentDocuments.length === 0 ? (
                <p className="text-sm text-[#737373]">No documents yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentDocuments.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#111827]">{doc.name}</p>
                      <p
                        className={`truncate text-xs font-semibold ${STATUS_CONFIG[doc.status].color}`}
                      >
                        {STATUS_CONFIG[doc.status].label} • {doc.date}
                      </p>
                    </div>
                  ))}
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
                  {attention.documentsInProgress}
                </span>

                <Button className="h-10 rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A]">
                  Check your analysis history
                </Button>
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold text-[#111111]">Statistics</h2>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    label: 'Documents analyzed in the last 30 days',
                    value: stats.analyzedLast30Days,
                  },
                  {
                    label: 'Irregularities detected in the last 30 days',
                    value: stats.irregularitiesLast30Days,
                  },
                  {
                    label: 'Average analysis time',
                    value: stats.avgAnalysisTime,
                  },
                  {
                    label: 'Documents in progress',
                    value: attention.documentsInProgress,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <p className="break-words text-xs font-semibold leading-4 text-[#6B7280]">
                      {stat.label}
                    </p>
                    <p className="mt-2 break-words text-lg font-bold text-[#111827] tabular-nums">
                      {stat.value ?? 0}
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
