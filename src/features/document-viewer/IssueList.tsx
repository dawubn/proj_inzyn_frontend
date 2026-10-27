import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSeverityConfig } from './severity';
import type { ViewerIssue } from './types';

interface IssueListProps {
  /** Issues to show, paired with their index in the full issue list. */
  items: { issue: ViewerIssue; index: number }[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  canHover: boolean;
  reducedMotion: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number | null) => void;
}

function issuePage(issue: ViewerIssue) {
  return issue.locations?.[0]?.page ?? issue.page ?? null;
}

function locationTitle(issue: ViewerIssue, hasLocation: boolean) {
  if (issue.kind === 'placeholder') return 'Field to fill in marked on page';
  if (issue.kind === 'expected') {
    return hasLocation ? 'Expected location marked on page' : 'Missing from page';
  }
  return hasLocation ? 'Highlighted on page' : 'Text not found on page';
}

export function IssueList({
  items,
  hoveredIndex,
  selectedIndex,
  canHover,
  reducedMotion,
  onHover,
  onSelect,
}: IssueListProps) {
  const itemRefs = useRef(new Map<number, HTMLButtonElement>());

  // Selecting a highlight on the document brings its issue into view in the list
  useEffect(() => {
    if (selectedIndex == null) return;
    itemRefs.current.get(selectedIndex)?.scrollIntoView({
      block: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [selectedIndex, reducedMotion]);

  return (
    <ul className="space-y-3">
      {items.map(({ issue, index }) => {
        const config = getSeverityConfig(issue.severity);
        const isSelected = selectedIndex === index;
        const isHovered = hoveredIndex === index;
        const page = issuePage(issue);
        const hasLocation = !!issue.locations?.length;

        return (
          <li key={index}>
            <button
              type="button"
              ref={(el) => {
                if (el) itemRefs.current.set(index, el);
                else itemRefs.current.delete(index);
              }}
              data-issue-item
              aria-pressed={isSelected}
              onMouseEnter={canHover ? () => onHover(index) : undefined}
              onMouseLeave={canHover ? () => onHover(null) : undefined}
              onFocus={canHover ? () => onHover(index) : undefined}
              onBlur={canHover ? () => onHover(null) : undefined}
              onClick={() => onSelect(isSelected ? null : index)}
              className={cn(
                'w-full cursor-pointer rounded border-l-4 p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900',
                config.border,
                config.bg,
                isSelected ? 'ring-2 ring-gray-900' : isHovered && 'brightness-95',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${config.text}`}>{issue.issue}</p>
                  {(issue.text_reference || issue.rule_name) && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                      {issue.text_reference || issue.rule_name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`${config.badge} rounded px-2 py-1 text-xs font-medium whitespace-nowrap`}
                  >
                    {issue.severity}
                  </span>
                  {page != null && (
                    <span
                      className="inline-flex items-center gap-0.5 text-xs text-gray-500"
                      title={locationTitle(issue, hasLocation)}
                    >
                      <MapPin
                        size={12}
                        className={hasLocation ? 'text-gray-700' : 'text-gray-300'}
                      />
                      p. {page}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
