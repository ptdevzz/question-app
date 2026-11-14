import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Zap,
  Award,
  RotateCcw,
  Search,
  Sparkles,
  AlertTriangle,
  Layers,
  BookOpen,
  Trophy,
} from 'lucide-react';
import rawData from './data/questions.json';
import {
  QuestionDataset,
  UserProgress,
  ExamRecord,
  DeckDefinition,
} from './types';
import {
  loadProgress,
  recordQuestionAttempt,
  recordDeckSubmission,
  resetAllProgress,
} from './utils/storage';
import { PaperExamView } from './components/PaperExamView';
import { SearchView } from './components/SearchView';
import { SmartReviewView } from './components/SmartReviewView';
import { removeActiveWrong } from './utils/storage';

const dataset = rawData as unknown as QuestionDataset;

export function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeDeck, setActiveDeck] = useState<{
    deck: DeckDefinition;
    mode: 'practice' | 'exam';
    shuffleQ: boolean;
    shuffleOpt: boolean;
  } | null>(null);

  const [homeTab, setHomeTab] = useState<'decks' | 'duplicates' | 'search'>('decks');
  const [deckGroupStyle, setDeckGroupStyle] = useState<'50' | 'topic'>('50');

  const masteredSet = useMemo(() => new Set(progress.masteredIds), [progress.masteredIds]);

  const handleAttemptQuestion = useCallback((questionId: number, isCorrect: boolean) => {
    setProgress((prev) => recordQuestionAttempt(prev, questionId, isCorrect));
  }, []);

  const handleSubmitDeck = useCallback(
    (deckId: string, record: ExamRecord, correctIds: number[], wrongIds: number[]) => {
      setProgress((prev) => recordDeckSubmission(prev, deckId, record, correctIds, wrongIds));
    },
    []
  );

  const handleRemoveWrong = useCallback((questionId: number) => {
    setProgress((prev) => removeActiveWrong(prev, questionId));
  }, []);

  // Build standard 50-question decks (Azota style)
  const decksBy50: DeckDefinition[] = useMemo(() => {
    const ranges: {
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      start: number;
      end: number;
      accent: DeckDefinition['accent'];
    }[] = [
      {
        id: 'deck-1',
        title: 'Đề số 01: Câu 1 – 50',
        subtitle: 'Phần 1 (File P1 105.docx) • 50 câu đầu',
        badge: 'Đề 01',
        start: 1,
        end: 50,
        accent: 'indigo',
      },
      {
        id: 'deck-2',
        title: 'Đề số 02: Câu 51 – 100',
        subtitle: 'Phần 1 (File P1 105.docx) • 50 câu giữa',
        badge: 'Đề 02',
        start: 51,
        end: 100,
        accent: 'indigo',
      },
      {
        id: 'deck-3',
        title: 'Đề số 03: Câu 101 – 146',
        subtitle: 'Phần 1 (File P1 105.docx) • 46 câu cuối P1',
        badge: 'Đề 03',
        start: 101,
        end: 146,
        accent: 'indigo',
      },
      {
        id: 'deck-4',
        title: 'Đề số 04: Câu 147 – 196',
        subtitle: 'Phần 2 (File ĐA p2 105.docx) • 50 câu đầu P2',
        badge: 'Đề 04',
        start: 147,
        end: 196,
        accent: 'violet',
      },
      {
        id: 'deck-5',
        title: 'Đề số 05: Câu 197 – 246',
        subtitle: 'Phần 2 (File ĐA p2 105.docx) • 50 câu giữa P2',
        badge: 'Đề 05',
        start: 197,
        end: 246,
        accent: 'violet',
      },
      {
        id: 'deck-6',
        title: 'Đề số 06: Câu 247 – 294',
        subtitle: 'Phần 2 (File ĐA p2 105.docx) • 48 câu cuối P2',
        badge: 'Đề 06',
        start: 247,
        end: 294,
        accent: 'violet',
      },
    ];

    return ranges.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      badge: r.badge,
      accent: r.accent,
      questionIds: dataset.questions
        .filter((q) => q.id >= r.start && q.id <= r.end)
        .map((q) => q.id),
    }));
  }, []);

  // Build 10 Topic Decks (~30 questions each)
  const decksByTopic: DeckDefinition[] = useMemo(() => {
    return dataset.meta.topics.map((t) => ({
      id: `topic-${t.id}`,
      title: t.shortName,
      subtitle: `${t.name}`,
      badge: `Bài ${t.id}`,
      accent: t.id <= 5 ? 'indigo' : 'violet',
      questionIds: dataset.questions.filter((q) => q.topicId === t.id).map((q) => q.id),
    }));
  }, []);

  // Special Full & Random Decks
  const specialDecks: DeckDefinition[] = useMemo(() => {
    return [
      {
        id: 'random-40',
        title: 'Đề Thi Thử Ngẫu Nhiên (40 Câu)',
        subtitle: 'Bốc ngẫu nhiên 40 câu từ toàn bộ 294 câu (P1 + P2)',
        badge: 'Thi chuẩn',
        accent: 'emerald',
        questionIds: dataset.questions.map((q) => q.id),
        isRandom40: true,
      },
      {
        id: 'full-p1',
        title: 'Trọn Bộ Phần 1 (146 Câu)',
        subtitle: 'Toàn bộ câu hỏi trong file P1 105.docx (Câu 1 – 146)',
        badge: 'Full P1',
        accent: 'sky',
        questionIds: dataset.questions.filter((q) => q.part === 'P1').map((q) => q.id),
      },
      {
        id: 'full-p2',
        title: 'Trọn Bộ Phần 2 (148 Câu)',
        subtitle: 'Toàn bộ câu hỏi trong file ĐA p2 105.docx (Câu 147 – 294)',
        badge: 'Full P2',
        accent: 'violet',
        questionIds: dataset.questions.filter((q) => q.part === 'P2').map((q) => q.id),
      },
      {
        id: 'duplicates-178',
        title: 'Đề 178 Câu Có Câu Hỏi Trùng Nhau',
        subtitle: 'Chuyên luyện phân biệt các câu có cùng câu dẫn nhưng khác đáp án',
        badge: 'Mẹo thi',
        accent: 'amber',
        questionIds: dataset.questions
          .filter((q) => q.duplicateGroupId !== null)
          .map((q) => q.id),
      },
    ];
  }, []);

  // If user is currently inside a deck, render the Azota-style PaperExamView
  if (activeDeck) {
    return (
      <PaperExamView
        deck={activeDeck.deck}
        allQuestions={dataset.questions}
        initialMode={activeDeck.mode}
        initialShuffleQuestions={activeDeck.shuffleQ}
        initialShuffleOptions={activeDeck.shuffleOpt}
        onBack={() => setActiveDeck(null)}
        onAttemptQuestion={handleAttemptQuestion}
        onSubmitDeck={handleSubmitDeck}
      />
    );
  }

  const masteredPct = Math.round(
    (progress.masteredIds.length / dataset.questions.length) * 100
  );

  const displayedDecks = deckGroupStyle === '50' ? decksBy50 : decksByTopic;

  const renderDeckCard = (deck: DeckDefinition) => {
    const totalCount = deck.isRandom40 ? 40 : deck.questionIds.length;
    const masteredCount = deck.questionIds.filter((id) => masteredSet.has(id)).length;
    const pct =
      deck.questionIds.length > 0
        ? Math.round((masteredCount / deck.questionIds.length) * 100)
        : 0;
    const stat = progress.deckStats[deck.id];

    const badgeColors: Record<DeckDefinition['accent'], string> = {
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      violet: 'bg-violet-50 text-violet-700 border-violet-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-50 text-amber-800 border-amber-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      sky: 'bg-sky-50 text-sky-700 border-sky-200',
    };

    return (
      <div
        key={deck.id}
        className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-4 animate-card"
      >
        <div>
          {/* Top Row: Badge + Best Score */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              className={`px-2.5 py-1 rounded-xl border text-xs font-extrabold ${
                badgeColors[deck.accent]
              }`}
            >
              {deck.badge} • {totalCount} câu
            </span>

            {stat ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Cao nhất: {stat.bestScore.toFixed(1)}đ ({stat.attempts} lần)
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">Chưa làm lần nào</span>
            )}
          </div>

          {/* Title & Subtitle */}
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
            {deck.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{deck.subtitle}</p>

          {/* Mastery Progress Bar */}
          {!deck.isRandom40 && (
            <div className="mt-3.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>
                  Đã thuộc {masteredCount}/{deck.questionIds.length} câu
                </span>
                <span className="text-indigo-600">{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 2 Direct Action Buttons (Practice vs Exam) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              setActiveDeck({
                deck,
                mode: 'practice',
                shuffleQ: Boolean(deck.isRandom40),
                shuffleOpt: false,
              })
            }
            className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Ôn (Hiện ĐA ngay)
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveDeck({
                deck,
                mode: 'exam',
                shuffleQ: true,
                shuffleOpt: true,
              })
            }
            className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs font-extrabold shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Award className="w-3.5 h-3.5" />
            Thi chấm điểm
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 text-slate-900 pb-20 md:pb-10">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Ôn Thi GDQP-AN
              </h1>
              <p className="text-[11px] font-semibold text-slate-400">
                294 Câu Chuẩn File Word (P1 + P2)
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setHomeTab('decks')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
                homeTab === 'decks' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Danh sách Bộ đề
            </button>
            <button
              type="button"
              onClick={() => setHomeTab('duplicates')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                homeTab === 'duplicates'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <span>62 Cụm câu trùng & Câu sai</span>
              {progress.activeWrongIds.length > 0 && (
                <span className="px-1.5 rounded-full bg-rose-500 text-white text-[10px]">
                  {progress.activeWrongIds.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setHomeTab('search')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
                homeTab === 'search' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Tra cứu & Đọc lướt
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
              Thuộc {progress.masteredIds.length}/294 ({masteredPct}%)
            </span>
            {(progress.masteredIds.length > 0 || progress.activeWrongIds.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Đặt lại toàn bộ điểm số và tiến độ học về 0?')) {
                    setProgress(resetAllProgress());
                  }
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Xóa tiến độ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6">
        {homeTab === 'decks' && (
          <div className="space-y-6">
            {/* Banner for Active Wrong Questions (if user has wrong questions, let them practice those with 1 click!) */}
            {progress.activeWrongIds.length > 0 && (
              <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-3xl p-4 sm:p-5 text-white shadow-md shadow-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-card">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black">
                      Bạn đang có {progress.activeWrongIds.length} câu làm sai cần ôn lại!
                    </h2>
                    <p className="text-xs text-rose-100">
                      Làm lại riêng những câu vừa sai cho đến khi đúng 100% để nhớ lâu nhất.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDeck({
                        deck: {
                          id: 'wrong-deck',
                          title: `Đề Ôn Lại ${progress.activeWrongIds.length} Câu Đang Sai`,
                          subtitle: 'Các câu bạn đã chọn sai trong những lần làm trước',
                          badge: 'Câu sai',
                          accent: 'rose',
                          questionIds: progress.activeWrongIds,
                        },
                        mode: 'practice',
                        shuffleQ: true,
                        shuffleOpt: true,
                      })
                    }
                    className="px-4 py-2.5 rounded-2xl bg-white text-rose-600 text-xs sm:text-sm font-black shadow-xs active:scale-95 transition"
                  >
                    Làm lại {progress.activeWrongIds.length} câu sai ngay →
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: 6 Đề Chia Nhỏ (50 câu/đề) hoặc 10 Chuyên đề */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Bộ Đề Ôn Tập Theo Chặng
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mỗi đề chia nhỏ để bạn làm đi làm lại vài lần là thuộc hết.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setDeckGroupStyle('50')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                      deckGroupStyle === '50'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Chia 6 Đề (50 câu/đề)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeckGroupStyle('topic')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                      deckGroupStyle === 'topic'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Chia 10 Bài (~30 câu/bài)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedDecks.map(renderDeckCard)}
              </div>
            </div>

            {/* Section 2: Đề Thi Thử & Đề Tổng Hợp */}
            <div className="space-y-3.5 pt-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Đề Thi Thử & Đề Tổng Hợp
                </h2>
                <p className="text-xs text-slate-500">
                  Thi thử 40 câu ngẫu nhiên hoặc làm trọn bộ Phần 1, Phần 2.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialDecks.map(renderDeckCard)}
              </div>
            </div>
          </div>
        )}

        {homeTab === 'duplicates' && (
          <SmartReviewView
            questions={dataset.questions}
            progress={progress}
            onRemoveWrong={handleRemoveWrong}
            onStartPracticeScope={(scope) => {
              const qIds =
                scope === 'wrong'
                  ? progress.activeWrongIds
                  : dataset.questions
                      .filter((q) => q.duplicateGroupId !== null)
                      .map((q) => q.id);
              if (qIds.length > 0) {
                setActiveDeck({
                  deck: {
                    id: scope,
                    title:
                      scope === 'wrong'
                        ? `Đề Ôn Lại ${qIds.length} Câu Đang Sai`
                        : 'Đề 178 Câu Có Câu Hỏi Trùng Nhau',
                    subtitle: '',
                    badge: 'Luyện riêng',
                    accent: 'amber',
                    questionIds: qIds,
                  },
                  mode: 'practice',
                  shuffleQ: true,
                  shuffleOpt: true,
                });
              }
            }}
          />
        )}

        {homeTab === 'search' && <SearchView questions={dataset.questions} />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setHomeTab('decks')}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 ${
              homeTab === 'decks' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px]">Danh sách Đề</span>
          </button>

          <button
            type="button"
            onClick={() => setHomeTab('duplicates')}
            className={`relative py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 ${
              homeTab === 'duplicates'
                ? 'text-indigo-600 font-extrabold'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[11px]">Câu trùng & Sai</span>
            {progress.activeWrongIds.length > 0 && (
              <span className="absolute top-0.5 right-5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {progress.activeWrongIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setHomeTab('search')}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 ${
              homeTab === 'search' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[11px]">Đọc lướt & Tìm</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
