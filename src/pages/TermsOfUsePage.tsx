import React from 'react';
import { SEO } from '@/components/ui/SEO';

const COMPANY_NAME = '[Legal Operator Name]';
const JURISDICTION = '[Governing Jurisdiction]';
const CONTACT_EMAIL = '[Privacy Contact Email]';

export const TermsOfUsePage: React.FC = () => {
  return (
    <>
      <SEO title="Terms of Use" description="Terms of Use for Safivra." />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">Terms of Use</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Effective Date: [Date]<br />
          Last Updated: [Date]
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none text-[var(--color-text-secondary)]">
          <p>
            Welcome to Safivra. By accessing or using our application, you agree to these Terms of Use.
          </p>
          
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By creating an account and using Safivra, you agree to be bound by these Terms. If you do not agree, you must not use the service.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">2. Eligibility</h2>
          <p>
            You must be at least [Age] years old to use Safivra. By using the service, you represent and warrant that you meet this requirement.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">3. User Account Responsibility</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">4. Permitted and Prohibited Use</h2>
          <p>
            Safivra is provided for personal financial management. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>Use the service for any illegal purpose.</li>
            <li>Attempt to bypass security controls or access data belonging to other users.</li>
            <li>Reverse engineer or misuse the software infrastructure.</li>
            <li>Use the service to transmit malicious software.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">5. Financial Disclaimer</h2>
          <p>
            <strong>No Banking Relationship:</strong> Safivra is a personal financial management tool. It is not a bank, lender, or financial institution.<br />
            <strong>No Professional Advice:</strong> Safivra does not provide investment advice, accounting advice, tax advice, or legal advice. The information you generate using Safivra is for your personal use, and you should consult a certified professional before making significant financial decisions.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">6. Service Availability and Cloud Limitations</h2>
          <p>
            Safivra is a cloud-based service and requires an internet connection. We strive for high uptime, but we do not guarantee uninterrupted access. Service may be temporarily unavailable due to maintenance or infrastructure issues. We are not liable for data access delays during outages.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">7. User Content and Financial Records</h2>
          <p>
            You retain ownership of the financial data you input. By entering data into Safivra, you grant us a license to process and store it solely for the purpose of providing the service to you.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">8. Intellectual Property</h2>
          <p>
            The Safivra application, including its design, code, graphics, and features, is owned by {COMPANY_NAME}. You may not copy, modify, or distribute any part of the service without explicit permission.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">9. Account Suspension and Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account if you violate these terms. You may also terminate your account at any time. Upon termination, your active data will be scheduled for deletion in accordance with our Privacy Policy.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for any indirect, incidental, or consequential damages resulting from your use of Safivra, including but not loss of data or financial losses.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">11. Changes to Terms</h2>
          <p>
            We may modify these Terms of Use at any time. Continued use of the application after changes constitute your acceptance of the updated terms.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">12. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of {JURISDICTION}.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">13. Contact Information</h2>
          <p>
            If you have questions about these Terms, please contact us at {CONTACT_EMAIL}.
          </p>
        </div>
      </div>
    </>
  );
};
