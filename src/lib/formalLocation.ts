type Rect = { x: number; y: number; width: number; height: number };
export type FormalLocation = {
  kind: 'evidence' | 'placeholder' | 'expected' | 'page';
  page: number;
  rects: Rect[];
};

function isRect(value: unknown): value is Rect {
  if (!value || typeof value !== 'object') return false;
  const { x, y, width, height } = value as Rect;
  return (
    [x, y, width, height].every((v) => typeof v === 'number' && Number.isFinite(v)) &&
    x >= 0 &&
    y >= 0 &&
    width > 0 &&
    height > 0 &&
    x + width <= 1.00001 &&
    y + height <= 1.00001
  );
}

export function readFormalLocation(value: unknown): FormalLocation | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { kind, page, rects } = value as FormalLocation;
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !['evidence', 'placeholder', 'expected', 'page'].includes(kind)
  )
    return undefined;
  return { kind, page, rects: Array.isArray(rects) ? rects.filter(isRect) : [] };
}
