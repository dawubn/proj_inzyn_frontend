import { useId } from 'react';
import { AlertTriangle } from 'lucide-react';

import type {
  AiModelOption,
  AnalysisOptionsResponse,
  RedactionCategory,
} from '@/api/generated/model';
import {
  COST_LABELS,
  QUALITY_LABELS,
  REDACTION_CATEGORY_LABELS,
  SPEED_LABELS,
  aiModelSummary,
  analysisSettingsError,
  effectiveAiModel,
  formatTestCost,
} from '@/lib/analysisOptions';
import type { AnalysisSettings } from '@/lib/analysisOptions';

type AnalysisSettingsPanelProps = {
  settings: AnalysisSettings;
  onChange: (settings: AnalysisSettings) => void;
  available: AnalysisOptionsResponse | undefined;
  isLoading: boolean;
  disabled: boolean;
};

const checkboxCls =
  'h-5 w-5 shrink-0 cursor-pointer accent-[#171717] disabled:cursor-not-allowed sm:h-4 sm:w-4';

const selectCls =
  'block min-h-11 w-full min-w-0 cursor-pointer rounded-lg border border-gray-300 bg-white py-1.5 pl-2.5 pr-7 text-base text-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:text-sm';

const groupCls = 'min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-3 sm:p-4';

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

const LEVEL_TONE: Record<string, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  fast: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  best: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  medium: 'border-gray-200 bg-gray-50 text-gray-700',
  good: 'border-gray-200 bg-gray-50 text-gray-700',
  high: 'border-amber-200 bg-amber-50 text-amber-900',
  slow: 'border-amber-200 bg-amber-50 text-amber-900',
  basic: 'border-amber-200 bg-amber-50 text-amber-900',
};

