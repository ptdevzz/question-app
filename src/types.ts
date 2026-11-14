export interface Topic {
  id: number;
  range: [number, number];
  shortName: string;
  name: string;
}

export interface PartInfo {
  id: 'P1' | 'P2';
  name: string;
  range: [number, number];
  count: number;
}

export interface Question {
  id: number;
  part: 'P1' | 'P2';
  origNum: number;
  topicId: number;
  topicShortName: string;
  topicName: string;
  question: string;
  options: string[];
  correctIndex: number;
  duplicateGroupId: number | null;
  siblingIds: number[];
}

export interface QuestionDataset {
  meta: {
    title: string;
    totalQuestions: number;
    parts: PartInfo[];
    topics: Topic[];
  };
  questions: Question[];
}

export interface DeckStats {
  bestScore: number;
  lastScore: number;
  attempts: number;
  lastUpdated: string;
}

export interface ExamRecord {
  id: string;
  deckId?: string;
  date: string;
  scopeLabel: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  durationSeconds: number;
  wrongQuestionIds: number[];
}

export interface UserProgress {
  masteredIds: number[];
  wrongCounts: Record<number, number>;
  activeWrongIds: number[];
  starredIds: number[];
  deckStats: Record<string, DeckStats>;
  examHistory: ExamRecord[];
}

export interface DeckDefinition {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  accent: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky';
  questionIds: number[];
  isRandom40?: boolean;
}
