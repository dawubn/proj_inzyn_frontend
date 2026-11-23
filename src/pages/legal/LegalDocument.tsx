import { Link } from 'react-router-dom';

import PublicPage from '@/components/public/PublicPage';

// Shown under the title of both documents; change it with every change of their content
export const LEGAL_LAST_UPDATED = '23 November 2026';

type Section = { id: string; title: string; content: React.ReactNode };

type LegalDocumentProps = {
  title: string;
  intro: React.ReactNode;
  sections: Section[];
};

export function LegalDocument({ title, intro, sections }: LegalDocumentProps) {
  return (
    <PublicPage>
      <article className="pt-4 text-sm leading-6 text-gray-700 sm:pt-8">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-xs text-gray-500">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
          {intro}
        </div>

        <nav aria-label="Contents" className="mt-8">
          <p className="text-xs font-semibold text-gray-500">Contents</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:text-black hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="mt-10 scroll-mt-6">
            <h2 className="text-base font-semibold text-gray-900">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 space-y-3 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
              {section.content}
            </div>
          </section>
        ))}
      </article>
    </PublicPage>
  );
}

/** How to reach the team. */
export function ContactReference() {
  return (
    <>
      through the{' '}
      <Link to="/contact" className="underline hover:text-black">
        contact form
      </Link>
    </>
  );
}

export function DocumentLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="underline hover:text-black">
      {children}
    </Link>
  );
}
