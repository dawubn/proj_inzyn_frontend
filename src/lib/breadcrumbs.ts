// src/lib/breadcrumbs.ts

export type Breadcrumb = {
  label: string;
  path: string;
};

const breadcrumbMap: Record<string, Breadcrumb[]> = {
  '/dashboard': [{ label: 'Dashboard', path: '/dashboard' }],
  '/history': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History of analysis', path: '/history' },
  ],
  '/history/analysis-details': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History of analysis', path: '/history' },
    { label: 'Analysis details', path: '/history/analysis-details' },
  ],
  '/document-analysis': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Document Analysis', path: '/document-analysis' },
  ],
  '/rule-profiles': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Rule profiles', path: '/rule-profiles' },
  ],
  '/account-details': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Account details', path: '/account-details' },
  ],
};

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  // Handle OCR results route
  if (pathname.includes('/analysis/') && pathname.endsWith('/ocr')) {
    const analysisId = pathname.split('/')[2];
    return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Analysis details', path: `/analysis/${analysisId}` },
      { label: 'Extracted Text', path: pathname },
    ];
  }

  // Handle dynamic routes
  if (pathname.startsWith('/analysis/')) {
    return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Analysis details', path: pathname },
    ];
  }

  return breadcrumbMap[pathname] ?? [{ label: 'Dashboard', path: '/dashboard' }];
}
