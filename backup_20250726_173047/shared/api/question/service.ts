// src/shared/api/question/service.ts
import axios from 'axios';
import {parseStringPromise} from 'xml2js';
import type {QuestionData, QuestionDifficulty} from '../../../entities/question';

interface XMLQuestionFields {
    Question?: string[];
    Answer?: string[];
    Comments?: string[];
    Authors?: string[];
    Sources?: string[];
}

interface XMLResponse {
    search?: {
        question?: XMLQuestionFields | XMLQuestionFields[];
    };
}

/**
 * Question API service - handles all external question data fetching
 * Moved to shared layer according to FSD principles
 */
export class QuestionApiService {
    private static readonly BASE_URL = 'https://db.chgk.info/xml/random/types1';
    private static readonly SEARCH_URL = 'https://db.chgk.info/xml/search/questions';

    /**
     * Fetch random questions from external API
     */
    static async fetchRandomQuestions(
        count: number = 10,
        difficulty?: QuestionDifficulty
    ): Promise<QuestionData[]> {
        try {
            console.log(`Fetching ${count} questions from db.chgk.info API`);

            const response = await axios.get(this.BASE_URL, {
                params: { count },
                timeout: 15000,
                headers: {
                    'User-Agent': 'QuizApp/1.0',
                    'Accept': 'application/xml',
                },
            });

            const xml = response.data;
            const result: XMLResponse = await parseStringPromise(xml, {
                explicitArray: false,
                ignoreAttrs: true,
            });

            let questions: QuestionData[];

            if (result.search?.question) {
                const questionArray = Array.isArray(result.search.question)
                    ? result.search.question
                    : [result.search.question];

                console.log(`Found ${questionArray.length} questions at root level`);

                questions = await Promise.all(questionArray.map(async (q: XMLQuestionFields) => {
                    const questionData = this.parseQuestionFromXml(q);

                    // Assign difficulty
                    if (difficulty) {
                        questionData.difficulty = difficulty;
                    } else {
                        questionData.difficulty = await this.classifyQuestionDifficulty(
                            questionData.question,
                            questionData.answer
                        );
                    }

                    return questionData;
                }));
            } else {
                console.log("Unexpected XML structure:", JSON.stringify(result, null, 2));
                throw new Error('Unexpected XML response structure');
            }

            // Filter invalid questions
            questions = this.filterValidQuestions(questions);

            // Limit to requested count
            questions = questions.slice(0, count);
            console.log(`Returning ${questions.length} filtered questions`);

            return questions;
        } catch (error) {
            console.error('Error fetching questions from db.chgk.info:', error);
            this.logAxiosError(error);

            // Fallback to local questions
            console.log('Using fallback questions due to API failure');
            return this.getFallbackQuestions(count, difficulty);
        }
    }

    /**
     * Search for questions by keyword
     */
    static async searchQuestions(
        keyword: string,
        count: number = 10,
        difficulty?: QuestionDifficulty
    ): Promise<QuestionData[]> {
        try {
            console.log(`Searching for questions with keyword: ${keyword}`);

            const response = await axios.get(this.SEARCH_URL, {
                params: {
                    query: keyword,
                    limit: count,
                },
                timeout: 15000,
            });

            // Process search results similar to random questions
            const xml = response.data;
            const result: XMLResponse = await parseStringPromise(xml, {
                explicitArray: false,
                ignoreAttrs: true,
            });

            // Implementation similar to fetchRandomQuestions
            // ... (parse and process search results)

            return this.getFallbackQuestions(count, difficulty); // Temporary fallback
        } catch (error) {
            console.error('Error searching questions:', error);
            return this.getFallbackQuestions(count, difficulty);
        }
    }

    /**
     * Parse question data from XML format
     */
    private static parseQuestionFromXml(xmlQuestion: XMLQuestionFields): Omit<QuestionData, 'difficulty'> {
        const question = Array.isArray(xmlQuestion.Question)
            ? xmlQuestion.Question[0]
            : xmlQuestion.Question || '';

        const answer = Array.isArray(xmlQuestion.Answer)
            ? xmlQuestion.Answer[0]
            : xmlQuestion.Answer || '';

        const comments = Array.isArray(xmlQuestion.Comments)
            ? xmlQuestion.Comments[0]
            : xmlQuestion.Comments || '';

        return {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question: this.cleanText(question),
            answer: this.cleanText(answer),
            comments: this.cleanText(comments),
            source: 'db.chgk.info',
            category: 'general',
            isAnswered: false,
            userAnswer: '',
        };
    }

    /**
     * Classify question difficulty using simple heuristics
     */
    private static async classifyQuestionDifficulty(
        question: string,
        answer: string
    ): Promise<QuestionDifficulty> {
        const questionLength = question.length;
        const answerLength = answer.length;

        // Simple heuristic based on text complexity
        if (questionLength > 200 || answerLength > 50) {
            return 'hard';
        } else if (questionLength > 100 || answerLength > 20) {
            return 'medium';
        } else {
            return 'easy';
        }
    }

    /**
     * Filter out invalid questions
     */
    private static filterValidQuestions(questions: QuestionData[]): QuestionData[] {
        return questions.filter(q =>
            q.question && q.question.length > 10 &&
            q.answer && q.answer.length > 0
        );
    }

    /**
     * Clean and format text
     */
    private static cleanText(text: string): string {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    }

    /**
     * Log axios error details
     */
    private static logAxiosError(error: any): void {
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data ? String(error.response.data).substring(0, 200) : 'No data'
            });
        }
    }

    /**
     * Get fallback questions when API fails
     */
    private static getFallbackQuestions(count: number, difficulty?: QuestionDifficulty): QuestionData[] {
        const fallbackQuestions: QuestionData[] = [
            {
                id: 'fallback_1',
                question: 'What is the capital of France?',
                answer: 'Paris',
                comments: 'Basic geography question',
                source: 'fallback',
                category: 'geography',
                difficulty: difficulty || 'easy',
                isAnswered: false,
                userAnswer: '',
            },
            {
                id: 'fallback_2',
                question: 'Who wrote "Romeo and Juliet"?',
                answer: 'William Shakespeare',
                comments: 'Classic literature question',
                source: 'fallback',
                category: 'literature',
                difficulty: difficulty || 'medium',
                isAnswered: false,
                userAnswer: '',
            },
            // Add more fallback questions as needed
        ];

        return fallbackQuestions.slice(0, count);
    }
}