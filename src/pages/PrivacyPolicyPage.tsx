import React from 'react';
import { SEO } from '@/components/ui/SEO';

const COMPANY_NAME = '[Legal Operator Name]';
const CONTACT_EMAIL = '[Privacy Contact Email]';
const POSTAL_ADDRESS = '[Postal Address]';
const SUPPORT_URL = '[Support URL]';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <>
      <SEO title="Privacy Policy" description="Privacy policy for Safivra." />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">Privacy Policy</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Effective Date: [Date]<br />
          Last Updated: [Date]
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none text-[var(--color-text-secondary)]">
          <p>
            This Privacy Policy explains how {COMPANY_NAME} ("we," "us," or "our") collects, uses, and discloses your information when you use Safivra.
          </p>
          
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">1. Introduction</h2>
          <p>
            Safivra is a personal financial management application. {COMPANY_NAME} acts as the data controller and service provider for this application.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">2. Information Collected</h2>
          <p>We only collect data that the system actually handles to provide you with the Safivra service:</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li><strong>Account Information:</strong> Information required to create and secure your account (e.g., email address, password).</li>
            <li><strong>Financial Records:</strong> Accounts, budgets, transactions, and other financial records you actively enter into the system.</li>
            <li><strong>Device and Browser Information:</strong> Basic analytics and diagnostic data.</li>
            <li><strong>Security and Diagnostic Logs:</strong> For system reliability and abuse prevention.</li>
            <li><strong>Support Communications:</strong> If you contact us for help.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">3. Financial Information</h2>
          <p>
            Safivra stores user-entered personal financial records. Safivra is not directly connected to a bank. Users are strictly responsible for the accuracy of information they manually enter into the system.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">4. How Information is Used</h2>
          <p>We use the collected information for purposes such as:</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>Providing the Safivra financial management service.</li>
            <li>Authenticating users securely.</li>
            <li>Saving and synchronizing your financial records.</li>
            <li>Calculating summaries and insights based on your entries.</li>
            <li>Improving system reliability and security.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">5. Legal Bases (If Applicable)</h2>
          <p>
            Where legally required, we rely on contractual necessity, legitimate business interests (such as preventing abuse and maintaining service security), and your consent.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">6. Cloud Storage and Processing</h2>
          <p>
            Account and financial information is processed through secure cloud infrastructure. Your data is managed using industry-standard cloud database services (e.g., Supabase, Vercel).
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">7. Browser and Device Storage</h2>
          <p>
            Financial records are not intentionally stored in normal browser local storage. However, temporary interface state may exist while using the application, secure authentication tokens are required to maintain a signed-in session, and static application files may be cached for performance.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">8. Data Sharing</h2>
          <p>
            We may share your data with essential infrastructure and hosting providers required to run the service. We do not sell personal data. Data may be shared if required by law or during business transfers.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">9. Data Retention</h2>
          <p>
            We retain your active account data as long as you use the service. If you request account deletion, your data is permanently removed, though some security logs or backups may undergo a lifecycle deletion over time.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">10. User Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct, export, or delete your data. You can manage and delete your financial records directly within the application.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">11. Account Deletion</h2>
          <p>
            You can delete your account and financial data at any time from within the application or by contacting support. Upon deletion, financial records are removed permanently.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">12. International Data Transfers</h2>
          <p>
            Our service providers may process data in countries outside your residence. We ensure suitable safeguards are maintained for these transfers.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">13. Children’s Privacy</h2>
          <p>
            Safivra is not intended for users under the age of [Age]. We do not knowingly collect personal information from children.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">14. Security</h2>
          <p>
            We employ account-level access controls and secure cloud storage to protect your data. Each user can only access their own financial records.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">15. Changes to the Policy</h2>
          <p>
            We may update this policy over time. We will communicate material changes within the application or via email.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">16. Contact</h2>
          <p>
            For any privacy-related questions, please contact us at: <br />
            <strong>Email:</strong> {CONTACT_EMAIL}<br />
            <strong>Address:</strong> {POSTAL_ADDRESS}<br />
            <strong>Support:</strong> {SUPPORT_URL}
          </p>
        </div>
      </div>
    </>
  );
};