function Badge({ level, children }: { level: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 ${LEVEL_TONE[level] ?? LEVEL_TONE.medium}`}
    >
      {children}
    </span>
  );
}

function ModelDetails({ model }: { model: AiModelOption }) {
  if (!model.description && !model.cost) {
    return (
      <p className="mt-2 text-xs text-[#6B7280]">
        No cost or quality information is available for this model.
      </p>
    );
  }

  const test = model.test_result;
  return (
    <div className="mt-2 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] p-2.5">
      <div className="flex flex-wrap gap-1.5">
        {model.recommended && <Badge level="best">Recommended</Badge>}
        {model.cost && <Badge level={model.cost}>{COST_LABELS[model.cost]}</Badge>}
        {model.speed && <Badge level={model.speed}>{SPEED_LABELS[model.speed]}</Badge>}
        {model.quality && <Badge level={model.quality}>{QUALITY_LABELS[model.quality]}</Badge>}
      </div>
      {model.description && (
        <p className="mt-2 text-xs leading-relaxed text-gray-700">{model.description}</p>
      )}
      {test && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#6B7280]">
          Test ({test.document}): found {test.issues_found} of {test.issues_total} issues, about{' '}
          {formatTestCost(test.cost_usd)} and {test.seconds} s per analysis. Longer documents cost
          and take proportionally more.
        </p>
      )}
    </div>
  );
}

function ModelComparison({ models }: { models: AiModelOption[] }) {
  const described = models.filter((model) => model.test_result);
  if (described.length < 2) return null;

  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-[#6B7280] underline-offset-2 hover:underline">
        Compare models
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E5E5E5] text-[11px] text-[#6B7280]">
              <th className="py-1 pr-2 font-medium">Model</th>
              <th className="py-1 pr-2 font-medium">Issues found</th>
              <th className="py-1 pr-2 font-medium">Cost</th>
              <th className="py-1 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {described.map(({ name, test_result: test }) => (
              <tr key={name} className="border-b border-[#F0F0F0] text-[#0A0A0A]">
                <td className="py-1 pr-2 font-mono text-[11px]">{name}</td>
                <td className="py-1 pr-2">
                  {test!.issues_found} / {test!.issues_total}
                </td>
                <td className="py-1 pr-2">{formatTestCost(test!.cost_usd)}</td>
                <td className="py-1">{test!.seconds} s</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Measured on the same test document; cost per analysis at Azure list prices.
        </p>
      </div>
    </details>
  );
}

export default function AnalysisSettingsPanel({
  settings,
  onChange,
  available,
  isLoading,
  disabled,
}: AnalysisSettingsPanelProps) {
  const id = useId();

  if (isLoading) {
    return (
      <section className={groupCls} aria-busy>
        <p className="text-xs text-[#6B7280]">Loading analysis settings...</p>
      </section>
    );
  }

  if (!available) {
    return (
      <section className={groupCls}>
        <p className="text-xs text-[#6B7280]">
          Analysis settings could not be loaded. Documents will be analyzed with the default
          settings: all personal data anonymized and the AI legal analysis turned on.
        </p>
      </section>
    );
  }

  const error = analysisSettingsError(settings);
  const aiAvailable = available.ai_analysis_available;
  const aiEnabled = aiAvailable && settings.aiAnalysisEnabled;
  const selectedModelName = effectiveAiModel(settings, available);
  const selectedModel = available.ai_models.find((model) => model.name === selectedModelName);

  function update(changes: Partial<AnalysisSettings>) {
    onChange({ ...settings, ...changes });
  }

  function toggleCategory(category: RedactionCategory, checked: boolean) {
    const selected = new Set(settings.redactionCategories);
    if (checked) selected.add(category);
    else selected.delete(category);
    update({
      redactionCategories: available!.redaction_categories.filter((item) => selected.has(item)),
    });
  }

  return (
    <section aria-labelledby={`${id}-title`}>
      <h2
        id={`${id}-title`}
        className="mb-1 text-center text-xs font-medium leading-snug text-[#6B7280]"
      >
        Analysis settings
      </h2>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <fieldset className={groupCls} disabled={disabled}>
          <legend className="sr-only">Anonymization</legend>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={settings.anonymizationEnabled}
              onChange={(event) => update({ anonymizationEnabled: event.target.checked })}
              className={`${checkboxCls} mt-0.5`}
            />
            <span>
              <span className="block text-sm font-semibold text-[#0A0A0A]">
                Anonymize personal data
              </span>
              <span className="block text-xs text-[#6B7280]">
                Masks the selected data before the document is sent to Azure.
              </span>
            </span>
          </label>

          {settings.anonymizationEnabled ? (
            <div className="mt-3 border-t border-[#E5E5E5] pt-3">
              <p id={`${id}-categories`} className="mb-2 text-xs font-medium text-gray-700">
                Data to anonymize
              </p>
              <div
                role="group"
                aria-labelledby={`${id}-categories`}
                className="grid grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-2"
              >
                {available.redaction_categories.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[#0A0A0A]"
                  >
                    <input
                      type="checkbox"
                      checked={settings.redactionCategories.includes(category)}
                      onChange={(event) => toggleCategory(category, event.target.checked)}
                      className={checkboxCls}
                    />
                    {REDACTION_CATEGORY_LABELS[category] ?? category}
                  </label>
                ))}
              </div>
              {error && (
                <p role="alert" className="mt-2 text-xs text-[#a33636]">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <Notice>
              Documents will be sent to Azure with all personal data visible. Use this only for
              documents that do not contain sensitive information.
            </Notice>
          )}
        </fieldset>

        <fieldset className={groupCls} disabled={disabled || !aiAvailable}>
          <legend className="sr-only">AI legal analysis</legend>

          <label
            className={`flex items-start gap-2.5 ${aiAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          >
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(event) => update({ aiAnalysisEnabled: event.target.checked })}
              className={`${checkboxCls} mt-0.5`}
            />
            <span>
              <span className="block text-sm font-semibold text-[#0A0A0A]">AI legal analysis</span>
              <span className="block text-xs text-[#6B7280]">
                Looks for legal issues and adds a summary and applicable laws.
              </span>
            </span>
          </label>

          {!aiAvailable && (
            <p className="mt-3 text-xs text-[#6B7280]">
              AI analysis is not configured on the server. Only the formal validation will run.
            </p>
          )}

          {aiEnabled && (
            <div className="mt-3 border-t border-[#E5E5E5] pt-3">
              <label
                htmlFor={`${id}-model`}
                className="mb-2 block text-xs font-medium text-gray-700"
              >
                AI model
              </label>
              <select
                id={`${id}-model`}
                value={selectedModelName}
                onChange={(event) => update({ aiModel: event.target.value })}
                className={selectCls}
                aria-describedby={`${id}-model-details`}
              >
                {available.ai_models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {aiModelSummary(model, available.default_ai_model)}
                  </option>
                ))}
              </select>
              <div id={`${id}-model-details`} aria-live="polite">
                {selectedModel && <ModelDetails model={selectedModel} />}
              </div>
              <ModelComparison models={available.ai_models} />
            </div>
          )}

          {aiAvailable && !aiEnabled && (
            <p className="mt-3 text-xs text-[#6B7280]">
              Only the formal validation will run. The analysis will not contain AI-detected issues,
              a summary or applicable laws.
            </p>
          )}
        </fieldset>
      </div>
    </section>
  );
}
