import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { QuizCard } from './QuizCard';
import type { LiteracyModule } from '../../types/finance';
import { GraduationCap, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export const LiteracyHub: React.FC = () => {
  const { literacyModules, submitQuizAnswer, profile } = useFinance();
  const [activeModule, setActiveModule] = useState<LiteracyModule | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);

  const completedCount = literacyModules.filter((m) => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 glow-emerald">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-extrabold text-white">Financial Literacy & Wealth Hub</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bite-sized financial mastery modules. Earn XP, increase your readiness score, and build wealth skills.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-white/10 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Literacy Score</span>
              <span className="text-xl font-black text-emerald-400 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" /> {profile.literacyScore} XP
              </span>
            </div>

            <div className="bg-slate-900/90 border border-white/10 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Completed</span>
              <span className="text-xl font-black text-slate-100">
                {completedCount} / {literacyModules.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Reader Modal or Cards List */}
      {activeModule ? (
        <div className="glass-panel p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {activeModule.category}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{activeModule.title}</h2>
            </div>
            <button
              onClick={() => {
                setActiveModule(null);
                setShowQuiz(false);
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10"
            >
              Back to Modules
            </button>
          </div>

          {!showQuiz ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {activeModule.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    {paragraph}
                  </p>
                ))}
              </div>

              <button
                onClick={() => setShowQuiz(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                Take Module Quiz (+{activeModule.xpPoints} XP)
              </button>
            </div>
          ) : (
            <QuizCard
              module={activeModule}
              onAnswerSubmit={(idx) => submitQuizAnswer(activeModule.id, idx)}
              onClose={() => setShowQuiz(false)}
            />
          )}
        </div>
      ) : (
        /* Modules Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {literacyModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => setActiveModule(mod)}
              className="glass-panel-interactive p-5 space-y-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  {mod.category}
                </span>
                {mod.completed ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {mod.durationMinutes} min
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
                {mod.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {mod.summary}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" /> +{mod.xpPoints} XP Reward
                </span>
                <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-slate-400">
                  Read Module &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
