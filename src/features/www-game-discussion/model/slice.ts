// src/features/www-game-discussion/model/Slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AIHostConfig, DiscussionAnalysisResult, DiscussionPhase, DiscussionState} from './types';

interface WWWDiscussionState {
    discussion: DiscussionState;
    aiHost: AIHostConfig;
    questionHistory: Array<{
        questionId: string;
        discussionNotes: string;
        analysisResult: DiscussionAnalysisResult | null;
        finalAnswer: string;
        wasCorrect: boolean;
        timestamp: number;
    }>;
}

const initialState: WWWDiscussionState = {
    discussion: {
        phase: 'preparation',
        timeRemaining: 60,
        totalTime: 60,
        isActive: false,
        notes: '',
        audioTranscript: '',
        analysisResult: null,
        teamMembers: [],
        currentSpeaker: null,
    },
    aiHost: {
        enabled: true,
        language: 'en-US',
        personality: 'encouraging',
        analysisDepth: 'detailed',
        realTimeHints: true,
        postDiscussionAnalysis: true,
    },
    questionHistory: [],
};

export const wwwDiscussionSlice = createSlice({
    name: 'wwwDiscussion',
    initialState,
    reducers: {
        setPhase: (state, action: PayloadAction<DiscussionPhase>) => {
            state.discussion.phase = action.payload;
        },
        startDiscussion: (state, action: PayloadAction<{ timeLimit: number; teamMembers: string[] }>) => {
            state.discussion.phase = 'discussion';
            state.discussion.timeRemaining = action.payload.timeLimit;
            state.discussion.totalTime = action.payload.timeLimit;
            state.discussion.teamMembers = action.payload.teamMembers;
            state.discussion.isActive = true;
            state.discussion.notes = '';
            state.discussion.audioTranscript = '';
            state.discussion.analysisResult = null;
        },
        updateTimer: (state, action: PayloadAction<number>) => {
            state.discussion.timeRemaining = Math.max(0, action.payload);
            if (state.discussion.timeRemaining === 0 && state.discussion.phase === 'discussion') {
                state.discussion.phase = 'analysis';
                state.discussion.isActive = false;
            }
        },
        pauseDiscussion: (state) => {
            state.discussion.isActive = false;
        },
        resumeDiscussion: (state) => {
            if (state.discussion.timeRemaining > 0) {
                state.discussion.isActive = true;
            }
        },
        updateNotes: (state, action: PayloadAction<string>) => {
            state.discussion.notes = action.payload;
        },
        appendToNotes: (state, action: PayloadAction<string>) => {
            const newText = action.payload;
            if (state.discussion.notes.length > 0) {
                state.discussion.notes += '\n' + newText;
            } else {
                state.discussion.notes = newText;
            }
        },
        updateAudioTranscript: (state, action: PayloadAction<string>) => {
            state.discussion.audioTranscript = action.payload;
        },
        appendToTranscript: (state, action: PayloadAction<{ speaker?: string; text: string }>) => {
            const { speaker, text } = action.payload;
            const prefix = speaker ? `${speaker}: ` : '';
            const newEntry = prefix + text;

            if (state.discussion.audioTranscript.length > 0) {
                state.discussion.audioTranscript += '\n' + newEntry;
            } else {
                state.discussion.audioTranscript = newEntry;
            }
        },
        setCurrentSpeaker: (state, action: PayloadAction<string | null>) => {
            state.discussion.currentSpeaker = action.payload;
        },
        setAnalysisResult: (state, action: PayloadAction<DiscussionAnalysisResult>) => {
            state.discussion.analysisResult = action.payload;
            state.discussion.phase = 'answer';
        },
        updateAIHostConfig: (state, action: PayloadAction<Partial<AIHostConfig>>) => {
            state.aiHost = { ...state.aiHost, ...action.payload };
        },
        addToHistory: (state, action: PayloadAction<{
            questionId: string;
            finalAnswer: string;
            wasCorrect: boolean;
        }>) => {
            state.questionHistory.push({
                questionId: action.payload.questionId,
                discussionNotes: state.discussion.notes,
                analysisResult: state.discussion.analysisResult,
                finalAnswer: action.payload.finalAnswer,
                wasCorrect: action.payload.wasCorrect,
                timestamp: Date.now(),
            });
        },
        completeDiscussion: (state) => {
            state.discussion.phase = 'complete';
            state.discussion.isActive = false;
        },
        reset: (state) => {
            state.discussion = initialState.discussion;
        },
        resetAll: () => initialState,
    },
});

export const wwwDiscussionActions = wwwDiscussionSlice.actions;
