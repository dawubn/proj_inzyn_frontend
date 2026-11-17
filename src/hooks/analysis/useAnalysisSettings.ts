import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchAnalysisOptions } from '@/api/documents-wrapper';
import {
  analysisSettingsError,
  loadAnalysisSettings,
  saveAnalysisSettings,
  toStartOptions,
} from '@/lib/analysisOptions';
import type { AnalysisSettings, AnalysisStartOptions } from '@/lib/analysisOptions';

/** Settings of the analysis panel, remembered in this browser between visits. */
export function useAnalysisSettings() {
  const [settings, setSettingsState] = useState<AnalysisSettings>(loadAnalysisSettings);

  const optionsQuery = useQuery({
    queryKey: ['analysis-options'],
    queryFn: fetchAnalysisOptions,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  function setSettings(next: AnalysisSettings) {
    setSettingsState(next);
    saveAnalysisSettings(next);
  }

  const available = optionsQuery.data;
  const error = available ? analysisSettingsError(settings) : null;

  // Without the server description the backend defaults are used
  const startOptions: AnalysisStartOptions | undefined =
    available && !error ? toStartOptions(settings, available) : undefined;

  return {
    settings,
    setSettings,
    available,
    isLoading: optionsQuery.isLoading,
    error,
    startOptions,
  };
}
