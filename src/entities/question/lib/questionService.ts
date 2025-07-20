// src/entities/question/lib/questionService.ts
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {
    AnswerValidationResult,
    ParsedQuestion,
    QuestionAnalysis,
    QuestionData,
    QuestionDifficulty,
} from '../model/types';
import {calculateAnswerSimilarity} from './difficultyClassifier';
import {cleanQuestionText, normalizeAnswer} from './utils';

// Types for XML response from external sources
interface XMLQuestionFields {
    QuestionId?: string | number;
    ParentId?: string | number;
    Question?: string;
    Answer?: string;
    Comments?: string;
    Sources?: string | Array<{ source?: string }> | { source?: string };
    Topic?: string;
    Authors?: string;
    tournamentTitle?: string;
    tourTitle?: string;
    dbid?: string | string[];
    text?: string | string[];
    answer?: string | string[];
    sources?: Array<{ source?: string | string[] }> | { source?: string | string[] } | string;
    comments?: string | string[];
    topic?: string | string[];
    [key: string]: any;
}

interface XMLSearchResponse {
    search: {
        question: XMLQuestionFields[] | XMLQuestionFields;
    };
}

interface XMLSingleQuestionResponse {
    question: XMLQuestionFields;
}

type XMLParsedResponse = XMLSearchResponse | XMLSingleQuestionResponse;

/**
 * Service for managing questions from various sources
 */
export class QuestionService {
    private static readonly BASE_URL = 'https://db.chgk.info/xml';
    private static cache: Record<string, QuestionData[]> = {};
    private static fallbackQuestions: QuestionData[] = [];
    private static isInitialized = false;
    private static xmlParser: XMLParser;

