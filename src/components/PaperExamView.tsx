import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  RotateCcw,
  Shuffle,
  Flag,
  Grid,
  Sparkles,
  X,
  AlertCircle,
  Zap,
  Award,
} from 'lucide-react';
import { Question, DeckDefinition, ExamRecord } from '../types';
import { shuffleArray, formatTime } from '../utils/text';

interface PaperExamViewProps {
  deck: DeckDefinition;
  allQuestions: Question[];
  initialMode: 'practice' | 'exam';
  initialShuffleQuestions: boolean;
  initialShuffleOptions: boolean;
  onBack: () => void;
  onAttemptQuestion: (questionId: number, isCorrect: boolean) => void;
  onSubmitDeck: (
    deckId: string,
    record: ExamRecord,
    correctIds: number[],
    wrongIds: number[]
  ) => void;
}

interface PaperQuestionItem {
  question: Question;
  options: { text: string; originalIndex: number }[];
}

export const PaperExamView: React.FC<PaperExamViewProps> = ({
  deck,
  allQuestions,
  initialMode,
  initialShuffleQuestions,
  initialShuffleOptions,
  onBack,
  onAttemptQuestion,
  onSubmitDeck,
}) => {
  const [mode, setMode] = useState<'practice' | 'exam'>(initialMode);
  const [shuffleQ, setShuffleQ] = useState<boolean>(initialShuffleQuestions);
  const [shuffleOpt, setShuffleOpt] = useState<boolean>(initialShuffleOptions);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [items, setItems] = useState<PaperQuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [showPaletteDrawer, setShowPaletteDrawer] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [isRetryWrongSubset, setIsRetryWrongSubset] = useState<boolean>(false);

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const questionMap = useMemo(() => {
    const map = new Map<number, Question>();
    for (const q of allQuestions) map.set(q.id, q);
    return map;
  }, [allQuestions]);

  const buildPaperItems = (
    sourceIds: number[],
    doShuffleQ: boolean,
    doShuffleOpt: boolean,
    limit40 = false
  ) => {
    let baseList = sourceIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Question => Boolean(q));

    if (doShuffleQ || limit40) {
      baseList = shuffleArray(baseList);
    }
    if (limit40 && baseList.length > 40) {
      baseList = baseList.slice(0, 40);
    }

    const built: PaperQuestionItem[] = baseList.map((q) => {
      const rawOpts = q.options.map((text, idx) => ({ text, originalIndex: idx }));
      return {
        question: q,
        options: doShuffleOpt ? shuffleArray(rawOpts) : rawOpts,
      };
    });

    setItems(built);
    setAnswers({});
    setFlaggedIds(new Set());
    setElapsedSeconds(0);
    setIsSubmitted(false);
    setResultFilter('all');
    setShowConfirmSubmit(false);
    setShowPaletteDrawer(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    buildPaperItems(
      deck.questionIds,
      initialShuffleQuestions,
      initialShuffleOptions,
      Boolean(deck.isRandom40)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id]);

  // Timer
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSelectAnswer = (q: Question, originalOptIdx: number) => {
    if (isSubmitted) return;
    // In practice mode, once answered, lock that question and record immediately
    if (mode === 'practice' && answers[q.id] !== undefined) return;

    setAnswers((prev) => ({
      ...prev,
      [q.id]: originalOptIdx,
    }));

    if (mode === 'practice') {
      const isCorrect = originalOptIdx === q.correctIndex;
      onAttemptQuestion(q.id, isCorrect);
    }
  };

  const toggleFlag = (qId: number) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const scrollToQuestion = (qId: number) => {
    setShowPaletteDrawer(false);
    const el = cardRefs.current[qId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const finalizeSubmission = () => {
    if (isSubmitted) return;
    const correctIds: number[] = [];
    const wrongIds: number[] = [];

    for (const item of items) {
      const q = item.question;
      if (answers[q.id] === q.correctIndex) {
        correctIds.push(q.id);
      } else {
        wrongIds.push(q.id);
      }
    }

    const total = items.length;
    const score = total > 0 ? Math.round((correctIds.length / total) * 1000) / 100 : 0;

    const record: ExamRecord = {
      id: `${Date.now()}`,
      deckId: deck.id,
      date: new Date().toLocaleString('vi-VN'),
      scopeLabel: isRetryWrongSubset ? `${deck.title} (Làm lại câu sai)` : deck.title,
      totalQuestions: total,
      correctCount: correctIds.length,
      score,
      durationSeconds: elapsedSeconds,
      wrongQuestionIds: wrongIds,
    };

    onSubmitDeck(deck.id, record, correctIds, wrongIds);
    setShowConfirmSubmit(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = items.length - answeredCount;

  const summary = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let empty = 0;
    const wrongIds: number[] = [];

    for (const item of items) {
      const chosen = answers[item.question.id];
      if (chosen === undefined) {
        empty++;
        wrongIds.push(item.question.id);
      } else if (chosen === item.question.correctIndex) {
        correct++;
      } else {
        wrong++;
        wrongIds.push(item.question.id);
      }
    }

    const score = items.length > 0 ? ((correct / items.length) * 10).toFixed(2) : '0.00';
    return { correct, wrong, empty, score, wrongIds };
  }, [items, answers]);

  return (
    <div className="min-h-screen bg-slate-100/90 pb-24">
      {/* Sticky Top Exam Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 active:scale-95 transition shrink-0"
              title="Quay lại danh sách đề"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 truncate">
                {deck.title}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span>
                  Đã làm:{' '}
                  <strong className="text-indigo-600">
                    {answeredCount}/{items.length}
                  </strong>
                </span>
                {mode === 'practice' && !isSubmitted && (
                  <span className="text-emerald-600 font-bold">
                    • Đúng {summary.correct} / Sai {summary.wrong}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Timer + Palette Trigger + Submit Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs sm:text-sm font-extrabold">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowPaletteDrawer(true)}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold active:scale-95 transition"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Bảng câu</span>
            </button>

            {!isSubmitted ? (
              <button
                type="button"
                onClick={() => {
                  if (unansweredCount > 0) setShowConfirmSubmit(true);
                  else finalizeSubmission();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-sm shadow-indigo-500/25 active:scale-95 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsRetryWrongSubset(false);
                  buildPaperItems(deck.questionIds, true, true, Boolean(deck.isRandom40));
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-extrabold active:scale-95 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại đề</span>
              </button>
            )}
          </div>
        </div>

        {/* Thin Progress Strip */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300"
            style={{
              width: `${items.length > 0 ? Math.round((answeredCount / items.length) * 100) : 0}%`,
            }}
          />
        </div>
      </header>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-card">
            <div className="flex items-center gap-2.5 text-amber-600 mb-2">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900">
                Còn {unansweredCount} câu chưa chọn!
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              Những câu chưa chọn đáp án sẽ bị tính là câu sai. Bạn có muốn nộp bài chấm điểm ngay bây giờ?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={finalizeSubmission}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700"
              >
                Chấm điểm luôn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-4">
        {/* Top Toolbar (Before submission): Mode Switch + Shuffle Controls */}
        {!isSubmitted && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 mb-4 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                  mode === 'practice'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Chọn xong hiện ĐA ngay
              </button>
              <button
                type="button"
                onClick={() => setMode('exam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                  mode === 'exam'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Nộp bài mới hiện ĐA
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextQ = !shuffleQ;
                  setShuffleQ(nextQ);
                  buildPaperItems(
                    items.map((i) => i.question.id),
                    nextQ,
                    shuffleOpt,
                    false
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition active:scale-95 ${
                  shuffleQ
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Đảo câu
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextOpt = !shuffleOpt;
                  setShuffleOpt(nextOpt);
                  buildPaperItems(
                    items.map((i) => i.question.id),
                    shuffleQ,
                    nextOpt,
                    false
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition active:scale-95 ${
                  shuffleOpt
                    ? 'bg-violet-50 border-violet-300 text-violet-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Đảo A/B/C/D
              </button>
            </div>
          </div>
        )}

        {/* Score Result Banner (After submission) */}
        {isSubmitted && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 mb-5 shadow-sm animate-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                  <span className="text-2xl font-black leading-none">{summary.score}</span>
                  <span className="text-[10px] font-bold text-indigo-100 mt-1">THANG 10</span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Kết quả: Đúng {summary.correct}/{items.length} câu
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Sai: <strong className="text-rose-600">{summary.wrong}</strong> câu • Bỏ trống:{' '}
                    <strong className="text-amber-600">{summary.empty}</strong> câu • Thời gian:{' '}
                    <strong>{formatTime(elapsedSeconds)}</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons to Re-test Wrong Questions or Full Deck */}
              <div className="flex flex-wrap items-center gap-2">
                {summary.wrongIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRetryWrongSubset(true);
                      buildPaperItems(summary.wrongIds, true, true, false);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-rose-500/20 flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Làm lại {summary.wrongIds.length} câu vừa sai
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsRetryWrongSubset(false);
                    buildPaperItems(deck.questionIds, true, true, Boolean(deck.isRandom40));
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Shuffle className="w-4 h-4" />
                  Làm lại cả đề (Trộn mới)
                </button>
              </div>
            </div>

            {/* Filter Pills for Reviewing Answers */}
            <div className="flex items-center gap-2 pt-4">
              <span className="text-xs font-bold text-slate-400 mr-1">Lọc bài làm:</span>
              {[
                { id: 'all', label: `Tất cả (${items.length})` },
                { id: 'wrong', label: `Câu sai / Trống (${summary.wrongIds.length})` },
                { id: 'correct', label: `Câu đúng (${summary.correct})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setResultFilter(f.id as 'all' | 'wrong' | 'correct')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    resultFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Layout: Left Questions Stream + Right Question Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Vertical Stream of Question Cards */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item, idx) => {
              const q = item.question;
              const chosenOrig = answers[q.id];
              const isAnswered = chosenOrig !== undefined;
              const showFeedback = isSubmitted || (mode === 'practice' && isAnswered);
              const isCorrectAnswer = chosenOrig === q.correctIndex;
              const isFlagged = flaggedIds.has(q.id);

              if (isSubmitted) {
                if (resultFilter === 'wrong' && isCorrectAnswer) return null;
                if (resultFilter === 'correct' && !isCorrectAnswer) return null;
              }

              // Find selected visual letter (A/B/C/D)
              const selectedVisualIdx = item.options.findIndex(
                (o) => o.originalIndex === chosenOrig
              );

              const siblings =
                q.siblingIds.length > 1
                  ? q.siblingIds
                      .map((id) => questionMap.get(id))
                      .filter((sq): sq is Question => Boolean(sq))
                  : [];

              return (
                <div
                  key={q.id}
                  ref={(el) => {
                    cardRefs.current[q.id] = el;
                  }}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Question Card Header */}
                  <div className="px-4 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-extrabold">
                        Câu {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Mã #{q.id} ({q.part}-{q.origNum})
                      </span>
                      {siblings.length > 1 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Trùng {siblings.length} câu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {showFeedback &&
                        (isCorrectAnswer ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-extrabold">
                            <XCircle className="w-3.5 h-3.5" />{' '}
                            {chosenOrig === undefined ? 'Chưa làm' : 'Sai'}
                          </span>
                        ))}

                      {!isSubmitted && (
                        <button
                          type="button"
                          onClick={() => toggleFlag(q.id)}
                          className={`p-1.5 rounded-xl border transition ${
                            isFlagged
                              ? 'bg-amber-100 border-amber-300 text-amber-700'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                          title="Đánh dấu phân vân"
                        >
                          <Flag
                            className={`w-3.5 h-3.5 ${
                              isFlagged ? 'fill-amber-500 text-amber-600' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Stem & Options */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-[15px] sm:text-base font-extrabold text-slate-900 leading-relaxed mb-4">
                      {q.question}
                    </h3>

                    <div className="space-y-2">
                      {item.options.map((opt, vIdx) => {
                        const letter = String.fromCharCode(65 + vIdx);
                        const isThisSelected = chosenOrig === opt.originalIndex;
                        const isThisCorrect = opt.originalIndex === q.correctIndex;

                        let rowStyle =
                          'border-slate-200/80 bg-slate-50/40 hover:border-indigo-300 hover:bg-indigo-50/20 text-slate-800';
                        let letterStyle = 'bg-white border-slate-200 text-slate-700';

                        if (!showFeedback) {
                          if (isThisSelected) {
                            rowStyle =
                              'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-600';
                            letterStyle = 'bg-indigo-600 border-indigo-600 text-white';
                          }
                        } else {
                          if (isThisCorrect) {
                            rowStyle =
                              'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold ring-1 ring-emerald-500';
                            letterStyle = 'bg-emerald-600 border-emerald-600 text-white';
                          } else if (isThisSelected) {
                            rowStyle =
                              'border-rose-500 bg-rose-50/90 text-rose-950 font-semibold ring-1 ring-rose-500 animate-shake';
                            letterStyle = 'bg-rose-600 border-rose-600 text-white';
                          } else {
                            rowStyle = 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-60';
                            letterStyle = 'bg-slate-100 border-slate-200 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={opt.originalIndex}
                            type="button"
                            disabled={showFeedback}
                            onClick={() => handleSelectAnswer(q, opt.originalIndex)}
                            className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 active:scale-[0.99] ${rowStyle}`}
                          >
                            <span
                              className={`w-7 h-7 rounded-xl border text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${letterStyle}`}
                            >
                              {letter}
                            </span>
                            <span className="flex-1 text-sm sm:text-[15px] leading-relaxed">
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Azota-style Quick Answer Bubble Row (A - B - C - D) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        Chọn nhanh đáp án:
                      </span>
                      <div className="flex items-center gap-2">
                        {item.options.map((opt, vIdx) => {
                          const letter = String.fromCharCode(65 + vIdx);
                          const isSelected = selectedVisualIdx === vIdx;
                          const isCorrect = opt.originalIndex === q.correctIndex;

                          let pillClass =
                            'bg-slate-100 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300';
                          if (!showFeedback) {
                            if (isSelected) {
                              pillClass =
                                'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/30';
                            }
                          } else {
                            if (isCorrect) {
                              pillClass = 'bg-emerald-600 border-emerald-600 text-white';
                            } else if (isSelected) {
                              pillClass = 'bg-rose-600 border-rose-600 text-white';
                            } else {
                              pillClass = 'bg-slate-100 border-slate-200 text-slate-300';
                            }
                          }

                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={showFeedback}
                              onClick={() => handleSelectAnswer(q, opt.originalIndex)}
                              className={`w-10 h-9 sm:w-11 sm:h-9 rounded-xl border text-xs font-black transition active:scale-90 flex items-center justify-center ${pillClass}`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sibling Question Comparison Box (shown after feedback if question has duplicate stems!) */}
                    {showFeedback && siblings.length > 1 && (
                      <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80">
                        <div className="text-xs font-extrabold text-amber-900 mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Mẹo phân biệt ({siblings.length} câu hỏi trùng nội dung câu này):
                          </span>
                        </div>
                        <ul className="space-y-1 text-xs text-amber-950">
                          {siblings.map((sq) => (
                            <li
                              key={sq.id}
                              className={`px-2.5 py-1.5 rounded-xl ${
                                sq.id === q.id ? 'bg-amber-200/70 font-bold' : 'bg-white/70'
                              }`}
                            >
                              <strong className="text-amber-900">Câu #{sq.id}:</strong>{' '}
                              {sq.options[sq.correctIndex]}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Sticky Question Palette (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Danh sách câu hỏi ({items.length})
              </h3>
              <span className="text-xs font-bold text-indigo-600">
                {answeredCount}/{items.length}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {items.map((item, idx) => {
                const q = item.question;
                const chosen = answers[q.id];
                const isAnswered = chosen !== undefined;
                const showFeedback = isSubmitted || (mode === 'practice' && isAnswered);
                const flagged = flaggedIds.has(q.id);

                let boxClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                if (!showFeedback) {
                  if (isAnswered)
                    boxClass = 'bg-indigo-600 border-indigo-600 text-white font-extrabold';
                  if (flagged)
                    boxClass = 'bg-amber-400 border-amber-500 text-slate-950 font-extrabold';
                } else {
                  boxClass =
                    chosen === q.correctIndex
                      ? 'bg-emerald-500 border-emerald-600 text-white font-extrabold'
                      : 'bg-rose-500 border-rose-600 text-white font-extrabold';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => scrollToQuestion(q.id)}
                    className={`h-9 rounded-xl border text-xs font-bold transition flex items-center justify-center ${boxClass}`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" /> Đã chọn
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Đúng
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Sai
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Gắn cờ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Palette */}
      {showPaletteDrawer && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end animate-fade"
          onClick={() => setShowPaletteDrawer(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-5 max-h-[75vh] flex flex-col animate-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-sm font-extrabold text-slate-900">
                Bảng câu hỏi ({answeredCount}/{items.length} đã làm)
              </span>
              <button
                type="button"
                onClick={() => setShowPaletteDrawer(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pb-4">
                {items.map((item, idx) => {
                  const q = item.question;
                  const chosen = answers[q.id];
                  const isAnswered = chosen !== undefined;
                  const showFeedback = isSubmitted || (mode === 'practice' && isAnswered);
                  const flagged = flaggedIds.has(q.id);

                  let boxClass = 'bg-slate-50 border-slate-200 text-slate-700';
                  if (!showFeedback) {
                    if (isAnswered)
                      boxClass = 'bg-indigo-600 border-indigo-600 text-white font-extrabold';
                    if (flagged)
                      boxClass = 'bg-amber-400 border-amber-500 text-slate-950 font-extrabold';
                  } else {
                    boxClass =
                      chosen === q.correctIndex
                        ? 'bg-emerald-500 border-emerald-600 text-white font-extrabold'
                        : 'bg-rose-500 border-rose-600 text-white font-extrabold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => scrollToQuestion(q.id)}
                      className={`h-10 rounded-xl border text-xs font-bold flex items-center justify-center ${boxClass}`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
