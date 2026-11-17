import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Brain, ShieldCheck } from 'lucide-react';

import { fetchAnalysisOptions } from '@/api/documents-wrapper';
import type { AnalysisOptions } from '@/api/generated/model';
import { Card, CardContent } from '@/components/ui/card';
import {
  COST_LABELS,
  QUALITY_LABELS,
  REDACTION_CATEGORY_LABELS,
  SPEED_LABELS,
  analysisModelInfo,
} from '@/lib/analysisOptions';

type AnalysisConfigCardProps = {
  options: AnalysisOptions | undefined;
  legalResult: unknown;
};

const chipCls =
  'inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-gray-700';

/** The settings an analysis was run with: anonymization and the AI model. */
export function AnalysisConfigCard({ options, legalResult }: AnalysisConfigCardProps) {
  const model = analysisModelInfo(options, legalResult);

  // Only used to describe the model; the card works without it
  const { data: available } = useQuery({
    queryKey: ['analysis-options'],
    queryFn: fetchAnalysisOptions,
    staleTime: 5 * 60_000,
    retry: 1,
    enabled: Boolean(model.name),
  });
  const profile = available?.ai_models.find((item) => item.name === model.name);

  const anonymized = options?.anonymization_enabled !== false;
  const categories = options?.redaction_categories ?? [];

  return (
    <Card className="shrink-0 rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0">
      <CardContent className="p-3 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">Analysis Settings</h2>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Brain size={13} aria-hidden />
              AI model
            </dt>
            <dd className="mt-1">
              {model.name ? (
                <span className="font-mono text-sm font-semibold text-gray-900">{model.name}</span>
              ) : (
                <span className="text-gray-700">{model.fallback}</span>
              )}
              {profile?.cost && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className={chipCls}>{COST_LABELS[profile.cost]}</span>
                  {profile.speed && <span className={chipCls}>{SPEED_LABELS[profile.speed]}</span>}
                  {profile.quality && (
                    <span className={chipCls}>{QUALITY_LABELS[profile.quality]}</span>
                  )}
                </div>
              )}
              {profile?.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                  {profile.description}
                </p>
              )}
            </dd>
          </div>

          <div className="border-t border-[#F0F0F0] pt-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <ShieldCheck size={13} aria-hidden />
              Anonymization
            </dt>
            <dd className="mt-1">
              {anonymized ? (
                <>
                  <span className="text-gray-900">On</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {categories.map((category) => (
                      <span key={category} className={chipCls}>
                        {REDACTION_CATEGORY_LABELS[category] ?? category}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <span className="flex items-start gap-1.5 text-amber-900">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
                  Off: the document was processed with personal data visible
                </span>
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
