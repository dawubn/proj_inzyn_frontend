import type {
  AiModelOption,
  AnalysisOptions,
  AnalysisOptionsResponse,
  CostLevel,
  QualityLevel,
  RedactionCategory,
  SpeedLevel,
} from '@/api/generated/model';

export const REDACTION_CATEGORY_LABELS: Record<RedactionCategory, string> = {
  person: 'Names and surnames',
  address: 'Addresses',
  date: 'Dates',
  pesel: 'PESEL numbers',
  email: 'Email addresses',
  phone: 'Phone numbers',
};

/** Settings chosen in the panel; `aiModel` null means the default model. */
export type AnalysisSettings = {
  anonymizationEnabled: boolean;
  redactionCategories: RedactionCategory[];
  aiAnalysisEnabled: boolean;
  aiModel: string | null;
};

/** Options sent to the backend when an analysis is started. */
export type AnalysisStartOptions = {
  anonymize: boolean;
  redactionCategories: RedactionCategory[];
  aiAnalysis: boolean;
  aiModel: string | null;
};

const STORAGE_KEY = 'cerberdoc.analysis-settings';

const ALL_CATEGORIES = Object.keys(REDACTION_CATEGORY_LABELS) as RedactionCategory[];

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  anonymizationEnabled: true,
  redactionCategories: ALL_CATEGORIES,
  aiAnalysisEnabled: true,
  aiModel: null,
};

function isCategory(value: unknown): value is RedactionCategory {
  return typeof value === 'string' && value in REDACTION_CATEGORY_LABELS;
}

/** Settings remembered in this browser, or the defaults when there are none. */
export function loadAnalysisSettings(): AnalysisSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ANALYSIS_SETTINGS;

    const stored = JSON.parse(raw) as Partial<Record<keyof AnalysisSettings, unknown>>;
    return {
      anonymizationEnabled: stored.anonymizationEnabled !== false,
      redactionCategories: Array.isArray(stored.redactionCategories)
        ? ALL_CATEGORIES.filter((category) =>
            (stored.redactionCategories as unknown[]).filter(isCategory).includes(category),
          )
        : ALL_CATEGORIES,
      aiAnalysisEnabled: stored.aiAnalysisEnabled !== false,
      aiModel: typeof stored.aiModel === 'string' ? stored.aiModel : null,
    };
  } catch {
    return DEFAULT_ANALYSIS_SETTINGS;
  }
}

export function saveAnalysisSettings(settings: AnalysisSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Remembering the settings is only a convenience
  }
}

/** Error to show for settings that cannot be used, or null when they are fine. */
export function analysisSettingsError(settings: AnalysisSettings): string | null {
  if (settings.anonymizationEnabled && settings.redactionCategories.length === 0) {
    return 'Select at least one kind of data to anonymize, or turn anonymization off.';
  }
  return null;
}

/** Model that will be used: the chosen one if the server still offers it, else the default. */
export function effectiveAiModel(
  settings: AnalysisSettings,
  available: AnalysisOptionsResponse,
): string {
  return settings.aiModel && available.ai_models.some((model) => model.name === settings.aiModel)
    ? settings.aiModel
    : available.default_ai_model;
}

/** Turns the panel settings into the options of a new analysis. */
export function toStartOptions(
  settings: AnalysisSettings,
  available: AnalysisOptionsResponse,
): AnalysisStartOptions {
  const aiAnalysis = available.ai_analysis_available && settings.aiAnalysisEnabled;
  return {
    anonymize: settings.anonymizationEnabled,
    redactionCategories: settings.anonymizationEnabled
      ? settings.redactionCategories.filter((category) =>
          available.redaction_categories.includes(category),
        )
      : [],
    aiAnalysis,
    aiModel: aiAnalysis ? effectiveAiModel(settings, available) : null,
  };
}

export const COST_LABELS: Record<CostLevel, string> = {
  low: 'Low cost',
  medium: 'Medium cost',
  high: 'High cost',
};

export const SPEED_LABELS: Record<SpeedLevel, string> = {
  fast: 'Fast',
  medium: 'Medium speed',
  slow: 'Slow',
};

export const QUALITY_LABELS: Record<QualityLevel, string> = {
  basic: 'Basic accuracy',
  good: 'Good accuracy',
  best: 'Best accuracy',
};

/** Short annotation shown next to the model name in the select. */
export function aiModelSummary(model: AiModelOption, defaultModel: string): string {
  const parts = [
    model.recommended ? 'recommended' : null,
    model.name === defaultModel ? 'default' : null,
    model.cost ? COST_LABELS[model.cost].toLowerCase() : null,
    model.quality ? QUALITY_LABELS[model.quality].toLowerCase() : null,
  ].filter(Boolean);
  return parts.length ? `${model.name} (${parts.join(', ')})` : model.name;
}

/** Cost of one analysis, e.g. "$0.016" or "$0.0005". */
export function formatTestCost(costUsd: number): string {
  if (costUsd < 0.0001) return '<$0.0001';
  return `$${costUsd.toFixed(costUsd < 0.01 ? 4 : 3).replace(/0+$/, '')}`;
}

/** Which model produced (or will produce) the AI part of an analysis. */
export type AnalysisModelInfo = {
  /** Deployment name, null when no model is known */
  name: string | null;
  /** What to show when there is no name */
  fallback: string;
};

export function analysisModelInfo(
  options: AnalysisOptions | undefined,
  legalResult: unknown,
): AnalysisModelInfo {
  if (options && options.ai_analysis_enabled === false) {
    return { name: null, fallback: 'Turned off' };
  }
  // Completed analyses record the model that actually ran
  if (legalResult && typeof legalResult === 'object' && 'model' in legalResult) {
    const model = (legalResult as { model?: string | null }).model;
    return model ? { name: model, fallback: '' } : { name: null, fallback: 'Not run' };
  }
  if (options?.ai_model) return { name: options.ai_model, fallback: '' };
  // Analyses from before the settings panel did not store the model
  return { name: null, fallback: 'Default model (not recorded)' };
}

/** Options of a new analysis that repeats the settings of an earlier one. */
export function startOptionsFromAnalysis(
  options: AnalysisOptions | undefined,
): AnalysisStartOptions | undefined {
  if (!options) return undefined;
  const aiAnalysis = options.ai_analysis_enabled !== false;
  return {
    anonymize: options.anonymization_enabled !== false,
    redactionCategories: options.redaction_categories ?? [],
    aiAnalysis,
    aiModel: aiAnalysis ? (options.ai_model ?? null) : null,
  };
}
