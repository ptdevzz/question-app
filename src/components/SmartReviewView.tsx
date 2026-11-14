import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Play,
  Check,
  Search,
} from 'lucide-react';
import { Question, UserProgress } from '../types';
import { matchesSearch } from '../utils/text';

interface SmartReviewViewProps {
  questions: Question[];
  progress: UserProgress;
  onRemoveWrong: (questionId: number) => void;
  onStartPracticeScope: (scope: string) => void;
}

export const SmartReviewView: React.FC<SmartReviewViewProps> = ({
  questions,
  progress,
  onRemoveWrong,
  onStartPracticeScope,
}) => {
  const [subTab, setSubTab] = useState<'duplicates' | 'wrong'>('duplicates');
  const [dupSearch, setDupSearch] = useState<string>('');

  const wrongQuestions = useMemo(() => {
    const set = new Set(progress.activeWrongIds);
    return questions
      .filter((q) => set.has(q.id))
      .sort((a, b) => (progress.wrongCounts[b.id] || 0) - (progress.wrongCounts[a.id] || 0));
  }, [questions, progress.activeWrongIds, progress.wrongCounts]);

  const duplicateGroups = useMemo(() => {
    const groupsMap = new Map<number, Question[]>();
    for (const q of questions) {
      if (q.duplicateGroupId !== null) {
        const list = groupsMap.get(q.duplicateGroupId) || [];
        list.push(q);
        groupsMap.set(q.duplicateGroupId, list);
      }
    }
    const allGroups = Array.from(groupsMap.entries()).map(([groupId, items]) => ({
      groupId,
      title: items[0].question,
      items,
    }));

    if (!dupSearch.trim()) return allGroups;
    return allGroups.filter(
      (g) =>
        matchesSearch(g.title, dupSearch) ||
        g.items.some((q) => matchesSearch(q.options[q.correctIndex], dupSearch))
    );
  }, [questions, dupSearch]);

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-20 animate-card">
      {/* 2 Clear Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setSubTab('duplicates')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
            subTab === 'duplicates'
              ? 'bg-amber-500 text-slate-950 shadow-2xs'
              : 'text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>62 Cụm Câu Trùng (178 câu)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('wrong')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
            subTab === 'wrong'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Câu Đang Sai ({wrongQuestions.length})</span>
        </button>
      </div>

      {/* TAB 1: DUPLICATE GROUPS (EASIEST WAY TO MEMORIZE 178 QUESTIONS) */}
      {subTab === 'duplicates' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-amber-950">
              <p className="font-extrabold">Mẹo học thuộc nhanh 178/294 câu:</p>
              <p className="text-amber-800 mt-0.5">
                Các câu dưới đây có câu hỏi giống hệt nhau. Bạn chỉ cần đọc lướt các ý đúng bên dưới mỗi câu hỏi!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartPracticeScope('duplicates')}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Luyện
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={dupSearch}
              onChange={(e) => setDupSearch(e.target.value)}
              placeholder="Tìm nhanh câu hỏi trùng..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2.5">
            {duplicateGroups.map((g, idx) => (
              <div
                key={g.groupId}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Cụm #{idx + 1} • Có {g.items.length} câu hỏi giống nhau
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {g.title}
                </h4>

                <div className="space-y-1.5">
                  {g.items.map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm font-bold text-emerald-950 leading-snug">
                        <span className="text-emerald-700 mr-1.5">(Câu #{q.id})</span>
                        {q.options[q.correctIndex]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WRONG QUESTIONS */}
      {subTab === 'wrong' && (
        <div className="space-y-3">
          {wrongQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-extrabold text-slate-800">Không có câu làm sai!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Câu nào bạn chọn sai lúc học hoặc thi thử sẽ lưu vào đây để bạn ôn lại.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-rose-950">
                  <span className="font-extrabold">Bạn có {wrongQuestions.length} câu làm sai</span> cần học lại cho thuộc.
                </div>
                <button
                  type="button"
                  onClick={() => onStartPracticeScope('wrong')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Học lại ngay
                </button>
              </div>

              <div className="space-y-2.5">
                {wrongQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        Câu #{q.id} • Sai {progress.wrongCounts[q.id] || 1} lần
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveWrong(q.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Đã thuộc
                      </button>
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {q.question}
                    </h4>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-bold flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{q.options[q.correctIndex]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
