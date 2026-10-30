import { outcomeLabels } from '@/components/analysis/formalMessages';
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { getPageImageUrl, type PageInfo, type PreviewVariant } from '@/api/documents-wrapper';
import type { NormalizedRect, ViewerIssue } from './types';

const SMALL_LONG_SIDE_PX = 1000;
const LARGE_LONG_SIDE_PX = 2000;

interface HighlightStyle {
  idle: string;
  active: string;
  /** Dashed outline for missing elements: marks where something should be, not existing text. */
  missingIdle: string;
  missingActive: string;
  label: string;
}

const highlightStyles: Record<string, HighlightStyle> = {
  critical: {
    idle: 'bg-red-500/10 border-b-2 border-red-500/70',
    active: 'bg-red-500/25 ring-2 ring-red-600',
    missingIdle: 'border-2 border-dashed border-red-500/60 bg-red-500/5',
    missingActive: 'border-2 border-dashed border-red-600 bg-red-500/15',
    label: 'bg-red-600',
  },
  high: {
    idle: 'bg-orange-500/10 border-b-2 border-orange-500/70',
    active: 'bg-orange-500/25 ring-2 ring-orange-600',
    missingIdle: 'border-2 border-dashed border-orange-500/60 bg-orange-500/5',
    missingActive: 'border-2 border-dashed border-orange-600 bg-orange-500/15',
    label: 'bg-orange-600',
  },
  medium: {
    idle: 'bg-yellow-400/15 border-b-2 border-yellow-500/80',
    active: 'bg-yellow-400/35 ring-2 ring-yellow-600',
    missingIdle: 'border-2 border-dashed border-yellow-500/70 bg-yellow-400/10',
    missingActive: 'border-2 border-dashed border-yellow-600 bg-yellow-400/25',
    label: 'bg-yellow-600',
  },
  default: {
    idle: 'bg-blue-500/10 border-b-2 border-blue-500/70',
    active: 'bg-blue-500/25 ring-2 ring-blue-600',
    missingIdle: 'border-2 border-dashed border-blue-500/60 bg-blue-500/5',
    missingActive: 'border-2 border-dashed border-blue-600 bg-blue-500/15',
    label: 'bg-blue-600',
  },
};

function highlightStyle(severity: string) {
  if (severity === 'error') return highlightStyles.critical;
  if (severity === 'warning') return highlightStyles.medium;
  return highlightStyles[severity] ?? highlightStyles.default;
}

const missingLabels: Record<string, string> = {
  placeholder: 'Fill in',
  expected: 'Expected here',
};

/** Percent-based position: scales with the page at any screen size or zoom level. */
function rectStyle(rect: NormalizedRect) {
  return {
    left: `calc(${rect.x * 100}% - 3px)`,
    top: `calc(${rect.y * 100}% - 2px)`,
    width: `calc(${rect.width * 100}% + 6px)`,
    height: `calc(${rect.height * 100}% + 4px)`,
  };
}

function widthForLongSide(page: PageInfo, longSide: number) {
  return Math.round(page.width >= page.height ? longSide : (longSide * page.width) / page.height);
}

interface DocumentViewerProps {
  analysisId: string;
  pages: PageInfo[];
  variant: PreviewVariant;
  issues: ViewerIssue[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  canHover: boolean;
  reducedMotion: boolean;
  /** Content of the popover anchored to the selected highlight; null shows no popover. */
  popoverContent: ReactNode | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number | null) => void;
}

