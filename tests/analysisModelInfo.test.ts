import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analysisModelInfo, startOptionsFromAnalysis } from '../src/lib/analysisOptions.ts';

test('a completed analysis shows the model recorded in its result', () => {
  assert.deepEqual(
    analysisModelInfo(
      { ai_analysis_enabled: true, ai_model: 'gpt-4.1' },
      { model: 'gpt-6.1-terra' },
    ),
    { name: 'gpt-6.1-terra', fallback: '' },
  );
});

test('an analysis in progress shows the chosen model', () => {
  assert.equal(
    analysisModelInfo({ ai_analysis_enabled: true, ai_model: 'gpt-6-luna' }, null).name,
    'gpt-6-luna',
  );
});

test('a turned off AI analysis has no model', () => {
  assert.deepEqual(
    analysisModelInfo({ ai_analysis_enabled: false, ai_model: null }, { model: null }),
    {
      name: null,
      fallback: 'Turned off',
    },
  );
});

test('an AI analysis that could not run has no model', () => {
  assert.deepEqual(
    analysisModelInfo({ ai_analysis_enabled: true, ai_model: 'gpt-4.1' }, { model: null }),
    {
      name: null,
      fallback: 'Not run',
    },
  );
});

test('an analysis from before the model was stored says so', () => {
  assert.deepEqual(
    analysisModelInfo({ ai_analysis_enabled: true, ai_model: null }, { summary: '', errors: [] }),
    { name: null, fallback: 'Default model (not recorded)' },
  );
});

test('re-running an analysis keeps its settings', () => {
  assert.deepEqual(
    startOptionsFromAnalysis({
      anonymization_enabled: true,
      redaction_categories: ['pesel', 'email'],
      ai_analysis_enabled: true,
      ai_model: 'gpt-6-luna',
    }),
    {
      anonymize: true,
      redactionCategories: ['pesel', 'email'],
      aiAnalysis: true,
      aiModel: 'gpt-6-luna',
    },
  );
  assert.deepEqual(
    startOptionsFromAnalysis({
      anonymization_enabled: false,
      redaction_categories: [],
      ai_analysis_enabled: false,
    }),
    { anonymize: false, redactionCategories: [], aiAnalysis: false, aiModel: null },
  );
  assert.equal(startOptionsFromAnalysis(undefined), undefined);
});
