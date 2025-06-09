// src/entities/question/lib/questionService.ts
import {
    AnswerValidationResult,
    ParsedQuestion,
    QuestionAnalysis,
    QuestionData,
    QuestionDifficulty
} from '../model/types';
import {calculateAnswerSimilarity} from './difficultyClassifier';
import {cleanQuestionText, normalizeAnswer} from './utils';

export class QuestionService {
    /**
     * Parse XML question data into standardized format
     */
    static parseXMLQuestion(q: any, id?: string): ParsedQuestion {
        let questionText = '';
        let answerText = '';
        let sourceText = '';
        let additionalInfo = '';
        let topic = '';

        // Extract question text
        if (q.Question !== undefined) {
            questionText = this.cleanText(String(q.Question));
        } else if (q.question) {
            questionText = this.cleanText(Array.isArray(q.question) ? q.question[0] : String(q.question));
        }

        // Extract answer text
        if (q.Answer !== undefined) {
            answerText = this.cleanText(String(q.Answer));
        } else if (q.answer) {
            answerText = this.cleanText(Array.isArray(q.answer) ? q.answer[0] : String(q.answer));
        }

        // Extract source
        if (q.Sources !== undefined) {
            if (Array.isArray(q.Sources)) {
                for (const sourceItem of q.Sources) {
                    if (typeof sourceItem === 'object' && sourceItem.source) {
                        const source = sourceItem.source;
                        sourceText = this.cleanText(Array.isArray(source) ? source[0] : String(source));
                        break;
                    }
                }
            } else if (typeof q.Sources === 'object' && q.Sources !== null) {
                if (q.Sources.source) {
                    const source = q.Sources.source;
                    sourceText = this.cleanText(Array.isArray(source) ? source[0] : String(source));
                }
            }
        }

        // Extract additional info
        if (q.Comments !== undefined) {
            additionalInfo = this.cleanText(String(q.Comments));
        } else if (q.comments) {
            additionalInfo = this.cleanText(Array.isArray(q.comments) ? q.comments[0] : String(q.comments));
        }

        // Extract topic
        if (q.Topic !== undefined) {
            topic = this.cleanText(String(q.Topic));
        } else if (q.topic) {
            topic = this.cleanText(Array.isArray(q.topic) ? q.topic[0] : String(q.topic));
        }

        return {
            id: id || 'unknown',
            question: questionText,
            answer: answerText,
            source: sourceText,
            additionalInfo: additionalInfo,
            topic: topic,
        };
    }

    /**
     * Fetch questions from external source
     */
    static async fetchQuestionsFromSource(
        source: string,
        count: number = 10,
        difficulty?: QuestionDifficulty
    ): Promise<QuestionData[]> {
        try {
            // This would be implemented based on your specific data sources
            console.log(`Fetching ${count} questions from ${source} with difficulty ${difficulty}`);

            // For now, return fallback questions
            return this.getFallbackQuestions(count, difficulty);
        } catch (error) {
            console.error('Error fetching questions:', error);
            return this.getFallbackQuestions(count, difficulty);
        }
    }

