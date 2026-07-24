import React, { useState } from 'react';
import type { LiteracyModule } from '../../types/finance';
import { CheckCircle, XCircle, ArrowRight, Sparkles } from 'lucide-react';

interface QuizCardProps {
  module: LiteracyModule;
  onAnswerSubmit: (answerIndex: number) => void;
  onClose: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ module, onAnswerSubmit, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(module.completed);
  const [isCorrect, setIsCorrect] = useState<boolean>(module.completed);

  const handleOptionClick = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || isSubmitted) return;
    const correct = selectedIndex === module.quiz.correctIndex;
    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswerSubmit(selectedIndex);
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> +{module.xpPoints} XP Quiz
        </span>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">
          Close
        </button>
      </div>

      <h3 className="font-bold text-slate-100 text-base">{module.quiz.question}</h3>

      {/* Options List */}
      <div className="space-y-2">
        {module.quiz.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          let btnStyle = 'bg-slate-800/70 border-white/5 text-slate-200 hover:bg-slate-800';

          if (isSubmitted) {
            if (idx === module.quiz.correctIndex) {
              btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold';
            } else if (isSelected && idx !== module.quiz.correctIndex) {
              btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300';
            }
          } else if (isSelected) {
            btnStyle = 'bg-teal-500/20 border-teal-500/50 text-teal-200 font-semibold';
          }

          return (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => handleOptionClick(idx)}
              className={`w-full p-3 text-left rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{option}</span>
              {isSubmitted && idx === module.quiz.correctIndex && (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
              {isSubmitted && isSelected && idx !== module.quiz.correctIndex && (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {isSubmitted && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 ${
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <p className="font-bold flex items-center gap-1">
            {isCorrect ? 'Correct Answer!' : 'Incorrect'}
          </p>
          <p className="text-slate-300 text-[11px] leading-relaxed">{module.quiz.explanation}</p>
        </div>
      )}

      {/* Submit / Finish Button */}
      {!isSubmitted ? (
        <button
          disabled={selectedIndex === null}
          onClick={handleSubmit}
          className="w-full py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 text-xs"
        >
          Submit Answer <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 text-slate-200 font-semibold rounded-xl hover:bg-slate-700 transition-all text-xs"
        >
          Continue Module
        </button>
      )}
    </div>
  );
};
