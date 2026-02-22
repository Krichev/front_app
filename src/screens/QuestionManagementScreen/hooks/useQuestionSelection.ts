import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { QuizQuestion } from '../../../entities/QuizState/model/slice/quizApi';
import { MAX_SELECTION_COUNT } from '../lib/questionManagement.types';
import { APIDifficulty } from '../../../services/wwwGame/questionService';

export const useQuestionSelection = (
    questions: QuizQuestion[],
    setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>
) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const toggleSelection = useCallback((question: QuizQuestion) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(question.id)) {
                next.delete(question.id);
            } else {
                if (next.size >= MAX_SELECTION_COUNT) {
                    Alert.alert('Selection Limit', `You can select up to ${MAX_SELECTION_COUNT} questions.`);
                    return prev;
                }
                next.add(question.id);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((questionId: number) => {
        return selectedIds.has(questionId);
    }, [selectedIds]);

    const selectedQuestionsArray = useMemo(() => {
        return questions.filter(q => selectedIds.has(q.id));
    }, [questions, selectedIds]);

    const updateQuestionDifficulty = useCallback((questionId: number, newDifficulty: APIDifficulty) => {
        setQuestions(prev => prev.map(q => 
            q.id === questionId ? { ...q, difficulty: newDifficulty } : q
        ));
    }, [setQuestions]);

    return {
        selectedIds,
        selectedQuestionsArray,
        toggleSelection,
        clearSelection,
        isSelected,
        selectedCount: selectedIds.size,
        updateQuestionDifficulty,
    };
};
