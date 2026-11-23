// src/pages/legal/PrivacyPolicy.tsx

import { ContactReference, DocumentLink, LegalDocument } from './LegalDocument';

const sections = [
  {
    id: 'controller',
    title: 'Who is responsible for your data',
    content: (
      <p>
        Your personal data in CerberDoc is processed by the team developing the service as part of
        an engineering thesis. You can reach us <ContactReference />.
      </p>
    ),
  },
  {
    id: 'data',
    title: 'What data we process',
    content: (
      <ul>
        <li>
          <strong className="font-medium text-gray-900">Account data:</strong> name, surname,
          company (optional) and email address. Your password is stored only in a hashed form that
          cannot be turned back into the password.
        </li>
        <li>
          <strong className="font-medium text-gray-900">Documents and results:</strong> the files
          you upload, the text recognised in them, masked versions of the documents and the results
          of rule checks and analyses. Documents can contain personal data of you and of other
          people.
        </li>
        <li>
          <strong className="font-medium text-gray-900">Technical data:</strong> IP address and
          details of requests (time, address in the service), used to protect the service, for
          example to limit the number of login attempts, and kept in server logs.
        </li>
        <li>
          <strong className="font-medium text-gray-900">Emails:</strong> messages needed to run your
          account, such as links to confirm your email address and to reset the password.
        </li>
        <li>
          <strong className="font-medium text-gray-900">Contact form:</strong> your email address,
          the name and subject if you give them, and the message. They are delivered to our mailbox
          as an email and are not stored in the service.
        </li>
      </ul>
    ),
  },
  {
    id: 'purposes',
    title: 'Why we process it',
    content: (
      <ul>
        <li>
          To provide the service you signed up for: your account and the processing of your
          documents (Art. 6(1)(b) GDPR).
        </li>
        <li>
          To keep the service secure and working, and to prevent abuse (our legitimate interest,
          Art. 6(1)(f) GDPR).
        </li>
        <li>To answer your messages (our legitimate interest, Art. 6(1)(f) GDPR).</li>
      </ul>
    ),
  },
  {
    id: 'processing',
    title: 'How your documents are processed',
    content: (
      <>
        <p>To analyse a document, the service uses the following external services:</p>
        <ul>
          <li>
            <strong className="font-medium text-gray-900">
              Microsoft Azure AI Document Intelligence
            </strong>{' '}
            to recognise the text of the document;
          </li>
          <li>
            <strong className="font-medium text-gray-900">Azure OpenAI Service</strong> to prepare
            the analysis of the content with a language model.
          </li>
        </ul>
        <p>
          Anonymization is on by default: personal data found in the text is masked before the text
          is sent to the language model. You can turn anonymization or the analysis by the language
          model off in the settings of an analysis; with anonymization off, the full text of the
          document is sent. Automatic masking can miss some data, so do not upload more personal
          data than needed.
        </p>
        <p>
          Results are not used to make decisions about you that have legal effects; they only
          support your own review of a document.
        </p>
      </>
    ),
  },
  {
    id: 'recipients',
    title: 'Who else receives the data',
    content: (
      <>
        <p>We use providers that process data on our behalf:</p>
        <ul>
          <li>the hosting provider of the server where the service and the data are stored;</li>
          <li>Cloudflare, through which the traffic to the service goes;</li>
          <li>
            Microsoft (Azure), for text recognition and the language model, as described above;
          </li>
          <li>the email provider that delivers messages from the service.</li>
        </ul>
        <p>
          Some providers can process data outside the European Economic Area; in that case the
          transfer is based on safeguards required by the GDPR, such as standard contractual
          clauses. We do not sell your data and do not use it for advertising.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep the data',
    content: (
      <ul>
        <li>Account data: until the account is deleted.</li>
        <li>
          Documents and results: until you delete the analysis in the application or ask us to
          delete them, and at the latest until the account is deleted.
        </li>
        <li>Server logs: for a short time; older entries are overwritten regularly.</li>
        <li>
          Links to confirm the email address stop working after 24 hours, password reset links after
          30 minutes; both work only once.
        </li>
        <li>
          Messages from the contact form: as long as needed to answer them and handle the matter.
        </li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and storage in the browser',
    content: (
      <>
        <p>
          The service uses only cookies needed to keep you logged in (session tokens, not readable
          by scripts on the page). It does not use analytics or advertising cookies, so no consent
          banner is shown.
        </p>
        <p>
          Your browser also remembers the analysis settings you chose last time (anonymization and
          the language model). They stay on your device and you can remove them by clearing the site
          data in the browser.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <p>
        Traffic to the service is encrypted (HTTPS), passwords are stored hashed and documents are
        available only in the account that uploaded them. Administrators of the service can access
        data only when this is needed to maintain the service or to answer your request.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    content: (
      <>
        <p>Under the GDPR you have the right to:</p>
        <ul>
          <li>access your data and get a copy of it;</li>
          <li>correct it (name, surname and company can be changed in Account details);</li>
          <li>have it deleted or its processing restricted;</li>
          <li>receive the data you gave us in a format that can be read by a computer;</li>
          <li>object to processing based on our legitimate interest.</li>
        </ul>
        <p>
          To use these rights, contact us <ContactReference />. You can also lodge a complaint with
          the supervisory authority, in Poland the President of the Personal Data Protection Office
          (Prezes Urzędu Ochrony Danych Osobowych).
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We will update this policy when the way the service processes data changes. The date of the
        last change is shown at the top of this page. See also the{' '}
        <DocumentLink to="/terms">Terms of Service</DocumentLink>.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro={
        <p>
          How CerberDoc, a document checking service developed as part of an engineering thesis,
          processes personal data. It describes the service at its current, early stage.
        </p>
      }
      sections={sections}
    />
  );
}
