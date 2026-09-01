import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SEO } from '@/components/ui/SEO';
import { Shield } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  return (
    <>
      <SEO title={isBn ? 'গোপনীয়তা নীতি - Safivra' : 'Privacy Policy - Safivra'} />
      <div className="w-full flex flex-col items-center overflow-x-hidden page-container pt-16 pb-20">
        <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mx-auto">
              <Shield size={32} />
            </div>
            <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)]">
              {isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {isBn ? 'সর্বশেষ আপডেট: সেপ্টেম্বর ২০২৬' : 'Last Updated: September 2026'}
            </p>
          </div>

          <div className="prose prose-emerald max-w-none text-[var(--color-text-primary)]">
            <p>
              {isBn 
                ? 'Safivra-তে আমরা আপনার গোপনীয়তা এবং ডেটা সুরক্ষাকে সর্বোচ্চ অগ্রাধিকার দিই। এই নীতিমালায় ব্যাখ্যা করা হয়েছে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত করি।' 
                : 'At Safivra, we prioritize your privacy and data security above all else. This policy explains how we collect, use, and protect your personal information.'}
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h3>
            <p>We only collect the information necessary to provide you with our financial management services:</p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
              <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, and secure passwords (encrypted via Supabase Auth).</li>
              <li><strong>Financial Data:</strong> Transaction records, account balances, budgets, loans, and categories you input into the system.</li>
              <li><strong>Device Information:</strong> Basic analytics such as device type and browser to optimize performance.</li>
            </ul>

            <h3 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Data</h3>
            <p>Your data is used strictly for:</p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--color-text-secondary)]">
              <li>Providing you with accurate financial analytics and dashboards.</li>
              <li>Ensuring account security and preventing unauthorized access.</li>
              <li>Improving app performance and user experience.</li>
            </ul>
            <p className="font-semibold text-emerald-600 mt-4">We do NOT sell, rent, or trade your personal or financial data to any third-party advertisers or data brokers.</p>

            <h3 className="text-xl font-bold mt-8 mb-4">3. Data Security</h3>
            <p>
              We implement industry-standard security measures including PostgreSQL Row Level Security (RLS) to ensure that only YOU can access your financial records. All data is encrypted in transit (TLS) and at rest.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">4. Your Rights</h3>
            <p>You have the right to access, modify, or permanently delete your account and all associated data at any time through the app settings.</p>

            <h3 className="text-xl font-bold mt-8 mb-4">5. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact our support team or the developer: <a href="https://www.creatiancy.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Creatiancy</a>.</p>
          </div>
        </div>
      </div>
    </>
  );
};
