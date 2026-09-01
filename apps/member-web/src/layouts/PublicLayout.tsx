import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';

export const PublicLayout: React.FC = () => {
  const { user } = useAuthContext();
  const { locale } = useLanguage();
  const isBn = locale === 'bn';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-svh flex flex-col bg-[var(--color-bg-page)] font-sans">
      <header className="sticky top-0 z-40 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">
              <Logo textClassName="text-xl" />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="/#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors">Features</a>
            <a href="/#how-it-works" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors">How It Works</a>
            <Link to="/security" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors">Security</Link>
            <a href="/#web-app" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors">Web App</a>
            <a href="/#faq" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary">Open Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth/sign-up">
                  <Button variant="primary">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-4 space-y-4">
            <a href="/#features" className="block text-lg font-medium text-[var(--color-text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="/#how-it-works" className="block text-lg font-medium text-[var(--color-text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a>
            <Link to="/security" className="block text-lg font-medium text-[var(--color-text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}>Security</Link>
            <a href="/#web-app" className="block text-lg font-medium text-[var(--color-text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}>Web App</a>
            <a href="/#faq" className="block text-lg font-medium text-[var(--color-text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
            
            <div className="pt-4 border-t border-[var(--color-border)] flex flex-col gap-3">
              {user ? (
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth>Open Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth>Sign In</Button>
                  </Link>
                  <Link to="/auth/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full flex flex-col items-center">
        <Outlet />
      </main>

      <footer className="w-full bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-sm text-[var(--color-text-secondary)]">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Safivra</h3>
              <p className="max-w-xs leading-relaxed">
                {isBn ? 'আপনার ব্যক্তিগত অর্থের হিসাব রাখার বিশ্বস্ত সঙ্গী।' : 'Your trusted companion for personal financial management.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-[var(--color-text-primary)]">{isBn ? 'প্রোডাক্ট' : 'Product'}</h4>
                <ul className="space-y-2">
                  <li><a href="/#features" className="hover:text-[var(--color-text-primary)]">{isBn ? 'ফিচারসমূহ' : 'Features'}</a></li>
                  <li><Link to="/security" className="hover:text-[var(--color-text-primary)]">{isBn ? 'নিরাপত্তা' : 'Security'}</Link></li>
                  <li><a href="/#faq" className="hover:text-[var(--color-text-primary)]">{isBn ? 'সাধারণ জিজ্ঞাসা' : 'FAQ'}</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-[var(--color-text-primary)]">{isBn ? 'লিগ্যাল' : 'Legal'}</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy-policy" className="hover:text-[var(--color-text-primary)]">{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</Link></li>
                  <li><Link to="/terms-of-use" className="hover:text-[var(--color-text-primary)]">{isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Use'}</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} Safivra. {isBn ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}</p>
            <p>
              <span className="font-semibold">{isBn ? 'নির্মাতা' : 'Developed by'}</span> <a href="https://www.creatiancy.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Creatiancy</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
