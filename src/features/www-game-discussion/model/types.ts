// src/features/www-game-discussion/model/types.ts
export type DiscussionPhase = 'preparation' | 'discussion' | 'analysis' | 'answer' | 'complete';

export interface DiscussionState {
    phase: DiscussionPhase;
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
    notes: string;
    audioTranscript: string;
    analysisResult: DiscussionAnalysisResult | null;
    teamMembers: string[];
    currentSpeaker: string | null;
}

export interface DiscussionAnalysisResult {
    correctAnswerMentioned: boolean;
    bestGuesses: string[];
    confidence: number;
    analysis: string;
    suggestions: string[];
    keyTopics: string[];
    speakerContributions: Record<string, {
        wordCount: number;
        keyPoints: string[];
        confidence: number;
    }>;
}

export interface AIHostConfig {
    enabled: boolean;
    language: string;
    personality: 'formal' | 'casual' | 'encouraging' | 'challenging';
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    realTimeHints: boolean;
    postDiscussionAnalysis: boolean;
}

export interface DiscussionQuestion {
    id: string;
    question: string;
    answer: string;
    hints: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    timeLimit: number;
}