import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDocumentSubmission, reanalyzeDocument } from '../src/lib/analysisSubmission.ts';

const file = new File(['document'], 'example.pdf', { type: 'application/pdf' });

test('type is uploaded before analysis starts and a failed start can reuse the upload', async () => {
  const calls: string[] = [];
  let attempts = 0;
  const submit = createDocumentSubmission({
    upload: async (input, type) => {
      assert.equal(input, file);
      calls.push(`upload:${type}`);
      return { id: 'doc-1' };
    },
    start: async (id) => {
      calls.push(`start:${id}`);
      if (++attempts === 1) throw new Error('Unavailable');
      return { id: 'analysis-1' };
    },
  });
  await assert.rejects(submit([file], 'contract'), /Unavailable/);
  assert.equal((await submit([file], 'contract')).id, 'analysis-1');
  assert.deepEqual(calls, ['upload:contract', 'start:doc-1', 'start:doc-1']);
});

test('zero or multiple files are rejected before any upload', async () => {
  const submit = createDocumentSubmission({
    upload: async () => {
      assert.fail('must not upload');
    },
    start: async () => {
      assert.fail('must not start');
    },
  });
  await assert.rejects(submit([], 'auto'), /one document/);
  await assert.rejects(submit([file, file], 'auto'), /one document/);
});

test('failed upload does not start analysis and is retried on the next submission', async () => {
  let uploads = 0;
  let starts = 0;
  const submit = createDocumentSubmission({
    upload: async () => {
      if (++uploads === 1) throw new Error('Upload failed');
      return { id: 'doc' };
    },
    start: async () => {
      starts++;
      return { id: 'analysis' };
    },
  });
  await assert.rejects(submit([file], 'auto'), /Upload failed/);
  assert.equal(starts, 0);
  await submit([file], 'auto');
  assert.equal(uploads, 2);
  assert.equal(starts, 1);
});

test('Auto keeps the existing document type during reanalysis', async () => {
  const calls: string[] = [];
  const api = {
    updateType: async () => {
      calls.push('update');
    },
    start: async (id: string) => {
      calls.push(`start:${id}`);
      return { analysis_id: 'a' };
    },
  };
  await reanalyzeDocument('doc', 'auto', api);
  assert.deepEqual(calls, ['start:doc']);
  await reanalyzeDocument('doc', 'contract', api);
  assert.deepEqual(calls, ['start:doc', 'update', 'start:doc']);
});

test('an explicit type update failure stops reanalysis with the wrong profile', async () => {
  await assert.rejects(
    reanalyzeDocument('doc', 'contract', {
      updateType: async () => {
        throw new Error('Update failed');
      },
      start: async () => {
        assert.fail('must not start');
      },
    }),
    /Update failed/,
  );
});
