// src/features/www-game-discussion/lib/hooks.ts
import {useCallback, useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {wwwDiscussionActions} from '../model/slice';
import {DeepSeekHostService} from './deepseekService';
import type {RootState} from '../../../app/store';
import type {DiscussionPhase, DiscussionQuestion} from '../model/types';

export const useWWWDiscussion = (question?: DiscussionQuestion) => {
    const dispatch = useDispatch();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Selectors
    const discussion = useSelector((state: RootState) => state.wwwDiscussion.discussion);
    const aiHost = useSelector((state: RootState) => state.wwwDiscussion.aiHost);
    const questionHistory = useSelector((state: RootState) => state.wwwDiscussion.questionHistory);

    // Timer effect
    useEffect(() => {
        if (discussion.isActive && discussion.timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                dispatch(wwwDiscussionActions.updateTimer(discussion.timeRemaining - 1));
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [discussion.isActive, discussion.timeRemaining, dispatch]);

    // Start discussion
    const startDiscussion = useCallback((timeLimit: number = 60, teamMembers: string[] = []) => {
        dispatch(wwwDiscussionActions.startDiscussion({ timeLimit, teamMembers }));
    }, [dispatch]);

    // Pause/Resume
    const pauseDiscussion = useCallback(() => {
        dispatch(wwwDiscussionActions.pauseDiscussion());
    }, [dispatch]);

    const resumeDiscussion = useCallback(() => {
        dispatch(wwwDiscussionActions.resumeDiscussion());
    }, [dispatch]);

    // Update notes
    const updateNotes = useCallback((notes: string) => {
        dispatch(wwwDiscussionActions.updateNotes(notes));
    }, [dispatch]);

    const appendToNotes = useCallback((text: string) => {
        dispatch(wwwDiscussionActions.appendToNotes(text));
    }, [dispatch]);

    // Audio transcript
    const appendToTranscript = useCallback((speaker: string | undefined, text: string) => {
        dispatch(wwwDiscussionActions.appendToTranscript({ speaker, text }));
    }, [dispatch]);

    const setCurrentSpeaker = useCallback((speaker: string | null) => {
        dispatch(wwwDiscussionActions.setCurrentSpeaker(speaker));
    }, [dispatch]);

    // Analysis
    const analyzeDiscussion = useCallback(async () => {
        if (!question) {
            console.warn('No question provided for analysis');
            return;
        }

        try {
            dispatch(wwwDiscussionActions.setPhase('analysis'));

            const result = await DeepSeekHostService.analyzeDiscussion(
                question.question,
                question.answer,
                discussion.notes,
                discussion.audioTranscript
            );

            dispatch(wwwDiscussionActions.setAnalysisResult(result));
        } catch (error) {
            console.error('Analysis failed:', error);
            // Could dispatch an error action here
        }
    }, [question, discussion.notes, discussion.audioTranscript, dispatch]);

    // Complete discussion
    const completeDiscussion = useCallback((finalAnswer: string, wasCorrect: boolean) => {
        if (question) {
            dispatch(wwwDiscussionActions.addToHistory({
                questionId: question.id,
                finalAnswer,
                wasCorrect,
            }));
        }
        dispatch(wwwDiscussionActions.completeDiscussion());
    }, [question, dispatch]);

    // Reset
    const resetDiscussion = useCallback(() => {
        dispatch(wwwDiscussionActions.reset());
    }, [dispatch]);

    // AI Host configuration
    const updateAIHostConfig = useCallback((config: Partial<typeof aiHost>) => {
        dispatch(wwwDiscussionActions.updateAIHostConfig(config));
    }, [dispatch]);

    // Phase management
    const setPhase = useCallback((phase: DiscussionPhase) => {
        dispatch(wwwDiscussionActions.setPhase(phase));
    }, [dispatch]);

    return {
        // State
        discussion,
        aiHost,
        questionHistory,
        question,

        // Computed
        isActive: discussion.isActive,
        timeRemaining: discussion.timeRemaining,
        progress: discussion.totalTime > 0 ? ((discussion.totalTime - discussion.timeRemaining) / discussion.totalTime) * 100 : 0,
        hasNotes: discussion.notes.length > 0,
        hasTranscript: discussion.audioTranscript.length > 0,
        hasAnalysis: discussion.analysisResult !== null,

        // Actions
        startDiscussion,
        pauseDiscussion,
        resumeDiscussion,
        updateNotes,
        appendToNotes,
        appendToTranscript,
        setCurrentSpeaker,
        analyzeDiscussion,
        completeDiscussion,
        resetDiscussion,
        updateAIHostConfig,
        setPhase,

        // Utils
        formatTime: (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
    };
};