    /**
     * Get fallback questions when API fails
     */
    static getFallbackQuestions(
        count: number = 10,
        difficulty?: QuestionDifficulty
    ): QuestionData[] {
        const fallbackQuestions = {
            Easy: [
                {
                    id: 'e1',
                    question: "Which planet is known as the Red Planet?",
                    answer: "Mars",
                    difficulty: 'Easy' as const,
                    category: 'astronomy',
                    topic: 'planets',
                },
                {
                    id: 'e2',
                    question: "What is the largest mammal in the world?",
                    answer: "Blue whale",
                    difficulty: 'Easy' as const,
                    category: 'biology',
                    topic: 'animals',
                },
                {
                    id: 'e3',
                    question: "What is the capital of France?",
                    answer: "Paris",
                    difficulty: 'Easy' as const,
                    category: 'geography',
                    topic: 'capitals',
                },
            ],
            Medium: [
                {
                    id: 'm1',
                    question: "Who wrote the novel '1984'?",
                    answer: "George Orwell",
                    difficulty: 'Medium' as const,
                    category: 'literature',
                    topic: 'novels',
                },
                {
                    id: 'm2',
                    question: "What is the chemical symbol for gold?",
                    answer: "Au",
                    difficulty: 'Medium' as const,
                    category: 'chemistry',
                    topic: 'elements',
                },
                {
                    id: 'm3',
                    question: "In what year did World War II end?",
                    answer: "1945",
                    difficulty: 'Medium' as const,
                    category: 'history',
                    topic: 'wars',
                },
            ],
            Hard: [
                {
                    id: 'h1',
                    question: "What is the name of the theoretical boundary around a black hole?",
                    answer: "Event horizon",
                    difficulty: 'Hard' as const,
                    category: 'physics',
                    topic: 'black holes',
                },
                {
                    id: 'h2',
                    question: "Who composed 'The Well-Tempered Clavier'?",
                    answer: "Johann Sebastian Bach",
                    difficulty: 'Hard' as const,
                    category: 'music',
                    topic: 'classical',
                },
                {
                    id: 'h3',
                    question: "What is the derivative of sin(x) with respect to x?",
                    answer: "cos(x)",
                    difficulty: 'Hard' as const,
                    category: 'mathematics',
                    topic: 'calculus',
                },
            ],
        };

        let questions: QuestionData[] = [];

        if (difficulty) {
            questions = [...fallbackQuestions[difficulty]];
        } else {
            questions = [
                ...fallbackQuestions.Easy,
                ...fallbackQuestions.Medium,
                ...fallbackQuestions.Hard,
            ];
        }

        // Shuffle and return requested count
        const shuffled = questions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Validate user answer against correct answer
     */
    static validateAnswer(
        userAnswer: string,
        correctAnswer: string,
        strictMode: boolean = false
    ): AnswerValidationResult {
        const normalizedUserAnswer = normalizeAnswer(userAnswer);
        const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);

        if (normalizedUserAnswer === normalizedCorrectAnswer) {
            return {
                isCorrect: true,
                similarity: 1.0,
                normalizedUserAnswer,
                normalizedCorrectAnswer,
                feedback: 'Perfect match!',
            };
        }

        if (strictMode) {
            return {
                isCorrect: false,
                similarity: 0,
                normalizedUserAnswer,
                normalizedCorrectAnswer,
                feedback: 'Exact match required.',
            };
        }

        const similarity = calculateAnswerSimilarity(normalizedUserAnswer, normalizedCorrectAnswer);
        const isCorrect = similarity >= 0.8;

        return {
            isCorrect,
            similarity,
            normalizedUserAnswer,
            normalizedCorrectAnswer,
            feedback: isCorrect
                ? 'Close enough, accepted!'
                : similarity > 0.5
                    ? 'Close, but not quite right.'
                    : 'Incorrect answer.',
        };
    }

    /**
     * Analyze discussion notes for potential answers
     */
    static analyzeDiscussionNotes(
        notes: string,
        correctAnswer: string
    ): QuestionAnalysis {
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const potentialAnswers: string[] = [];
        const lowercaseNotes = notes.toLowerCase();
        const lowercaseAnswer = correctAnswer.toLowerCase();

        const mentionedCorrectAnswer = lowercaseNotes.includes(lowercaseAnswer);

        // Extract statements that sound like answers
        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            if (
                lowerSentence.includes('maybe') ||
                lowerSentence.includes('could be') ||
                lowerSentence.includes('i think') ||
                lowerSentence.includes('answer is') ||
                lowerSentence.includes('it might be')
            ) {
                potentialAnswers.push(sentence.trim());
            }
        }

        // Calculate confidence based on discussion quality
        let confidence = 0.5;
        if (mentionedCorrectAnswer) confidence += 0.3;
        if (potentialAnswers.length > 0) confidence += 0.1;
        if (notes.length > 100) confidence += 0.1; // Longer discussions might be more thorough

        const suggestions = [
            'Look for key terms in the question',
            'Consider multiple interpretations',
            'Think about the context provided',
        ];

        return {
            mentionedCorrectAnswer,
            potentialAnswers,
            confidence: Math.min(1, confidence),
            suggestions,
        };
    }

    /**
     * Clean text from XML (remove HTML tags, normalize spaces, etc.)
     */
    private static cleanText(text: string): string {
        return cleanQuestionText(text);
    }
}

// Export individual functions for cleaner imports
export const {
    parseXMLQuestion,
    fetchQuestionsFromSource,
    getFallbackQuestions,
    validateAnswer,
    analyzeDiscussionNotes,
} = QuestionService;