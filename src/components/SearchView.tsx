import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { Question } from '../types';
import { matchesSearch } from '../utils/text';

interface SearchViewProps {
  questions: Question[];
}

export const SearchView: React.FC<SearchViewProps> = ({ questions }) => {
  const [query, setQuery] = useState<string>('');
  const [onlyCorrect, setOnlyCorrect] = useState<boolean>(true);

  const results = useMemo(() => {
    if (!query.trim()) return questions;
    const clean = query.trim();
    return questions.filter((q) => {
      if (/^\d+$/.test(clean)) {
        const num = parseInt(clean, 10);
        if (q.id === num || q.origNum === num) return true;
      }
      if (matchesSearch(q.question, clean)) return true;
      return q.options.some((opt) => matchesSearch(opt, clean));
    });
  }, [questions, query]);

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-20 animate-card">
      {/* Sticky Search Input */}
      <div className="sticky top-[54px] z-20 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ từ khóa bất kỳ hoặc số câu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOnlyCorrect((v) => !v)}
          className={`shrink-0 px-3 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1 transition ${
            onlyCorrect
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          {onlyCorrect ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{onlyCorrect ? 'Chỉ hiện ĐA đúng' : 'Hiện 4 ĐA'}</span>
        </button>
      </div>

      <div className="text-xs font-bold text-slate-400 px-1">
        {results.length} câu hỏi (Mặc định ẩn 3 đáp án sai để đọc lướt thuộc nhanh)
      </div>

      <div className="space-y-2.5">
        {results.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5"
          >
            <div className="text-xs font-bold text-slate-400">
              Câu #{q.id} ({q.part}-{q.origNum}) • {q.topicShortName}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
              {q.question}
            </h3>

            {onlyCorrect ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{q.options[q.correctIndex]}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {q.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs sm:text-sm ${
                      idx === q.correctIndex
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
