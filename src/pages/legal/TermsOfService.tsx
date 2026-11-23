// src/pages/legal/TermsOfService.tsx

import { ContactReference, DocumentLink, LegalDocument } from './LegalDocument';

const sections = [
  {
    id: 'service',
    title: 'The service',
    content: (
      <>
        <p>
          CerberDoc is a web application that helps check documents. It recognises the text of
          uploaded files (PDF, JPG, PNG), checks them against formal rules, can mask personal data
          in them and can prepare an automated analysis of their content with a language model.
        </p>
        <p>
          These Terms apply to everyone who creates an account or uses the service. By creating an
          account you accept them.
        </p>
      </>
    ),
  },
  {
    id: 'stage',
    title: 'Stage of the project',
    content: (
      <>
        <p>
          CerberDoc is developed as part of an engineering thesis and is provided free of charge in
          an early version (MVP). This means that:
        </p>
        <ul>
          <li>features may change, be added or be removed without notice;</li>
          <li>the service may be unavailable at times, for example during updates;</li>
          <li>
            the service is not meant to be the only place where your documents are kept, so always
            keep your own copies;
          </li>
          <li>we may end the service; we will try to announce it in advance.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    content: (
      <ul>
        <li>Give true information when you sign up and keep your email address up to date.</li>
        <li>
          Keep your password to yourself. You are responsible for what happens in your account; if
          you think someone else has access to it, change the password and let us know.
        </li>
        <li>An account is for one person and cannot be passed on to others.</li>
      </ul>
    ),
  },
  {
    id: 'documents',
    title: 'Your documents',
    content: (
      <>
        <p>
          You keep all rights to the documents you upload. You allow us to store and process them
          only as far as needed to provide the service to you, as described in the{' '}
          <DocumentLink to="/privacy">Privacy Policy</DocumentLink>.
        </p>
        <p>Upload only documents that you are allowed to share and process, in particular:</p>
        <ul>
          <li>
            when a document contains personal data of other people, you must have a legal basis to
            process it;
          </li>
          <li>do not upload content that is against the law.</li>
        </ul>
        <p>You can delete your analyses and their results in the application at any time.</p>
      </>
    ),
  },
  {
    id: 'results',
    title: 'Results are not legal advice',
    content: (
      <>
        <p>
          Results are created automatically: text recognition, rule checks, masking of personal data
          and analysis by a language model. They can be incomplete or wrong, for example when a scan
          is of poor quality or a document is unusual. In particular, masking may miss some personal
          data.
        </p>
        <p>
          Results are meant to support your own review. They are not legal advice and do not replace
          a check by a qualified person. Before relying on a result or sharing a masked document,
          check it yourself.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'Acceptable use',
    content: (
      <>
        <p>Do not:</p>
        <ul>
          <li>try to access accounts or data of other users;</li>
          <li>try to break, bypass or test the security of the service without our consent;</li>
          <li>
            overload the service, for example with automated mass sign-ups or requests (the service
            limits the number of requests);
          </li>
          <li>use the service to process content that is against the law.</li>
        </ul>
        <p>We may block an account that breaks these Terms. When possible, we will tell you why.</p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    content: (
      <p>
        The service is provided as it is, in the early version described above. As far as the law
        allows, we are not liable for decisions made on the basis of results, for loss of documents
        that were not kept elsewhere or for breaks in the availability of the service. This does not
        limit any liability that cannot be limited by law.
      </p>
    ),
  },
  {
    id: 'ending',
    title: 'Ending the use of the service',
    content: (
      <p>
        You can stop using the service at any time. To have your account and data deleted, contact
        us <ContactReference />.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and contact',
    content: (
      <>
        <p>
          We may change these Terms as the project develops. The date of the last change is shown at
          the top of this page; when a change matters for you, we will tell you in the application
          or by email.
        </p>
        <p>
          These Terms are governed by Polish law. Questions about them can be sent{' '}
          <ContactReference />.
        </p>
      </>
    ),
  },
];

export default function TermsOfService() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro={
        <p>
          The rules of using CerberDoc, a document checking service developed as part of an
          engineering thesis. They describe the service at its current, early stage.
        </p>
      }
      sections={sections}
    />
  );
}
