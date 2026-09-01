import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SEO } from '@/components/ui/SEO';
import { Lock } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  return (
    <>
      <SEO title={isBn ? 'নিরাপত্তা - Safivra' : 'Security - Safivra'} />
      <div className="w-full flex flex-col items-center overflow-x-hidden page-container pt-16 pb-20">
        <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="text-center space-y-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mx-auto">
              <Lock size={32} />
            </div>
            <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)]">
              {isBn ? 'নিরাপত্তা ও সুরক্ষা' : 'Security & Protection'}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {isBn ? 'কিভাবে আমরা আপনার ডেটা সুরক্ষিত রাখি' : 'How we keep your financial data safe'}
            </p>
          </div>

          <div className="prose prose-emerald max-w-none text-[var(--color-text-primary)]">
            <p>
              Security is our foundational principle. Safivra is built from the ground up to protect your sensitive financial data using enterprise-grade security architecture.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">1. Database Security (RLS)</h3>
            <p>
              We utilize PostgreSQL Row Level Security (RLS). This means the database physically prevents any user from accessing another user's data. Even if a flaw occurred in our application logic, the database engine itself enforces strict isolation based on your cryptographic Auth Token.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">2. Encryption in Transit and at Rest</h3>
            <p>
              All data transmitted between your device and our servers is protected using Transport Layer Security (TLS/SSL). Additionally, your data is encrypted at rest on our secure servers, protecting it against unauthorized physical or digital access.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">3. Authentication</h3>
            <p>
              We use Supabase Auth (powered by GoTrue) for secure, token-based authentication. Passwords are cryptographically hashed and salted using bcrypt, meaning we never store or see your plaintext password.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-4">4. Content Security Policy (CSP)</h3>
            <p>
              The Safivra application implements strict Content Security Policies in the browser to prevent Cross-Site Scripting (XSS) attacks, ensuring only authorized scripts and API calls can be executed on your device.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
