// src/entities/question/lib/difficultyClassifier.ts
import {QuestionDifficulty} from '../model/types';

export const classifyQuestionDifficulty = async (
    question: string,
    answer: string
): Promise<QuestionDifficulty> => {
    // Try to use external AI service if available
    try {
        // Check if DeepSeek service is available
        if (typeof window !== 'undefined' && (window as any).DeepSeekHostService) {
            const service = (window as any).DeepSeekHostService;
            if (typeof service.classifyQuestionDifficulty === 'function') {
                return await service.classifyQuestionDifficulty(question, answer);
            }
        }
    } catch (error) {
        console.log('External AI service not available, using fallback classification');
    }

    // Fallback: Simple heuristic-based classification
    return classifyByHeuristics(question, answer);
};

const classifyByHeuristics = (question: string, answer: string): QuestionDifficulty => {
    const totalLength = question.length + answer.length;
    const wordCount = question.split(' ').length + answer.split(' ').length;

    // Check for complexity indicators
    const complexityIndicators = [
        'derivative', 'integral', 'quantum', 'molecular', 'philosophical',
        'theoretical', 'hypothesis', 'paradigm', 'methodology', 'phenomenon',
        'algorithm', 'theorem', 'axiom', 'coefficient', 'variable',
    ];

    const easyIndicators = [
        'what', 'who', 'where', 'when', 'color', 'name', 'capital',
        'largest', 'smallest', 'first', 'last', 'how many',
    ];

    const questionLower = question.toLowerCase();
    const answerLower = answer.toLowerCase();

    // Check for easy indicators
    if (easyIndicators.some(indicator => questionLower.includes(indicator))) {
        if (answer.length <= 15 && wordCount < 20) {
            return 'Easy';
        }
    }

    // Check for complex indicators
    if (complexityIndicators.some(indicator =>
        questionLower.includes(indicator) || answerLower.includes(indicator)
    )) {
        return 'Hard';
    }

    // Length-based classification
    if (answer.length <= 15 && wordCount < 30) {
        return 'Easy';
    } else if (totalLength > 500 || wordCount > 60) {
        return 'Hard';
    } else {
        return 'Medium';
    }
};

export const calculateAnswerSimilarity = (answer1: string, answer2: string): number => {
    if (answer1 === answer2) return 1;

    const distance = levenshteinDistance(answer1, answer2);
    const maxLength = Math.max(answer1.length, answer2.length);

    if (maxLength === 0) return 0;

    return 1 - distance / maxLength;
};

export const extractPotentialAnswers = (text: string): string[] => {
    const patterns = [
        /(?:answer is|it's|it is)\s+([^.!?]+)/gi,
        /(?:maybe|perhaps|could be)\s+([^.!?]+)/gi,
        /(?:i think|i believe)\s+(?:it's|it is)?\s*([^.!?]+)/gi,
    ];

    const answers: string[] = [];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const answer = match[1].trim();
            if (answer.length > 2 && answer.length < 100) {
                answers.push(answer);
            }
        }
    });

    return [...new Set(answers)]; // Remove duplicates
};

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
};