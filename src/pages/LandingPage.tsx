import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/ui/SEO';
import {
  Cloud,
  Shield,
  Smartphone,
  CheckCircle,
  PieChart,
  Activity,
  CreditCard,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <>
      <SEO />
      <div className="w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-6">
            Your money, finally makes sense.
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-4">
            Manage your accounts, spending, credit cards, loans, savings and financial goals from one secure place.
          </p>
          <p className="text-md text-[var(--color-text-muted)] max-w-2xl mx-auto mb-10">
            Built for everyday financial life in Bangladesh.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/sign-up">
              <Button variant="primary" size="lg" className="px-8 text-lg">Get Started</Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-8 text-lg">Explore Features</Button>
            </a>
          </div>

          {/* Hero Visual Preview */}
          <div className="mt-16 max-w-5xl mx-auto bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden aspect-video flex items-center justify-center relative">
            {/* Safe visual mock-up without real data */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-page)] to-[var(--color-bg-surface)] flex items-center justify-center p-8">
              <div className="w-full h-full border border-[var(--color-border)] rounded-xl bg-white/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="h-24 w-1/3 bg-[var(--color-border)] rounded-lg animate-pulse opacity-50"></div>
                  <div className="h-24 w-1/3 bg-[var(--color-border)] rounded-lg animate-pulse opacity-50"></div>
                  <div className="h-24 w-1/3 bg-[var(--color-border)] rounded-lg animate-pulse opacity-50"></div>
                </div>
                <div className="flex-1 flex gap-4">
                  <div className="w-2/3 h-full bg-[var(--color-border)] rounded-lg animate-pulse opacity-50"></div>
                  <div className="w-1/3 h-full bg-[var(--color-border)] rounded-lg animate-pulse opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="w-full border-y border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Cloud className="w-6 h-6 text-[var(--color-text-secondary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">Cloud Connected</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-6 h-6 text-[var(--color-text-secondary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">Private by Design</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] font-bold">৳</div>
                <span className="font-medium text-[var(--color-text-primary)]">Built for BDT</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Smartphone className="w-6 h-6 text-[var(--color-text-secondary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">Works Across Devices</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem and Solution */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">
            Money becomes confusing when everything lives separately.
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mb-10 opacity-70">
            {['Cash', 'Bank account', 'Mobile wallet', 'Credit card', 'Loan', 'Savings', 'Recurring bills', 'Financial goals'].map((item) => (
              <span key={item} className="px-4 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-full text-[var(--color-text-secondary)]">
                {item}
              </span>
            ))}
          </div>
          <div className="max-w-3xl mx-auto bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-[var(--color-accent)] mb-4">One clear financial picture.</h3>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Safivra brings your financial accounts, activity, commitments and plans into one connected system.
            </p>
          </div>
        </section>

        {/* Core Features */}
        <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[var(--color-accent)]" /> Everything in one place
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  See your cash, bank accounts, mobile wallets, savings and investments from one connected view.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--color-accent)]" /> Understand where your money goes
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  Track real income and expenses without incorrectly counting transfers, card payments or loan principal twice.
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2 italic">
                  Powered by structured double-entry accounting.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[var(--color-accent)]" /> Stay ahead of cards and loans
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  Understand outstanding balances, utilization, installments, interest and upcoming due dates.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--color-accent)]" /> Plan what comes next
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  Create budgets, manage savings plans, track recurring commitments and work towards meaningful goals.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[var(--color-accent)]" /> Accurate financial records
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  Safivra keeps connected financial activity organized through a structured accounting engine.
                </p>
              </div>
            </div>
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm aspect-[4/5] flex items-center justify-center p-8">
               <div className="w-full h-full border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-page)] shadow-inner opacity-50 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Financial Plans Section */}
        <section className="w-full bg-[var(--color-bg-surface)] border-y border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-12">Plan for the future</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Budgets', desc: 'Set spending limits and track progress against real expenses.', link: '/plans/budgets' },
                { title: 'Savings, DPS and FDR', desc: 'Manage savings products, recurring deposits and maturity plans.', link: '/plans/savings' },
                { title: 'Recurring', desc: 'Track repeated bills, subscriptions, income and transfers.', link: '/plans/recurring' },
                { title: 'Goals', desc: 'Turn financial targets into visible progress.', link: '/plans/goals' },
              ].map((item) => (
                <Link to={item.link} key={item.title} className="block group p-6 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] text-left">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Credit Cards and Loans */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Debt should be visible, not confusing.</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12">
            Safivra separates purchases, repayments, principal, interest and fees so your financial picture stays accurate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-surface)] text-left">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Credit Cards</h3>
              <ul className="space-y-3 text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Outstanding balance</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Available credit</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Utilization</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Statement date</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Payment due date</li>
              </ul>
            </div>
            <div className="p-8 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-surface)] text-left">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Loans</h3>
              <ul className="space-y-3 text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Original principal</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Remaining principal</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Interest</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Next payment</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-accent)]" /> Payment progress</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="w-full bg-[var(--color-bg-surface)] border-y border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-12">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {[
                { step: 1, title: 'Create your financial accounts', desc: 'Add cash, bank accounts, mobile wallets, cards, loans and savings.' },
                { step: 2, title: 'Record financial activity', desc: 'Add income, expenses, transfers and payments through simple guided forms.' },
                { step: 3, title: 'Understand and improve', desc: 'Use summaries, budgets, reports and goals to make clearer financial decisions.' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center relative z-10">
                  <div className="w-12 h-12 bg-[var(--color-accent)] text-white font-bold rounded-full flex items-center justify-center text-xl mb-6 shadow-md">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">{item.title}</h3>
                  <p className="text-[var(--color-text-secondary)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Web App */}
        <section id="web-app" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Your financial system, available from the web.</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
            Access Safivra securely from your phone, tablet or computer through a responsive cloud-connected web application.
          </p>
          <Link to="/auth/sign-in">
            <Button variant="primary" size="lg" className="mb-4">Open Safivra</Button>
          </Link>
          <p className="text-xs text-[var(--color-text-muted)]">Mobile and desktop applications are planned for future releases.</p>
        </section>

        {/* Security */}
        <section className="w-full bg-[var(--color-bg-surface)] border-y border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8">Your finances stay yours.</h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12">
              Safivra uses account-level access controls so authenticated users can only access their own financial records.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto text-left">
              {[
                'Secure account authentication',
                'User-level data isolation',
                'Cloud-connected financial records',
                'No financial records saved in normal browser storage',
              ].map((point) => (
                <div key={point} className="flex items-center gap-3 p-4 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-lg">
                  <Shield className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                  <span className="text-[var(--color-text-secondary)] font-medium">{point}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link to="/security">
                <Button variant="outline">Read our Security Policy</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'What is Safivra?', a: 'Safivra is a personal financial management tool. It is not a bank, lender, investment adviser, accountant or legal adviser.' },
              { q: 'Does Safivra support Bangladeshi currency?', a: 'Yes, Safivra is built specifically for users managing BDT (৳) and accommodates local financial scenarios.' },
              { q: 'Can I track credit cards and loans?', a: 'Yes, our accounting engine tracks balances, limits, and separating principal/interest from typical expenses.' },
              { q: 'Does Safivra store financial data on my device?', a: 'No, financial records are stored securely in the cloud and are not intentionally saved in normal browser storage.' },
              { q: 'Can I use Safivra from different devices?', a: 'Yes, since Safivra is a cloud-connected web application, you can access your account from your phone, tablet, or computer.' },
              { q: 'How are transfers treated?', a: 'Transfers between your accounts do not count as new income or new expenses, keeping your actual cash flow accurate.' },
              { q: 'Can I delete my financial records?', a: 'Yes, you can safely delete your accounts, transactions, or completely remove your account and data.' },
              { q: 'Is Safivra a bank or financial adviser?', a: 'No. Safivra is a personal financial management tool. It is not a bank, lender, investment adviser, accountant or legal adviser.' },
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full bg-[var(--color-accent)]/5 border-t border-[var(--color-border)] py-24 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-6">Take control of your financial life.</h2>
            <p className="text-xl text-[var(--color-text-secondary)] mb-10">Start with one account and build a clearer picture of your finances.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth/sign-up">
                <Button variant="primary" size="lg" className="px-8 text-lg">Create Your Account</Button>
              </Link>
              <Link to="/auth/sign-in">
                <Button variant="outline" size="lg" className="px-8 text-lg bg-transparent hover:bg-black/5 dark:hover:bg-white/10">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-surface)] overflow-hidden">
      <button 
        className="w-full text-left px-6 py-4 font-semibold text-[var(--color-text-primary)] flex justify-between items-center focus:outline-none focus-visible:bg-black/5 dark:focus-visible:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {question}
        {isOpen ? <ChevronUp size={20} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={20} className="text-[var(--color-text-muted)]" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-[var(--color-text-secondary)] leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};
