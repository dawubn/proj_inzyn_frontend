import { PROCESSING_ROUTE, parseProcessingIds } from '@/lib/analysisStatus';

export type Breadcrumb = {
  label: string;
  path: string;
};

const DASHBOARD: Breadcrumb = { label: 'Dashboard', path: '/dashboard' };
const HISTORY: Breadcrumb = { label: 'History of analysis', path: '/history' };

const breadcrumbMap: Record<string, Breadcrumb[]> = {
  '/dashboard': [DASHBOARD],
  '/history': [DASHBOARD, HISTORY],
  '/history/analysis-details': [
    DASHBOARD,
    HISTORY,
    { label: 'Analysis details', path: '/history/analysis-details' },
  ],
  '/document-analysis': [DASHBOARD, { label: 'Document Analysis', path: '/document-analysis' }],
  '/rule-profiles': [DASHBOARD, { label: 'Rule profiles', path: '/rule-profiles' }],
  '/account-details': [DASHBOARD, { label: 'Account details', path: '/account-details' }],
};

// Returns the analysis a breadcrumb should describe, if the current page is about one:
// /analysis/:id, /analysis/:id/ocr and the processing page (selected analysis or the first one).
export function getBreadcrumbAnalysisId(pathname: string, search: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '');

  if (normalizedPath === PROCESSING_ROUTE) {
    const params = new URLSearchParams(search);
    const selected = params.get('selected')?.trim();

    if (selected) {
      return selected;
    }

    try {
      return parseProcessingIds(params.get('ids'))[0]?.trim() || null;
    } catch {
      return null;
    }
  }

  const match = normalizedPath.match(/^\/analysis\/([^/]+)/);

  return match ? decodeURIComponent(match[1]) : null;
}

export function getBreadcrumbs(
  pathname: string,
  search = '',
  analysisLabel?: string | null,
): Breadcrumb[] {
  const normalizedPath = pathname.replace(/\/+$/, '');

  if (normalizedPath === PROCESSING_ROUTE) {
    return [
      DASHBOARD,
      HISTORY,
      {
        label: analysisLabel ?? 'Processing',
        path: `${normalizedPath}${search}`,
      },
    ];
  }

  const ocrMatch = normalizedPath.match(/^\/analysis\/([^/]+)\/ocr$/);

  if (ocrMatch) {
    const analysisId = ocrMatch[1];

    return [
      DASHBOARD,
      HISTORY,
      { label: analysisLabel ?? 'Analysis details', path: `/analysis/${analysisId}` },
      { label: 'Extracted Text', path: normalizedPath },
    ];
  }

  if (normalizedPath.startsWith('/analysis/')) {
    return [
      DASHBOARD,
      HISTORY,
      { label: analysisLabel ?? 'Analysis details', path: normalizedPath },
    ];
  }

  const mappedBreadcrumbs = breadcrumbMap[normalizedPath];

  if (mappedBreadcrumbs) {
    return mappedBreadcrumbs;
  }

  return [DASHBOARD];
}
