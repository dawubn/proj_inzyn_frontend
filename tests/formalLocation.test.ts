import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFormalLocation } from '../src/lib/formalLocation.ts';

const rect = { x: 0.1, y: 0.2, width: 0.3, height: 0.1 };

test('exact evidence, blank fields and expected areas retain their meaning', () => {
  for (const kind of ['evidence', 'placeholder', 'expected', 'page']) {
    const location = { kind, page: 3, rects: kind === 'page' ? [] : [rect] };
    assert.deepEqual(readFormalLocation(location), location);
  }
});

test('legacy page-only locations work without a rectangles array', () => {
  assert.deepEqual(readFormalLocation({ kind: 'page', page: 2 }), {
    kind: 'page',
    page: 2,
    rects: [],
  });
  assert.deepEqual(readFormalLocation({ kind: 'evidence', page: 2, rects: null }), {
    kind: 'evidence',
    page: 2,
    rects: [],
  });
});

test('invalid coordinates are omitted without hiding valid coordinates or the page', () => {
  const result = readFormalLocation({
    kind: 'evidence',
    page: 2,
    rects: [null, {}, { ...rect, x: NaN }, { ...rect, width: -1 }, { ...rect, y: 1 }, rect],
  });
  assert.deepEqual(result?.rects, [rect]);
});

test('invalid locations never navigate to a nonexistent page', () => {
  for (const location of [
    null,
    'location',
    {},
    { kind: 'page', page: 0 },
    { kind: 'page', page: 1.5 },
    { kind: 'page', page: '2' },
    { kind: 'bad', page: 2 },
  ]) {
    assert.equal(readFormalLocation(location), undefined);
  }
});
