import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Question } from '../types';
import { matchesSearch } from '../utils/text';

interface SearchViewProps {
  questions: Question[];
}

export const SearchView: React.FC<SearchViewProps> = ({ questions }) => {
  const [query, setQuery] = useState<string>('');
  const [partFilter, setPartFilter] = useState<'all' | 'P1' | 'P2'>('all');
  // Default false = Show all 4 options (A, B, C, D) and highlight the correct one!
  const [onlyCorrect, setOnlyCorrect] = useState<boolean>(false);

  const results = useMemo(() => {
    return questions.filter((q) => {
      if (partFilter !== 'all' && q.part !== partFilter) return false;
      if (!query.trim()) return true;
      const clean = query.trim();
      if (/^\d+$/.test(clean)) {
        const num = parseInt(clean, 10);
        if (q.id === num || q.origNum === num) return true;
      }
      if (matchesSearch(q.question, clean)) return true;
      return q.options.some((opt) => matchesSearch(opt, clean));
    });
  }, [questions, query, partFilter]);

  return (
    <div className="max-w-3xl mx-auto space-y-3 pb-24 animate-card">
      {/* Sticky Search & Filter Header (Mobile Responsive) */}
      <div className="sticky top-14 sm:top-16 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-2.5 sm:p-3.5 shadow-xs space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm câu hỏi, đáp án (có dấu/không dấu) hoặc số câu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-200/80 text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'all', label: 'Full 294 câu' },
              { id: 'P1', label: 'Phần 1 (146)' },
              { id: 'P2', label: 'Phần 2 (148)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPartFilter(tab.id as 'all' | 'P1' | 'P2')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                  partFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOnlyCorrect((v) => !v)}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1 whitespace-nowrap transition active:scale-95 ${
              onlyCorrect
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {onlyCorrect ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{onlyCorrect ? 'Đang ẩn 3 ĐA sai' : 'Hiện đủ 4 ĐA'}</span>
          </button>
        </div>
      </div>

      <div className="text-xs font-bold text-slate-500 px-1 flex items-center justify-between">
        <span>Hiển thị {results.length} câu hỏi</span>
        <span className="text-emerald-600 font-extrabold">✓ Đáp án đúng được tô xanh</span>
      </div>

      {/* Full Question List with Highlighted Correct Answer */}
      <div className="space-y-3">
        {results.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-extrabold whitespace-nowrap">
                  Câu {q.id}
                </span>
                <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                  ({q.part} - Câu {q.origNum}) • {q.topicShortName}
                </span>
              </div>

              {q.siblingIds.length > 1 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold whitespace-nowrap">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Trùng {q.siblingIds.length} câu
                </span>
              )}
            </div>

            <h3 className="text-[15px] sm:text-base font-extrabold text-slate-900 leading-snug">
              {q.question}
            </h3>

            {onlyCorrect ? (
              <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs sm:text-sm font-bold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctIndex;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border-2 text-xs sm:text-[15px] flex items-start gap-2.5 transition ${
                        isCorrect
                          ? 'bg-emerald-50/95 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-slate-50/50 border-slate-100 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-500'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
