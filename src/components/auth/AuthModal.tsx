import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ShieldCheck, UserCheck, CheckCircle2, Building2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, isAuthenticated, setIsAuthenticated, profile, updateProfile, activeWorkspace, setActiveWorkspace, workspaces } = useFinance();

  const [mode, setMode] = useState<'login' | 'register' | 'mfa'>('login');
  const [email, setEmail] = useState<string>(profile.email);
  const [password, setPassword] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('');

  if (!isAuthOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.mfaEnabled && mode !== 'mfa') {
      setMode('mfa');
      return;
    }
    setIsAuthenticated(true);
    setIsAuthOpen(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setIsAuthOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0d111a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            {isAuthenticated ? 'Session & Workspaces' : mode === 'login' ? 'Sign In to Safivra' : mode === 'register' ? 'Create Account' : 'Multi-Factor Auth (MFA)'}
          </h2>
          <button onClick={() => setIsAuthOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAuthenticated ? (
          /* Authenticated Workspace & Session View */
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-slate-100">{profile.fullName}</p>
                <p className="text-[10px] text-emerald-400">{profile.email} • Authenticated Session</p>
              </div>
            </div>

            {/* Workspace Switcher */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-violet-400" /> Active Multi-Tenant Workspace
              </label>
              <div className="space-y-1.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => setActiveWorkspace(ws)}
                    className={`w-full p-3 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                      activeWorkspace.id === ws.id
                        ? 'bg-violet-500/20 border-violet-500/50 text-slate-100 font-bold'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{ws.name} ({ws.type.toUpperCase()})</span>
                    <span className="text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-violet-400">{ws.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MFA Security Toggle */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-teal-400" /> MFA Protection
              </span>
              <button
                onClick={() => updateProfile({ mfaEnabled: !profile.mfaEnabled })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  profile.mfaEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {profile.mfaEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setIsAuthOpen(false);
              }}
              className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-xl text-xs hover:bg-rose-500/20"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Sign In / Register Form */
          <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
            {mode === 'mfa' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">Enter 6-digit authenticator code to verify session:</p>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-emerald-400 focus:outline-none"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 transition-all text-xs"
            >
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Verify MFA Code'}
            </button>

            <div className="text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <button type="button" onClick={() => setMode('register')} className="hover:text-emerald-400 underline">
                  Need an account? Register
                </button>
              ) : (
                <button type="button" onClick={() => setMode('login')} className="hover:text-emerald-400 underline">
                  Already registered? Sign In
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
