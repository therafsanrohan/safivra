import React from 'react';
import { SEO } from '@/components/ui/SEO';
import { Shield, Lock, Server, Cloud } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <>
      <SEO title="Security" description="How Safivra protects your financial data." />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <Shield className="w-16 h-16 text-[var(--color-accent)] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">Security at Safivra</h1>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Your financial data is private and sensitive. Here is how we ensure it remains secure and protected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-[var(--color-bg-surface)] p-8 border border-[var(--color-border)] rounded-2xl">
            <Lock className="w-8 h-8 text-[var(--color-accent)] mb-4" />
            <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Authentication</h3>
            <p className="text-[var(--color-text-secondary)]">
              Access to your Safivra account requires secure authentication. We use modern, industry-standard authentication protocols to ensure that only you can access your account. Your passwords are encrypted and never stored in plain text.
            </p>
          </div>
          
          <div className="bg-[var(--color-bg-surface)] p-8 border border-[var(--color-border)] rounded-2xl">
            <Server className="w-8 h-8 text-[var(--color-accent)] mb-4" />
            <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Data Isolation</h3>
            <p className="text-[var(--color-text-secondary)]">
              Our cloud database employs strict Row Level Security (RLS) policies. This means at the core database level, your financial records are cryptographically tied to your user identity, preventing unauthorized cross-account access.
            </p>
          </div>

          <div className="bg-[var(--color-bg-surface)] p-8 border border-[var(--color-border)] rounded-2xl">
            <Cloud className="w-8 h-8 text-[var(--color-accent)] mb-4" />
            <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Cloud Infrastructure</h3>
            <p className="text-[var(--color-text-secondary)]">
              Safivra is hosted on reliable, enterprise-grade cloud infrastructure. We utilize secure HTTPS for all communications between your device and our servers to protect your data while in transit.
            </p>
          </div>

          <div className="bg-[var(--color-bg-surface)] p-8 border border-[var(--color-border)] rounded-2xl">
            <Shield className="w-8 h-8 text-[var(--color-accent)] mb-4" />
            <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Browser Safety</h3>
            <p className="text-[var(--color-text-secondary)]">
              Your financial records are not intentionally saved in standard browser storage. We manage sessions securely to reduce the risk of unauthorized access on shared devices. Always remember to sign out on public computers.
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-[var(--color-text-secondary)]">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-8 mb-4">Responsible Disclosure</h2>
          <p>
            If you are a security researcher and have discovered a security vulnerability in our application, we appreciate your help in disclosing it to us in a responsible manner. Please contact our support team immediately so we can investigate and patch the issue promptly.
          </p>
        </div>
      </div>
    </>
  );
};