export function DocumentViewer({
  analysisId,
  pages,
  variant,
  issues,
  hoveredIndex,
  selectedIndex,
  canHover,
  reducedMotion,
  popoverContent,
  onHover,
  onSelect,
}: DocumentViewerProps) {
  const anchorRef = useRef<HTMLElement | null>(null);

  const rectsByPage = useMemo(() => {
    const byPage = new Map<
      number,
      { issueIndex: number; rect: NormalizedRect; first: boolean }[]
    >();
    issues.forEach((issue, issueIndex) => {
      (issue.locations ?? []).forEach((location, locationIdx) => {
        location.rects.forEach((rect, rectIdx) => {
          const list = byPage.get(location.page) ?? [];
          list.push({ issueIndex, rect, first: locationIdx === 0 && rectIdx === 0 });
          byPage.set(location.page, list);
        });
      });
    });
    return byPage;
  }, [issues]);

  const selectedIssue = selectedIndex != null ? issues[selectedIndex] : null;
  const selectedHasRects = !!selectedIssue?.locations?.some((l) => l.rects.length > 0);
  // Issues without an exact location still point at their page
  const selectedPage = selectedIssue?.locations?.[0]?.page ?? selectedIssue?.page ?? null;

  useEffect(() => {
    if (selectedIndex == null) return;
    const target = anchorRef.current;
    target?.scrollIntoView({
      block: selectedHasRects ? 'center' : 'start',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [selectedIndex, selectedHasRects, selectedPage, variant, reducedMotion]);

  return (
    <Popover
      open={popoverContent != null && selectedIndex != null}
      onOpenChange={(open) => {
        if (!open) onSelect(null);
      }}
    >
      <PopoverAnchor virtualRef={anchorRef as RefObject<HTMLElement>} />
      <div className="flex flex-col gap-4">
        {pages.map((page) => {
          const isTargetPage =
            selectedIndex != null && !selectedHasRects && page.page === selectedPage;
          return (
            <div
              key={page.page}
              className={cn(
                'relative w-full overflow-hidden rounded border border-gray-300 bg-gray-100 shadow-sm scroll-mt-4',
                isTargetPage && 'ring-4 ring-gray-900/60',
              )}
              style={{ aspectRatio: `${page.width} / ${page.height}` }}
            >
              {isTargetPage && (
                // Point anchor near the top: anchoring to the whole page would push the popover off-screen
                <div
                  ref={(el) => {
                    anchorRef.current = el;
                  }}
                  className="pointer-events-none absolute top-8 left-1/2 z-20 h-px w-px scroll-mt-24"
                />
              )}
              <img
                src={getPageImageUrl(analysisId, page.page, variant, 'lg')}
                srcSet={[
                  `${getPageImageUrl(analysisId, page.page, variant, 'sm')} ${widthForLongSide(page, SMALL_LONG_SIDE_PX)}w`,
                  `${getPageImageUrl(analysisId, page.page, variant, 'lg')} ${widthForLongSide(page, LARGE_LONG_SIDE_PX)}w`,
                ].join(', ')}
                sizes="(min-width: 1024px) 60vw, 100vw"
                loading="lazy"
                decoding="async"
                draggable={false}
                alt={`Page ${page.page}`}
                className="absolute inset-0 h-full w-full select-none"
              />

              {(rectsByPage.get(page.page) ?? []).map(({ issueIndex, rect, first }, idx) => {
                const isActive = issueIndex === selectedIndex || issueIndex === hoveredIndex;
                const issue = issues[issueIndex];
                const style = highlightStyle(issue.severity);
                const isMissing = issue.kind !== 'text';
                const className = isMissing
                  ? isActive
                    ? style.missingActive
                    : style.missingIdle
                  : isActive
                    ? style.active
                    : style.idle;
                return (
                  <div
                    key={`${issueIndex}-${idx}`}
                    ref={
                      first && issueIndex === selectedIndex
                        ? (el) => {
                            anchorRef.current = el;
                          }
                        : undefined
                    }
                    role="button"
                    tabIndex={-1}
                    aria-label={issue.issue}
                    onClick={() => onSelect(issueIndex === selectedIndex ? null : issueIndex)}
                    onMouseEnter={canHover ? () => onHover(issueIndex) : undefined}
                    onMouseLeave={canHover ? () => onHover(null) : undefined}
                    data-issue-highlight
                    className={cn(
                      'absolute cursor-pointer rounded-sm transition-[background-color,box-shadow] duration-150',
                      className,
                      isActive && 'z-10',
                    )}
                    style={rectStyle(rect)}
                  >
                    {isMissing && isActive && first && (
                      <span
                        className={cn(
                          'pointer-events-none absolute bottom-full left-0 mb-1 rounded px-1.5 py-0.5 text-[11px] leading-tight font-medium whitespace-nowrap text-white shadow-sm',
                          style.label,
                        )}
                      >
                        {issue.outcome && issue.outcome !== 'fail'
                          ? outcomeLabels[issue.outcome]
                          : missingLabels[issue.kind]}
                        : {issue.rule_name}
                      </span>
                    )}
                  </div>
                );
              })}

              <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-gray-900/70 px-2 py-0.5 text-xs text-white">
                {page.page} / {pages.length}
              </span>
            </div>
          );
        })}
      </div>

      {popoverContent != null && (
        <PopoverContent
          side="bottom"
          collisionPadding={16}
          hideWhenDetached
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Clicking issues or highlights changes the selection itself
            const target = e.target as Element | null;
            if (target?.closest('[data-issue-item], [data-issue-highlight]')) e.preventDefault();
          }}
        >
          {popoverContent}
        </PopoverContent>
      )}
    </Popover>
  );
}
