import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export const PublicLayout: React.FC = () => {
  const { user } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-svh flex flex-col bg-[var(--color-bg-page)] font-sans">
      <header className="sticky top-0 z-40 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">
              {/* Safivra Logo placeholder */}
              <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="text-xl font-bold text-[var(--color-text-primary)]">Safivra</span>
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

      <footer className="w-full bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[var(--color-accent)] rounded flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">Safivra</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">Your money, finally makes sense.</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li><a href="/#features" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Features</a></li>
              <li><Link to="/security" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Security</Link></li>
              <li><a href="/#faq" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li><Link to="/privacy-policy" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Privacy Policy</Link></li>
              <li><Link to="/terms-of-use" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Terms of Use</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              {user ? (
                <li><Link to="/dashboard" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Dashboard</Link></li>
              ) : (
                <>
                  <li><Link to="/auth/sign-in" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Sign In</Link></li>
                  <li><Link to="/auth/sign-up" className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded">Create Account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
          <p>© {new Date().getFullYear()} Safivra. All rights reserved.</p>
          <p>
            Developed by{' '}
            <a 
              href="https://www.creatiancy.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
              style={{ textDecoration: 'none' }}
            >
              Creatiancy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
