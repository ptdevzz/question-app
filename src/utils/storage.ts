import { UserProgress, ExamRecord } from '../types';

const STORAGE_KEY = 'gdqp_study_progress_v2';

const defaultProgress: UserProgress = {
  masteredIds: [],
  wrongCounts: {},
  activeWrongIds: [],
  starredIds: [],
  deckStats: {},
  examHistory: [],
};

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    return {
      masteredIds: Array.isArray(parsed.masteredIds) ? parsed.masteredIds : [],
      wrongCounts: parsed.wrongCounts && typeof parsed.wrongCounts === 'object' ? parsed.wrongCounts : {},
      activeWrongIds: Array.isArray(parsed.activeWrongIds) ? parsed.activeWrongIds : [],
      starredIds: Array.isArray(parsed.starredIds) ? parsed.starredIds : [],
      deckStats: parsed.deckStats && typeof parsed.deckStats === 'object' ? parsed.deckStats : {},
      examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

export function recordQuestionAttempt(
  prev: UserProgress,
  questionId: number,
  isCorrect: boolean
): UserProgress {
  const masteredSet = new Set(prev.masteredIds);
  const activeWrongSet = new Set(prev.activeWrongIds);
  const wrongCounts = { ...prev.wrongCounts };

  if (isCorrect) {
    masteredSet.add(questionId);
    activeWrongSet.delete(questionId);
  } else {
    masteredSet.delete(questionId);
    activeWrongSet.add(questionId);
    wrongCounts[questionId] = (wrongCounts[questionId] || 0) + 1;
  }

  const next: UserProgress = {
    ...prev,
    masteredIds: Array.from(masteredSet),
    wrongCounts,
    activeWrongIds: Array.from(activeWrongSet),
  };
  saveProgress(next);
  return next;
}

export function recordDeckSubmission(
  prev: UserProgress,
  deckId: string,
  record: ExamRecord,
  correctIds: number[],
  wrongIds: number[]
): UserProgress {
  const masteredSet = new Set(prev.masteredIds);
  const activeWrongSet = new Set(prev.activeWrongIds);
  const wrongCounts = { ...prev.wrongCounts };

  for (const id of correctIds) {
    masteredSet.add(id);
    activeWrongSet.delete(id);
  }
  for (const id of wrongIds) {
    masteredSet.delete(id);
    activeWrongSet.add(id);
    wrongCounts[id] = (wrongCounts[id] || 0) + 1;
  }

  const prevDeck = prev.deckStats[deckId];
  const nextDeckStats = {
    ...prev.deckStats,
    [deckId]: {
      bestScore: prevDeck ? Math.max(prevDeck.bestScore, record.score) : record.score,
      lastScore: record.score,
      attempts: (prevDeck?.attempts || 0) + 1,
      lastUpdated: record.date,
    },
  };

  const next: UserProgress = {
    ...prev,
    masteredIds: Array.from(masteredSet),
    wrongCounts,
    activeWrongIds: Array.from(activeWrongSet),
    deckStats: nextDeckStats,
    examHistory: [record, ...prev.examHistory].slice(0, 30),
  };
  saveProgress(next);
  return next;
}

export function removeActiveWrong(prev: UserProgress, questionId: number): UserProgress {
  const next: UserProgress = {
    ...prev,
    activeWrongIds: prev.activeWrongIds.filter((id) => id !== questionId),
    masteredIds: Array.from(new Set([...prev.masteredIds, questionId])),
  };
  saveProgress(next);
  return next;
}

export function resetAllProgress(): UserProgress {
  saveProgress(defaultProgress);
  return defaultProgress;
}
