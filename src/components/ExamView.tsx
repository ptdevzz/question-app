import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RotateCcw,
} from 'lucide-react';
import { Question, UserProgress, ExamRecord } from '../types';
import { shuffleArray, formatTime } from '../utils/text';

interface ExamViewProps {
  questions: Question[];
  progress: UserProgress;
  onSubmitExam: (
    record: ExamRecord,
    correctIds: number[],
    wrongIds: number[]
  ) => void;
}

interface ExamQuestionItem {
  question: Question;
  options: { text: string; originalIndex: number }[];
}

export const ExamView: React.FC<ExamViewProps> = ({
  questions,
  onSubmitExam,
}) => {
  const [scope, setScope] = useState<'all' | 'P1' | 'P2'>('all');
  const [questionCount, setQuestionCount] = useState<number>(40);
  const [examStatus, setExamStatus] = useState<'setup' | 'running' | 'submitted'>('setup');
  const [examItems, setExamItems] = useState<ExamQuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const pool = useMemo(() => {
    if (scope === 'P1') return questions.filter((q) => q.part === 'P1');
    if (scope === 'P2') return questions.filter((q) => q.part === 'P2');
    return questions;
  }, [questions, scope]);

  const startExam = (sourceQuestions: Question[], count: number) => {
    const shuffled = shuffleArray(sourceQuestions).slice(
      0,
      count === 0 ? sourceQuestions.length : Math.min(count, sourceQuestions.length)
    );
    const items = shuffled.map((q) => ({
      question: q,
      options: shuffleArray(q.options.map((text, idx) => ({ text, originalIndex: idx }))),
    }));
    setExamItems(items);
    setAnswers({});
    setElapsedSeconds(0);
    setExamStatus('running');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (examStatus !== 'running') return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [examStatus]);

  const handleSubmit = () => {
    const correctIds: number[] = [];
    const wrongIds: number[] = [];
    for (const item of examItems) {
      if (answers[item.question.id] === item.question.correctIndex) {
        correctIds.push(item.question.id);
      } else {
        wrongIds.push(item.question.id);
      }
    }
    const score =
      examItems.length > 0
        ? Math.round((correctIds.length / examItems.length) * 1000) / 100
        : 0;
    onSubmitExam(
      {
        id: `${Date.now()}`,
        date: new Date().toLocaleString('vi-VN'),
        scopeLabel: scope === 'all' ? 'Tổng hợp' : scope,
        totalQuestions: examItems.length,
        correctCount: correctIds.length,
        score,
        durationSeconds: elapsedSeconds,
        wrongQuestionIds: wrongIds,
      },
      correctIds,
      wrongIds
    );
    setExamStatus('submitted');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (examStatus === 'setup') {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 animate-card">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Thi Thử Kiểm Tra Trí Nhớ</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đề ngẫu nhiên, đảo thứ tự đáp án. Câu nào làm sai sẽ tự động lưu vào mục "Câu Đang Sai".
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">Chọn phần thi</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'Cả 2 phần (294)' },
              { id: 'P1', label: 'Phần 1 (146)' },
              { id: 'P2', label: 'Phần 2 (148)' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id as 'all' | 'P1' | 'P2')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  scope === s.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">Số lượng câu</label>
          <div className="grid grid-cols-4 gap-2">
            {[20, 40, 60, 0].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuestionCount(n)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                  questionCount === n
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {n === 0 ? 'Tất cả' : `${n} câu`}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => startExam(pool, questionCount)}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition"
        >
          <Play className="w-4 h-4 fill-current" />
          Bắt đầu làm đề ({questionCount === 0 ? pool.length : questionCount} câu)
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const correctCount = examItems.filter(
    (i) => answers[i.question.id] === i.question.correctIndex
  ).length;
  const wrongItems = examItems.filter(
    (i) => answers[i.question.id] !== i.question.correctIndex
  );

  return (
    <div className="max-w-2xl mx-auto space-y-3.5 pb-20">
      {/* Sticky Top Bar */}
      <div className="sticky top-[54px] z-20 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-sm px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-xs font-bold text-slate-600">
            Đã chọn:{' '}
            <strong className="text-blue-600">
              {answeredCount}/{examItems.length}
            </strong>
          </span>
        </div>

        {examStatus === 'running' ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Chấm điểm
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setExamStatus('setup')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-extrabold active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đề khác
          </button>
        )}
      </div>

      {/* Result Banner */}
      {examStatus === 'submitted' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 animate-card">
          <div>
            <div className="text-xl font-black text-blue-600">
              {((correctCount / examItems.length) * 10).toFixed(2)} / 10 điểm
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Đúng {correctCount}/{examItems.length} câu • Sai {wrongItems.length} câu
            </div>
          </div>

          {wrongItems.length > 0 && (
            <button
              type="button"
              onClick={() =>
                startExam(
                  wrongItems.map((i) => i.question),
                  wrongItems.length
                )
              }
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold active:scale-95"
            >
              Làm lại {wrongItems.length} câu vừa sai
            </button>
          )}
        </div>
      )}

      {/* Question List */}
      <div className="space-y-3">
        {examItems.map((item, idx) => {
          const q = item.question;
          const chosen = answers[q.id];
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Câu {idx + 1} (#{q.id})
                </span>
                {examStatus === 'submitted' &&
                  (chosen === q.correctIndex ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đúng
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Sai
                    </span>
                  ))}
              </div>

              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                {q.question}
              </h3>

              <div className="space-y-2">
                {item.options.map((opt, vIdx) => {
                  const letter = String.fromCharCode(65 + vIdx);
                  const isSelected = chosen === opt.originalIndex;
                  const isCorrect = opt.originalIndex === q.correctIndex;

                  let style = 'border-slate-200 bg-slate-50/50 text-slate-800';
                  if (examStatus === 'running') {
                    if (isSelected) style = 'border-blue-600 bg-blue-50 text-blue-950 font-bold';
                  } else {
                    if (isCorrect)
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    else if (isSelected)
                      style = 'border-rose-500 bg-rose-50 text-rose-950';
                    else style = 'border-slate-100 text-slate-400 opacity-55';
                  }

                  return (
                    <button
                      key={opt.originalIndex}
                      type="button"
                      disabled={examStatus === 'submitted'}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt.originalIndex }))
                      }
                      className={`w-full text-left p-3 rounded-xl border-2 text-xs sm:text-sm flex items-start gap-2.5 transition ${style}`}
                    >
                      <span className="font-extrabold shrink-0">{letter}.</span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
