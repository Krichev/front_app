// src/shared/api/question/service.ts
import axios from 'axios';
import {parseStringPromise} from 'xml2js';
import type {QuestionData, QuestionDifficulty} from '../../../entities/question';
import {classifyQuestionDifficulty} from '../../../entities/question/lib/difficultyClassifier';

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

            let questions: QuestionData[] = [];

            if (result.search?.question) {
                const questionArray = Array.isArray(result.search.question)
                    ? result.search.question
                    : [result.search.question];

                console.log(`Found ${questionArray.length} questions in search response`);

                questions = await Promise.all(questionArray.map(async (q: XMLQuestionFields): Promise<QuestionData> => {
                    const baseQuestionData = this.parseQuestionFromXml(q);

                    // Create the complete QuestionData object with difficulty
                    const questionData: QuestionData = {
                        ...baseQuestionData,
                        difficulty: difficulty || await classifyQuestionDifficulty(
                            baseQuestionData.question,
                            baseQuestionData.answer
                        )
                    };

                    return questionData;
                }));
            } else if (result && (result as any).question) {
                // Single question or array of questions at root level
                const questionArray = Array.isArray((result as any).question)
                    ? (result as any).question
                    : [(result as any).question];

                console.log(`Found ${questionArray.length} questions in root response`);

                questions = await Promise.all(questionArray.map(async (q: XMLQuestionFields): Promise<QuestionData> => {
                    const baseQuestionData = this.parseQuestionFromXml(q);

                    const questionData: QuestionData = {
                        ...baseQuestionData,
                        difficulty: difficulty || await classifyQuestionDifficulty(
                            baseQuestionData.question,
                            baseQuestionData.answer
                        )
                    };

                    return questionData;
                }));
            } else {
                throw new Error('No questions found in API response');
            }

            // Filter out any invalid questions
            questions = questions.filter(q => q.question && q.answer);

            if (questions.length === 0) {
                throw new Error('No valid questions found in API response');
            }

            return questions.slice(0, count);
        } catch (error) {
            console.error('Error fetching questions from API:', error);
            throw error;
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

            let questions: QuestionData[] = [];

            if (result.search?.question) {
                const questionArray = Array.isArray(result.search.question)
                    ? result.search.question
                    : [result.search.question];

                questions = await Promise.all(questionArray.map(async (q: XMLQuestionFields): Promise<QuestionData> => {
                    const baseQuestionData = this.parseQuestionFromXml(q);

                    const questionData: QuestionData = {
                        ...baseQuestionData,
                        difficulty: difficulty || await classifyQuestionDifficulty(
                            baseQuestionData.question,
                            baseQuestionData.answer
                        )
                    };

                    return questionData;
                }));
            } else {
                throw new Error(`No questions found for keyword: ${keyword}`);
            }

            return questions.slice(0, count);
        } catch (error) {
            console.error('Error searching questions:', error);
            throw error;
        }
    }

    /**
     * Parse question data from XML format
     * Now returns the base question data without difficulty
     */
    private static parseQuestionFromXml(xmlQuestion: XMLQuestionFields): Omit<QuestionData, 'difficulty'> {
        const question = Array.isArray(xmlQuestion.Question)
            ? xmlQuestion.Question[0]
            : xmlQuestion.Question || '';

        const answer = Array.isArray(xmlQuestion.Answer)
            ? xmlQuestion.Answer[0]
            : xmlQuestion.Answer || '';

        const comments = Array.isArray(xmlQuestion.Comments)
            ? xmlQuestion.Comments.join(' ')
            : xmlQuestion.Comments || '';

        const authors = Array.isArray(xmlQuestion.Authors)
            ? xmlQuestion.Authors.join(', ')
            : xmlQuestion.Authors || '';

        const sources = Array.isArray(xmlQuestion.Sources)
            ? xmlQuestion.Sources.join(', ')
            : xmlQuestion.Sources || '';

        return {
            id: `xml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question: this.cleanText(question),
            answer: this.cleanText(answer),
            topic: this.extractTopic(question),
            source: sources || 'db.chgk.info',
            additionalInfo: comments,
            isUserCreated: false,
            creatorId: undefined,
            externalId: undefined,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            lastUsed: undefined,
            updatedAt: new Date().toISOString(),
            category: 'General',
            hints: comments ? [comments] : undefined,
            alternativeAnswers: undefined,
            tags: authors ? authors.split(', ') : undefined,
            imageUrl: undefined,
            audioUrl: undefined,
            explanation: undefined,
            references: sources ? sources.split(', ') : undefined,
            estimatedTime: undefined,
            points: undefined,
            isActive: true,
        };
    }

    /**
     * Clean text content by removing HTML tags and extra whitespace
     */
    private static cleanText(text: string): string {
        if (!text) return '';

        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&[^;]+;/g, ' ') // Remove HTML entities
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }

    /**
     * Extract topic from question text
     */
    private static extractTopic(question: string): string {
        // Simple topic extraction based on keywords
        const topics = [
            { keywords: ['история', 'history', 'historical'], topic: 'History' },
            { keywords: ['география', 'geography', 'country', 'capital'], topic: 'Geography' },
            { keywords: ['литература', 'literature', 'author', 'book'], topic: 'Literature' },
            { keywords: ['наука', 'science', 'physics', 'chemistry'], topic: 'Science' },
            { keywords: ['спорт', 'sport', 'football', 'olympic'], topic: 'Sports' },
            { keywords: ['искусство', 'art', 'painting', 'music'], topic: 'Arts' },
        ];

        const questionLower = question.toLowerCase();

        for (const topicGroup of topics) {
            if (topicGroup.keywords.some(keyword => questionLower.includes(keyword))) {
                return topicGroup.topic;
            }
        }

        return 'General';
    }

    /**
     * Get questions by category
     */
    static async getQuestionsByCategory(
        category: string,
        count: number = 10,
        difficulty?: QuestionDifficulty
    ): Promise<QuestionData[]> {
        // Use search with category as keyword
        return this.searchQuestions(category, count, difficulty);
    }

    /**
     * Validate question data
     */
    static validateQuestionData(question: QuestionData): boolean {
        return !!(
            question.id &&
            question.question &&
            question.answer &&
            question.difficulty &&
            typeof question.isUserCreated === 'boolean' &&
            question.createdAt
        );
    }
}