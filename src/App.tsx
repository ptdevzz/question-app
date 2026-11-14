import React, { useState, useMemo, useCallback } from 'react';
import {
  Zap,
  Award,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Layers,
  BookOpen,
  Trophy,
  FileText,
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
  removeActiveWrong,
} from './utils/storage';
import { PaperExamView } from './components/PaperExamView';
import { SearchView } from './components/SearchView';
import { SmartReviewView } from './components/SmartReviewView';

const dataset = rawData as unknown as QuestionDataset;

export function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeDeck, setActiveDeck] = useState<{
    deck: DeckDefinition;
    mode: 'practice' | 'exam';
    shuffleQ: boolean;
    shuffleOpt: boolean;
  } | null>(null);

  const [homeTab, setHomeTab] = useState<'decks' | 'full' | 'duplicates'>('decks');
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
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-3.5 animate-card"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 rounded-xl border text-xs font-extrabold whitespace-nowrap ${
                badgeColors[deck.accent]
              }`}
            >
              {deck.badge} • {totalCount} câu
            </span>

            {stat ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold whitespace-nowrap">
                <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                {stat.bestScore.toFixed(1)}đ ({stat.attempts} lần)
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                Chưa làm
              </span>
            )}
          </div>

          <h3 className="text-[15px] sm:text-lg font-extrabold text-slate-900 leading-snug">
            {deck.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{deck.subtitle}</p>

          {!deck.isRandom40 && (
            <div className="mt-3">
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
            className="py-2.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center justify-center gap-1 whitespace-nowrap active:scale-95 transition"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Ôn (Hiện ĐA)</span>
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
            className="py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white text-xs font-extrabold shadow-xs flex items-center justify-center gap-1 whitespace-nowrap active:scale-95 transition"
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>Thi chấm điểm</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 text-slate-900 pb-20 md:pb-10">
      {/* Top Header with "Mie Miee" Brand & Logo */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Logo: Mie Miee */}
          <div
            onClick={() => setHomeTab('decks')}
            className="flex items-center gap-2.5 cursor-pointer select-none min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0 relative">
              <span className="font-black text-base sm:text-lg tracking-tighter leading-none">
                M
              </span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-300 border-2 border-white flex items-center justify-center text-[8px]">
                ✦
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight truncate">
                Mie Miee
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 truncate">
                Ôn Thi 294 Câu GDQP
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
              Bộ đề ôn thi
            </button>
            <button
              type="button"
              onClick={() => setHomeTab('full')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
                homeTab === 'full' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Full 294 câu (Có ĐA)
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
              <span>Câu trùng & Câu sai</span>
              {progress.activeWrongIds.length > 0 && (
                <span className="px-1.5 rounded-full bg-rose-500 text-white text-[10px]">
                  {progress.activeWrongIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Mastery Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold whitespace-nowrap">
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

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-3 sm:px-6 pt-3.5 sm:pt-6">
        {homeTab === 'decks' && (
          <div className="space-y-5">
            {progress.activeWrongIds.length > 0 && (
              <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-2xl sm:rounded-3xl p-4 text-white shadow-md shadow-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black">
                      Đang có {progress.activeWrongIds.length} câu làm sai cần ôn lại!
                    </h2>
                    <p className="text-xs text-rose-100">
                      Làm lại riêng những câu vừa sai cho đến khi đúng 100%.
                    </p>
                  </div>
                </div>

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
                  className="px-4 py-2.5 rounded-xl bg-white text-rose-600 text-xs sm:text-sm font-black shadow-xs whitespace-nowrap active:scale-95 transition"
                >
                  Làm lại {progress.activeWrongIds.length} câu sai →
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span>Bộ Đề Ôn Tập Theo Chặng</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeckGroupStyle('50')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                      deckGroupStyle === '50'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    6 Đề (50 câu/đề)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeckGroupStyle('topic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                      deckGroupStyle === 'topic'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    10 Bài (~30 câu/bài)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedDecks.map(renderDeckCard)}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Đề Thi Thử & Đề Tổng Hợp</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {specialDecks.map(renderDeckCard)}
              </div>
            </div>
          </div>
        )}

        {homeTab === 'full' && <SearchView questions={dataset.questions} />}

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
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setHomeTab('decks')}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 whitespace-nowrap ${
              homeTab === 'decks' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px]">Bộ đề ôn thi</span>
          </button>

          <button
            type="button"
            onClick={() => setHomeTab('full')}
            className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 whitespace-nowrap ${
              homeTab === 'full' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 font-semibold'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">Full 294 câu</span>
          </button>

          <button
            type="button"
            onClick={() => setHomeTab('duplicates')}
            className={`relative py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 whitespace-nowrap ${
              homeTab === 'duplicates'
                ? 'text-indigo-600 font-extrabold'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[11px]">Câu trùng & Sai</span>
            {progress.activeWrongIds.length > 0 && (
              <span className="absolute top-0.5 right-4 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {progress.activeWrongIds.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
