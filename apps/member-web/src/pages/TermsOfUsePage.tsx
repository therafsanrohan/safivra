import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SEO } from '@/components/ui/SEO';
import { Layers } from 'lucide-react';

export const TermsOfUsePage: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  return (
    <>
      <SEO title={isBn ? 'ব্যবহারের শর্তাবলী - Safivra' : 'Terms of Use - Safivra'} />
      <div className="w-full flex flex-col items-center overflow-x-hidden page-container pt-16 pb-20">
        <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 mx-auto">
              <Layers size={32} />
            </div>
            <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)]">
              {isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Use'}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {isBn ? 'সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬' : 'Last Updated: September 2026'}
            </p>
          </div>

          <div className="prose prose-teal max-w-none text-[var(--color-text-primary)]">
            <p>
              By accessing and using Safivra, you agree to comply with and be bound by the following terms and conditions. If you disagree with any part of these terms, please do not use our service.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
            <p>Safivra provides its service to you subject to these Terms of Use, which may be updated occasionally without notice. Your continued use of the service constitutes acceptance of any updates.</p>

            <h3 className="text-xl font-bold mt-8 mb-4">2. Description of Service</h3>
            <p>Safivra is a personal financial management tool designed to help users track expenses, budgets, loans, and assets. The application is a tool for personal use and does not provide certified financial, investment, or legal advice.</p>

            <h3 className="text-xl font-bold mt-8 mb-4">3. User Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate and complete information during registration.</li>
              <li>You must not use the service for any illegal or unauthorized purpose.</li>
            </ul>

            <h3 className="text-xl font-bold mt-8 mb-4">4. Limitation of Liability</h3>
            <p>
              Safivra and its developers (Creatiancy) shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Safivra is provided "as is" without warranties of any kind.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">5. Intellectual Property</h3>
            <p>All content, features, and functionality of Safivra are owned by its developers and are protected by international copyright, trademark, and other intellectual property laws.</p>
          </div>
        </div>
      </div>
    </>
  );
};
