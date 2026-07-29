import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error internally without exposing details to public UI
    if (import.meta.env.DEV) {
      console.error('[Safivra ErrorBoundary]', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-svh flex items-center justify-center bg-[var(--color-bg-page)] p-6 fade-in">
          <div className="max-w-md w-full text-center space-y-5 bg-[var(--color-bg-surface)] p-8 rounded-[var(--radius-sheet)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-[var(--color-negative-soft)] text-[var(--color-negative)]">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-[var(--text-page)] font-bold text-[var(--color-text-primary)]">
                Application Protection Active
              </h1>
              <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">
                An unexpected security boundary exception occurred. Your session data remains safe.
              </p>
            </div>
            <div className="pt-2">
              <Button onClick={this.handleReset} fullWidth className="gap-2">
                <RefreshCw size={18} /> Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
