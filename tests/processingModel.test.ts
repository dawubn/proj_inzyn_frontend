import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getProcessingSteps,
  getProgressRange,
  pickHeroId,
} from '../src/features/processing/processingModel.ts';

const states = (source: Parameters<typeof getProcessingSteps>[0]) =>
  getProcessingSteps(source).map((step) => step.state);

test('steps follow the processing step', () => {
  assert.deepEqual(states({ status: 'queued', processing_step: 0 }), [
    'upcoming',
    'upcoming',
    'upcoming',
    'upcoming',
  ]);
  assert.deepEqual(states({ status: 'in_progress', processing_step: 3 }), [
    'done',
    'done',
    'active',
    'upcoming',
  ]);
  assert.deepEqual(states({ status: 'completed', processing_step: 4 }), [
    'done',
    'done',
    'done',
    'done',
  ]);
  assert.deepEqual(states({ status: 'failed', processing_step: 2 }), [
    'done',
    'failed',
    'upcoming',
    'upcoming',
  ]);
});

test('steps turned off in the analysis settings are skipped', () => {
  assert.deepEqual(
    states({
      status: 'in_progress',
      processing_step: 3,
      options: { anonymization_enabled: false, ai_analysis_enabled: false },
    }),
    ['done', 'skipped', 'active', 'skipped'],
  );
});

test('progress range covers the current step and never reaches 100 before the end', () => {
  assert.deepEqual(getProgressRange({ status: 'queued' }), { from: 0, to: 0 });
  assert.deepEqual(getProgressRange({ status: 'in_progress', processing_step: 1 }), {
    from: 0,
    to: 25,
  });
  assert.deepEqual(getProgressRange({ status: 'in_progress', processing_step: 4 }), {
    from: 75,
    to: 95,
  });
  assert.deepEqual(getProgressRange({ status: 'completed', processing_step: 4 }), {
    from: 100,
    to: 100,
  });
  assert.deepEqual(getProgressRange({ status: 'failed', processing_step: 3 }), {
    from: 50,
    to: 50,
  });
});

const queue = [
  { id: 'done', status: 'completed' },
  { id: 'running', status: 'in_progress' },
  { id: 'next', status: 'queued' },
];

test('the analysis being processed is shown on top', () => {
  assert.equal(pickHeroId(queue, null, null), 'running');
});

test('an unfinished analysis on top stays there', () => {
  assert.equal(pickHeroId(queue, 'next', null), 'next');
});

test('when the analysis on top finishes the next one moves up', () => {
  const after = [
    { id: 'done', status: 'completed' },
    { id: 'running', status: 'completed' },
    { id: 'next', status: 'queued' },
  ];
  assert.equal(pickHeroId(after, 'running', null), 'next');
});

test('an analysis picked by the user stays on top even when finished', () => {
  assert.equal(pickHeroId(queue, 'running', 'done'), 'done');
});

test('when everything is finished the last analysis on top stays', () => {
  const finished = [
    { id: 'a', status: 'completed' },
    { id: 'b', status: 'failed' },
  ];
  assert.equal(pickHeroId(finished, 'b', null), 'b');
  assert.equal(pickHeroId(finished, null, null), 'a');
});