    /**
     * Initialize the question service
     */
    static initialize(): void {
        if (this.isInitialized) return;

        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
            parseTagValue: true,
            textNodeName: '#text',
            isArray: (name, jpath, isLeafNode, isAttribute) => {
                // Handle arrays properly
                return ['question', 'source'].includes(name);
            }
        });

        this.initializeFallbackQuestions();
        this.isInitialized = true;
    }

    /**
     * Initialize fallback questions for offline mode
     */
    private static initializeFallbackQuestions(): void {
        this.fallbackQuestions = [
            {
                id: 'fallback-1',
                question: 'What is the capital of France?',
                answer: 'Paris',
                difficulty: 'Easy',
                topic: 'Geography',
                source: 'General Knowledge',
                additionalInfo: '',
                isUserCreated: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'fallback-2',
                question: 'Who wrote "Romeo and Juliet"?',
                answer: 'William Shakespeare',
                difficulty: 'Easy',
                topic: 'Literature',
                source: 'General Knowledge',
                additionalInfo: '',
                isUserCreated: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'fallback-3',
                question: 'What is the chemical symbol for gold?',
                answer: 'Au',
                difficulty: 'Medium',
                topic: 'Chemistry',
                source: 'General Knowledge',
                additionalInfo: 'From the Latin word "aurum"',
                isUserCreated: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'fallback-4',
                question: 'In which year did World War II end?',
                answer: '1945',
                difficulty: 'Medium',
                topic: 'History',
                source: 'General Knowledge',
                additionalInfo: '',
                isUserCreated: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'fallback-5',
                question: 'What is the speed of light in vacuum?',
                answer: '299,792,458 meters per second',
                difficulty: 'Hard',
                topic: 'Physics',
                source: 'General Knowledge',
                additionalInfo: 'Approximately 300,000 km/s',
                isUserCreated: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
            },
        ];
    }

    /**
     * Parse XML question data into standardized format
     */
    static parseXMLQuestion(q: XMLQuestionFields, id?: string): ParsedQuestion {
        if (!this.isInitialized) this.initialize();

        let questionText = '';
        let answerText = '';
        let sourceText = '';
        let additionalInfo = '';
        let topic = '';

        // Extract question text
        if (q.Question !== undefined) {
            questionText = this.cleanText(String(q.Question));
        } else if (q.question !== undefined) {
            questionText = this.cleanText(Array.isArray(q.question) ? q.question[0] : String(q.question));
        } else if (q.text !== undefined) {
            questionText = this.cleanText(Array.isArray(q.text) ? q.text[0] : String(q.text));
        }

        // Extract answer text
        if (q.Answer !== undefined) {
            answerText = this.cleanText(String(q.Answer));
        } else if (q.answer !== undefined) {
            answerText = this.cleanText(Array.isArray(q.answer) ? q.answer[0] : String(q.answer));
        }

        // Extract source
        if (q.Sources !== undefined) {
            sourceText = this.extractSourceText(q.Sources);
        } else if (q.sources !== undefined) {
            sourceText = this.extractSourceText(q.sources);
        }

        // Extract additional info/comments
        if (q.Comments !== undefined) {
            additionalInfo = this.cleanText(String(q.Comments));
        } else if (q.comments !== undefined) {
            additionalInfo = this.cleanText(Array.isArray(q.comments) ? q.comments[0] : String(q.comments));
        }

        // Extract topic
        if (q.Topic !== undefined) {
            topic = this.cleanText(String(q.Topic));
        } else if (q.topic !== undefined) {
            topic = this.cleanText(Array.isArray(q.topic) ? q.topic[0] : String(q.topic));
        }

        // Generate ID if not provided
        const questionId = id || q.QuestionId?.toString() || q.dbid?.toString() || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            id: questionId,
            question: questionText,
            answer: answerText,
            source: sourceText,
            additionalInfo: additionalInfo,
            topic: topic,
        };
    }

    /**
     * Extract source text from various source formats
     */
    private static extractSourceText(sources: any): string {
        try {
            if (typeof sources === 'string') {
                return this.cleanText(sources);
            }

            if (Array.isArray(sources)) {
                for (const sourceItem of sources) {
                    if (typeof sourceItem === 'object' && sourceItem.source) {
                        const source = sourceItem.source;
                        return this.cleanText(Array.isArray(source) ? source[0] : String(source));
                    } else if (typeof sourceItem === 'string') {
                        return this.cleanText(sourceItem);
                    }
                }
            } else if (typeof sources === 'object' && sources !== null) {
                if (sources.source) {
                    const source = sources.source;
                    return this.cleanText(Array.isArray(source) ? source[0] : String(source));
                }
            }

            return '';
        } catch (error) {
            console.warn('Error extracting source text:', error);
            return '';
        }
    }

    /**
     * Fetch questions from external source
     */
    static async fetchQuestionsFromSource(
        source: string,
        count: number = 10,
        difficulty?: QuestionDifficulty,
        topic?: string
    ): Promise<QuestionData[]> {
        if (!this.isInitialized) this.initialize();

        const cacheKey = `${source}_${count}_${difficulty || 'any'}_${topic || 'any'}`;

        // Check cache first
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            const questions = await this.fetchFromAPI(source, count, difficulty, topic);

            // Cache the results
            this.cache[cacheKey] = questions;

            return questions;
        } catch (error) {
            console.error('Error fetching questions from source:', error);
            return this.getFallbackQuestions(count, difficulty);
        }
    }

    /**
     * Fetch questions from API
     */
    private static async fetchFromAPI(
        source: string,
        count: number,
        difficulty?: QuestionDifficulty,
        topic?: string
    ): Promise<QuestionData[]> {
        let url: string;
        let params: Record<string, any> = {};

        switch (source.toLowerCase()) {
            case 'chgk':
            case 'db.chgk.info':
                url = `${this.BASE_URL}/random/types1`;
                params.count = Math.min(count, 100); // API limit
                if (topic) {
                    params.topic = topic;
                }
                break;

            default:
                // Try to use the source as a direct URL
                url = source;
                params.limit = count;
                break;
        }

        const response = await axios.get(url, {
            params,
            timeout: 10000,
            headers: {
                'Accept': 'application/xml, text/xml, application/json',
                'User-Agent': 'QuestionApp/1.0',
            },
        });

        return this.parseAPIResponse(response.data, count, difficulty);
    }

    /**
     * Parse API response data
     */
    private static parseAPIResponse(
        data: any,
        requestedCount: number,
        difficulty?: QuestionDifficulty
    ): QuestionData[] {
        try {
            let questions: QuestionData[] = [];

            // Handle XML response
            if (typeof data === 'string' && data.trim().startsWith('<')) {
                const parsed: XMLParsedResponse = this.xmlParser.parse(data);
                questions = this.extractQuestionsFromXML(parsed);
            }
            // Handle JSON response
            else if (typeof data === 'object') {
                questions = this.extractQuestionsFromJSON(data);
            }
            else {
                throw new Error('Unsupported response format');
            }

            // Filter by difficulty if specified
            if (difficulty) {
                questions = questions.filter(q => q.difficulty === difficulty);
            }

            // Limit to requested count
            questions = questions.slice(0, requestedCount);

            // Fill with fallback questions if needed
            if (questions.length < requestedCount) {
                const fallback = this.getFallbackQuestions(requestedCount - questions.length, difficulty);
                questions = [...questions, ...fallback];
            }

            return questions;
        } catch (error) {
            console.error('Error parsing API response:', error);
            return this.getFallbackQuestions(requestedCount, difficulty);
        }
    }

    /**
     * Extract questions from XML response
     */
    private static extractQuestionsFromXML(parsed: XMLParsedResponse): QuestionData[] {
        const questions: QuestionData[] = [];

        try {
            let xmlQuestions: XMLQuestionFields[] = [];

            if ('search' in parsed && parsed.search?.question) {
                xmlQuestions = Array.isArray(parsed.search.question)
                    ? parsed.search.question
                    : [parsed.search.question];
            } else if ('question' in parsed) {
                xmlQuestions = [parsed.question];
            }

            for (const xmlQ of xmlQuestions) {
                try {
                    const parsedQ = this.parseXMLQuestion(xmlQ);

                    if (parsedQ.question && parsedQ.answer) {
                        const questionData: QuestionData = {
                            id: parsedQ.id,
                            question: parsedQ.question,
                            answer: parsedQ.answer,
                            difficulty: this.estimateDifficulty(parsedQ.question, parsedQ.answer),
                            topic: parsedQ.topic || 'General',
                            source: parsedQ.source || 'External',
                            additionalInfo: parsedQ.additionalInfo,
                            isUserCreated: false,
                            usageCount: 0,
                            createdAt: new Date().toISOString(),
                        };

                        questions.push(questionData);
                    }
                } catch (error) {
                    console.warn('Error parsing individual question:', error);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error extracting questions from XML:', error);
        }

        return questions;
    }

    /**
     * Extract questions from JSON response
     */
    private static extractQuestionsFromJSON(data: any): QuestionData[] {
        const questions: QuestionData[] = [];

        try {
            let jsonQuestions: any[] = [];

            if (Array.isArray(data)) {
                jsonQuestions = data;
            } else if (data.questions && Array.isArray(data.questions)) {
                jsonQuestions = data.questions;
            } else if (data.results && Array.isArray(data.results)) {
                jsonQuestions = data.results;
            } else if (data.data && Array.isArray(data.data)) {
                jsonQuestions = data.data;
            }

            for (const item of jsonQuestions) {
                try {
                    const questionData: QuestionData = {
                        id: item.id || `json_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        question: this.cleanText(item.question || item.text || ''),
                        answer: this.cleanText(item.answer || item.correct_answer || ''),
                        difficulty: item.difficulty || this.estimateDifficulty(item.question, item.answer),
                        topic: item.topic || item.category || 'General',
                        source: item.source || 'JSON API',
                        additionalInfo: item.explanation || item.info || '',
                        isUserCreated: false,
                        usageCount: 0,
                        createdAt: new Date().toISOString(),
                    };

                    if (questionData.question && questionData.answer) {
                        questions.push(questionData);
                    }
                } catch (error) {
                    console.warn('Error parsing JSON question:', error);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error extracting questions from JSON:', error);
        }

        return questions;
    }

    /**
     * Get fallback questions when external sources fail
     */
    static getFallbackQuestions(
        count: number = 10,
        difficulty?: QuestionDifficulty
    ): QuestionData[] {
        if (!this.isInitialized) this.initialize();

        let questions = [...this.fallbackQuestions];

        // Filter by difficulty if specified
        if (difficulty) {
            questions = questions.filter(q => q.difficulty === difficulty);
        }

        // Repeat questions if we need more than available
        while (questions.length < count) {
            questions = [...questions, ...this.fallbackQuestions.filter(q =>
                !difficulty || q.difficulty === difficulty
            )];
        }

        return questions.slice(0, count);
    }

    /**
     * Validate user answer against correct answer
     */
    static validateAnswer(
        userAnswer: string,
        correctAnswer: string,
        strictMode: boolean = false,
        threshold: number = 0.8
    ): AnswerValidationResult {
        const normalizedUserAnswer = normalizeAnswer(userAnswer);
        const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);

        // Exact match
        if (normalizedUserAnswer === normalizedCorrectAnswer) {
            return {
                isCorrect: true,
                similarity: 1,
                normalizedUserAnswer,
                normalizedCorrectAnswer,
                feedback: 'Perfect match!',
                partialCredit: 1,
                attempts: 1,
            };
        }

        // Strict mode - only exact matches
        if (strictMode) {
            return {
                isCorrect: false,
                similarity: 0,
                normalizedUserAnswer,
                normalizedCorrectAnswer,
                feedback: 'Exact match required.',
                partialCredit: 0,
                attempts: 1,
            };
        }

        // Calculate similarity
        const similarity = calculateAnswerSimilarity(normalizedUserAnswer, normalizedCorrectAnswer);
        const isCorrect = similarity >= threshold;

        // Generate feedback and suggestions
        let feedback: string;
        let suggestions: string[] = [];
        let partialCredit = 0;

        if (isCorrect) {
            feedback = 'Close enough, accepted!';
            partialCredit = similarity;
        } else if (similarity > 0.6) {
            feedback = 'Very close, but not quite right.';
            suggestions.push('Check your spelling');
            suggestions.push('Consider alternative phrasings');
            partialCredit = similarity * 0.5;
        } else if (similarity > 0.3) {
            feedback = 'Partially correct, but missing key elements.';
            suggestions.push('Think about the core concept');
            suggestions.push('Consider what the question is really asking');
            partialCredit = similarity * 0.3;
        } else {
            feedback = 'Incorrect answer.';
            suggestions.push('Review the question carefully');
            suggestions.push('Consider different interpretations');
            partialCredit = 0;
        }

        return {
            isCorrect,
            similarity,
            normalizedUserAnswer,
            normalizedCorrectAnswer,
            feedback,
            suggestions,
            partialCredit,
            attempts: 1,
        };
    }

    /**
     * Analyze discussion notes for potential answers and insights
     */
    static analyzeDiscussionNotes(
        notes: string,
        correctAnswer: string,
        questionText?: string
    ): QuestionAnalysis {
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const potentialAnswers: string[] = [];
        const keyPhrases: string[] = [];
        const lowercaseNotes = notes.toLowerCase();
        const lowercaseAnswer = correctAnswer.toLowerCase();

        // Check if correct answer is mentioned
        const mentionedCorrectAnswer = lowercaseNotes.includes(lowercaseAnswer);

        // Extract potential answers from discussion
        const answerIndicators = [
            'maybe', 'could be', 'i think', 'answer is', 'it might be',
            'probably', 'possibly', 'seems like', 'looks like', 'sounds like'
        ];

        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase().trim();

            for (const indicator of answerIndicators) {
                if (lowerSentence.includes(indicator)) {
                    potentialAnswers.push(sentence.trim());
                    break;
                }
            }

            // Extract key phrases (longer meaningful phrases)
            const words = sentence.split(/\s+/).filter(w => w.length > 3);
            if (words.length >= 2) {
                keyPhrases.push(words.slice(0, 3).join(' '));
            }
        }

        // Calculate confidence based on various factors
        let confidence = 0.3; // Base confidence

        if (mentionedCorrectAnswer) confidence += 0.4;
        if (potentialAnswers.length > 0) confidence += 0.1 * Math.min(potentialAnswers.length, 3);
        if (notes.length > 100) confidence += 0.1; // Longer discussions
        if (notes.length > 300) confidence += 0.1; // Very thorough discussions

        // Reduce confidence for very short discussions
        if (notes.length < 20) confidence -= 0.2;

        // Determine complexity based on discussion content
        let complexity: 'low' | 'medium' | 'high' = 'low';
        if (notes.length > 200 || keyPhrases.length > 5) complexity = 'medium';
        if (notes.length > 500 || keyPhrases.length > 10) complexity = 'high';

        // Generate suggestions based on analysis
        const suggestions: string[] = [];
        if (!mentionedCorrectAnswer) {
            suggestions.push('Consider exploring different angles');
            suggestions.push('Look for key terms in the question');
        }
        if (potentialAnswers.length === 0) {
            suggestions.push('Try to formulate concrete answer candidates');
        }
        if (notes.length < 50) {
            suggestions.push('Discuss the question more thoroughly');
        }

        // Default suggestions
        suggestions.push('Think about the context provided');
        suggestions.push('Consider multiple interpretations');

        return {
            mentionedCorrectAnswer,
            potentialAnswers: [...new Set(potentialAnswers)], // Remove duplicates
            confidence: Math.min(1, Math.max(0, confidence)),
            suggestions,
            complexity,
            keyPhrases: [...new Set(keyPhrases)].slice(0, 10), // Top 10 unique key phrases
            sentiment: this.analyzeSentiment(notes),
        };
    }

    /**
     * Analyze sentiment of discussion notes
     */
    private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
        const positiveWords = ['good', 'great', 'excellent', 'correct', 'right', 'yes', 'sure', 'confident'];
        const negativeWords = ['bad', 'wrong', 'incorrect', 'no', 'not', 'doubt', 'unsure', 'confused'];

        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;

        for (const word of positiveWords) {
            if (lowerText.includes(word)) positiveCount++;
        }

        for (const word of negativeWords) {
            if (lowerText.includes(word)) negativeCount++;
        }

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * Estimate question difficulty based on content
     */
    private static estimateDifficulty(question: string, answer: string): QuestionDifficulty {
        const totalLength = question.length + answer.length;
        const wordCount = question.split(/\s+/).length + answer.split(/\s+/).length;

        // Check for complexity indicators
        const hardIndicators = [
            'derivative', 'integral', 'quantum', 'molecular', 'philosophical',
            'theoretical', 'hypothesis', 'paradigm', 'methodology', 'phenomenon',
            'algorithm', 'theorem', 'axiom', 'coefficient', 'variable', 'calculate',
            'analyze', 'synthesize', 'evaluate', 'compare', 'contrast'
        ];

        const easyIndicators = [
            'what', 'who', 'where', 'when', 'which', 'color', 'name', 'capital',
            'largest', 'smallest', 'first', 'last', 'how many', 'yes', 'no'
        ];

        const questionLower = question.toLowerCase();
        const answerLower = answer.toLowerCase();
        const combinedText = `${questionLower} ${answerLower}`;

        // Check for easy indicators
        const easyMatches = easyIndicators.filter(indicator =>
            combinedText.includes(indicator)
        ).length;

        // Check for hard indicators
        const hardMatches = hardIndicators.filter(indicator =>
            combinedText.includes(indicator)
        ).length;

        // Decision logic
        if (hardMatches >= 2 || totalLength > 500 || wordCount > 80) {
            return 'Hard';
        } else if (easyMatches >= 2 && answer.length <= 20 && wordCount < 25) {
            return 'Easy';
        } else if (totalLength > 300 || wordCount > 50 || hardMatches >= 1) {
            return 'Hard';
        } else if (totalLength < 100 || wordCount < 20) {
            return 'Easy';
        } else {
            return 'Medium';
        }
    }

    /**
     * Clean text from XML/HTML (remove tags, normalize spaces, etc.)
     */
    private static cleanText(text: string): string {
        return cleanQuestionText(text);
    }

    /**
     * Check if text contains Cyrillic characters
     */
    static containsCyrillic(text: string): boolean {
        const cyrillicPattern = /[\u0400-\u04FF]/;
        return cyrillicPattern.test(text);
    }

    /**
     * Get text language
     */
    static getTextLanguage(text: string): 'en' | 'ru' {
        return this.containsCyrillic(text) ? 'ru' : 'en';
    }

    /**
     * Clear cache
     */
    static clearCache(): void {
        this.cache = {};
    }

    /**
     * Get cache statistics
     */
    static getCacheStats(): { entries: number; keys: string[] } {
        return {
            entries: Object.keys(this.cache).length,
            keys: Object.keys(this.cache),
        };
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