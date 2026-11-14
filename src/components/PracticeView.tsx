import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { Question, Topic, UserProgress } from '../types';
import { shuffleArray } from '../utils/text';

interface PracticeViewProps {
  questions: Question[];
  topics: Topic[];
  progress: UserProgress;
  onAttempt: (questionId: number, isCorrect: boolean) => void;
  initialFilter?: string;
  onClearInitialFilter?: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  questions,
  topics,
  progress,
  onAttempt,
  initialFilter,
  onClearInitialFilter,
}) => {
  const [selectedScope, setSelectedScope] = useState<string>(initialFilter || 'topic-1');
  // "memorize" = tô sẵn đáp án đúng để đọc lướt nhớ mặt chữ
  // "test" = tự chọn đáp án, câu nào sai tự động lặp lại cuối bài cho đến khi thuộc!
  const [mode, setMode] = useState<'test' | 'memorize'>('test');
  const [shuffleOpts, setShuffleOpts] = useState<boolean>(true);

  // Queue of question IDs in current session (wrong answers get pushed back to the end of queue so user MUST master 100%!)
  const [queue, setQueue] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [firstTryWrongIds, setFirstTryWrongIds] = useState<Set<number>>(new Set());
  const [seed, setSeed] = useState<number>(1);

  const touchStartX = useRef<number | null>(null);

  const questionMap = useMemo(() => {
    const map = new Map<number, Question>();
    for (const q of questions) map.set(q.id, q);
    return map;
  }, [questions]);

  const masteredSet = useMemo(() => new Set(progress.masteredIds), [progress.masteredIds]);

  const baseQuestions = useMemo(() => {
    if (selectedScope === 'all') return questions;
    if (selectedScope === 'P1') return questions.filter((q) => q.part === 'P1');
    if (selectedScope === 'P2') return questions.filter((q) => q.part === 'P2');
    if (selectedScope === 'wrong') {
      const wrongSet = new Set(progress.activeWrongIds);
      return questions.filter((q) => wrongSet.has(q.id));
    }
    if (selectedScope === 'duplicates') {
      return questions.filter((q) => q.duplicateGroupId !== null);
    }
    if (selectedScope.startsWith('topic-')) {
      const tId = parseInt(selectedScope.replace('topic-', ''), 10);
      return questions.filter((q) => q.topicId === tId);
    }
    return questions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, selectedScope]);

  // Initialize queue when scope changes
  const initQueue = useCallback(
    (list: Question[], shouldShuffle = false) => {
      const ids = list.map((q) => q.id);
      setQueue(shouldShuffle ? shuffleArray(ids) : ids);
      setCurrentIndex(0);
      setSelectedOpt(null);
      setFirstTryWrongIds(new Set());
      setSeed((s) => s + 1);
    },
    []
  );

  useEffect(() => {
    if (initialFilter) {
      setSelectedScope(initialFilter);
      onClearInitialFilter?.();
    }
  }, [initialFilter, onClearInitialFilter]);

  useEffect(() => {
    initQueue(baseQuestions, false);
  }, [baseQuestions, initQueue]);

  const currentQuestionId = queue[currentIndex];
  const currentQuestion = currentQuestionId ? questionMap.get(currentQuestionId) || null : null;

  useEffect(() => {
    setSelectedOpt(null);
  }, [currentIndex, currentQuestionId, mode]);

  // Options for current question
  const displayedOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const items = currentQuestion.options.map((text, idx) => ({
      text,
      originalIndex: idx,
    }));
    if (!shuffleOpts || mode === 'memorize') return items;
    const copy = [...items];
    let hash = (currentQuestion.id + currentIndex * 17) * 2654435761 + seed * 1013904223;
    for (let i = copy.length - 1; i > 0; i--) {
      hash = (hash ^ (hash >>> 15)) * 2246822519;
      const j = Math.abs(hash) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [currentQuestion, currentIndex, shuffleOpts, mode, seed]);

  const siblingQuestions = useMemo(() => {
    if (!currentQuestion || currentQuestion.siblingIds.length <= 1) return [];
    return currentQuestion.siblingIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Question => Boolean(q));
  }, [currentQuestion, questionMap]);

  const handleChooseOption = useCallback(
    (origIdx: number) => {
      if (!currentQuestion || mode === 'memorize' || selectedOpt !== null) return;

      setSelectedOpt(origIdx);
      const isCorrect = origIdx === currentQuestion.correctIndex;
      onAttempt(currentQuestion.id, isCorrect);

      if (isCorrect) {
        // Auto-advance after 550ms when correct!
        setTimeout(() => {
          setCurrentIndex((idx) => Math.min(idx + 1, queue.length));
        }, 550);
      } else {
        // If wrong: push this question ID to the end of the queue so the user MUST answer it again later in this session!
        setFirstTryWrongIds((prev) => new Set(prev).add(currentQuestion.id));
        setQueue((prevQueue) => [...prevQueue, currentQuestion.id]);
      }
    },
    [currentQuestion, mode, selectedOpt, onAttempt, queue.length]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      const key = e.key.toUpperCase();
      if (mode === 'test' && selectedOpt === null && ['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        if (displayedOptions[idx]) {
          e.preventDefault();
          handleChooseOption(displayedOptions[idx].originalIndex);
        }
      } else if (mode === 'test' && selectedOpt === null && ['A', 'B', 'C', 'D'].includes(key)) {
        const idx = key.charCodeAt(0) - 65;
        if (displayedOptions[idx]) {
          e.preventDefault();
          handleChooseOption(displayedOptions[idx].originalIndex);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        if (currentIndex < queue.length - 1) {
          e.preventDefault();
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          e.preventDefault();
          setCurrentIndex((i) => i - 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, selectedOpt, displayedOptions, handleChooseOption, currentIndex, queue.length]);

  const isCompleted = queue.length > 0 && currentIndex >= queue.length;
  const isRepeatQuestion = currentIndex >= baseQuestions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-24">
      {/* 1. Simple Topic Selector + Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
        {/* Horizontal Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {topics.map((t) => {
            const total = questions.filter((q) => q.topicId === t.id).length;
            const done = questions.filter((q) => q.topicId === t.id && masteredSet.has(q.id)).length;
            const active = selectedScope === `topic-${t.id}`;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedScope(`topic-${t.id}`)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : done === total
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                Bài {t.id} ({done}/{total})
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedScope('P1')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedScope === 'P1' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Phần 1 (146)
          </button>
          <button
            type="button"
            onClick={() => setSelectedScope('P2')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedScope === 'P2' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Phần 2 (148)
          </button>
        </div>

        {/* 2-Step Memorization Switch: "Bước 1: Đọc nhẩm ĐA" vs "Bước 2: Tự làm cho thuộc" */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex-1 grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('memorize')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'memorize'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              1. Đọc nhẩm ĐA đúng
            </button>
            <button
              type="button"
              onClick={() => setMode('test')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'test'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              2. Trắc nghiệm nhớ bài
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShuffleOpts((v) => !v);
              initQueue(baseQuestions, true);
            }}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition"
            title="Trộn câu hỏi & đảo đáp án"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty or Completed State */}
      {baseQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-sm font-bold text-slate-600">Không có câu hỏi nào trong mục này.</p>
        </div>
      ) : isCompleted ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 animate-card">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Đã thuộc 100% chặng này!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bạn đã trả lời đúng toàn bộ {baseQuestions.length} câu hỏi (kể cả {firstTryWrongIds.size} câu lúc đầu làm sai đã được hỏi lại đến khi đúng).
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => initQueue(baseQuestions, true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Luyện lại lần nữa (Trộn đề)
            </button>
          </div>
        </div>
      ) : (
        currentQuestion && (
          <div
            key={`${currentIndex}-${currentQuestion.id}`}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (dx < -60 && currentIndex < queue.length - 1) setCurrentIndex((i) => i + 1);
              else if (dx > 60 && currentIndex > 0) setCurrentIndex((i) => i - 1);
            }}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden animate-card"
          >
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((currentIndex + 1) / queue.length) * 100))}%`,
                }}
              />
            </div>

            <div className="p-4 sm:p-6">
              {/* Top Meta Line */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Câu {currentIndex + 1} / {queue.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    (Câu #{currentQuestion.id} gốc)
                  </span>
                </div>

                {isRepeatQuestion && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">
                    Học lại câu vừa sai ↻
                  </span>
                )}
              </div>

              {/* Question Stem */}
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug mb-4">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-2.5">
                {displayedOptions.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = opt.originalIndex === currentQuestion.correctIndex;
                  const isSelected = selectedOpt === opt.originalIndex;

                  let style =
                    'border-slate-200 bg-slate-50/60 hover:border-blue-400 text-slate-800 active:scale-[0.99]';
                  let badge = 'bg-white border-slate-200 text-slate-600';

                  if (mode === 'memorize') {
                    // In "Đọc nhẩm" mode: highlight the correct answer clearly and dim the 3 wrong ones so the brain only remembers the right one!
                    if (isCorrect) {
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-2xs';
                      badge = 'bg-emerald-600 border-emerald-600 text-white';
                    } else {
                      style = 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-50';
                      badge = 'bg-slate-100 border-slate-200 text-slate-400';
                    }
                  } else if (selectedOpt !== null) {
                    if (isCorrect) {
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                      badge = 'bg-emerald-600 border-emerald-600 text-white';
                    } else if (isSelected) {
                      style = 'border-rose-500 bg-rose-50 text-rose-950 animate-shake';
                      badge = 'bg-rose-600 border-rose-600 text-white';
                    } else {
                      style = 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={opt.originalIndex}
                      type="button"
                      disabled={mode === 'memorize' || selectedOpt !== null}
                      onClick={() => handleChooseOption(opt.originalIndex)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${style}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg border text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${badge}`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 text-sm sm:text-[15px] leading-relaxed">
                        {opt.text}
                      </span>
                      {(mode === 'memorize' || selectedOpt !== null) && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {selectedOpt !== null && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* When wrong in Test mode: remind user that this question will repeat at the end of the lesson + show Next button */}
              {mode === 'test' &&
                selectedOpt !== null &&
                selectedOpt !== currentQuestion.correctIndex && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-rose-800">
                      Đã đưa câu này xuống cuối bài để lát hỏi lại cho thuộc!
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((i) => i + 1)}
                      className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95"
                    >
                      Tiếp tục →
                    </button>
                  </div>
                )}

              {/* Duplicate Stem Note: super helpful when multiple questions have the exact same stem */}
              {siblingQuestions.length > 1 &&
                (mode === 'memorize' || selectedOpt !== null) && (
                  <div className="mt-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80">
                    <div className="flex items-center gap-1.5 text-amber-900 text-xs font-extrabold mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Lưu ý: Có {siblingQuestions.length} câu hỏi giống hệt câu này, các đáp án đúng là:
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-amber-950">
                      {siblingQuestions.map((sq) => (
                        <li
                          key={sq.id}
                          className={`px-2.5 py-1.5 rounded-lg flex items-start gap-2 ${
                            sq.id === currentQuestion.id
                              ? 'bg-amber-200/70 font-bold'
                              : 'bg-white/70'
                          }`}
                        >
                          <span className="text-[11px] font-extrabold text-amber-800 shrink-0">
                            • Câu #{sq.id}:
                          </span>
                          <span>{sq.options[sq.correctIndex]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        )
      )}

      {/* Simple Bottom Prev / Next Bar */}
      {!isCompleted && baseQuestions.length > 0 && (
        <div className="fixed bottom-[58px] md:static inset-x-0 z-20 px-3 md:px-0">
          <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-2 shadow-md md:shadow-none flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center gap-1 disabled:opacity-35 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Câu trước
            </button>

            <span className="text-xs font-bold text-slate-500">
              {mode === 'memorize'
                ? 'Đọc lướt đáp án xanh'
                : 'Chọn đúng tự qua • Sai lặp lại'}
            </span>

            <button
              type="button"
              disabled={currentIndex >= queue.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(queue.length - 1, i + 1))}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold flex items-center gap-1 disabled:opacity-35 active:scale-95"
            >
              Câu tiếp
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
