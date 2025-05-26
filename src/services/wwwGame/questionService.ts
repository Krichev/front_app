// src/services/wwwGame/questionService.ts
import axios from 'axios';
// import {parseStringPromise} from 'xml2js';
import {XMLParser} from 'fast-xml-parser';
import {DeepSeekHostService} from "./deepseekHostService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types for the XML response from db.chgk.info
interface XMLQuestionFields {
    // Add camelCase properties from the actual response
    QuestionId?: string | number;
    ParentId?: string | number;
    Question?: string;
    Answer?: string;
    Comments?: string;
    Sources?: string;
    Topic?: string;
    Authors?: string;
    tournamentTitle?: string;
    tourTitle?: string;

    // Keep original properties for backward compatibility
    dbid?: string | string[];
    text?: string | string[];
    answer?: string | string[];
    sources?: Array<{
        source?: string | string[];
    }> | {
        source?: string | string[];
    } | string;
    comments?: string | string[];
    topic?: string | string[];
    // Add catch-all for unexpected properties
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

// Define types for question data
export interface QuestionData {
    id: string;
    question: string;
    answer: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    topic?: string;
    source?: string;
    additionalInfo?: string;
}

export interface UserQuestion extends QuestionData {
    createdAt: string;
    lastUsed?: string;
}

/**
 * Service for fetching and managing questions from external APIs
 */
export class QuestionService {
    private static readonly BASE_URL = 'https://db.chgk.info/xml';
    private static cache: Record<string, QuestionData[]> = {};
    public static isInitialized = false;

    /**
     * Check if text contains Cyrillic characters (Russian)
     */
    static containsCyrillic(text: string): boolean {
        // Regular expression to match Cyrillic characters
        const cyrillicPattern = /[\u0400-\u04FF]/;
        return cyrillicPattern.test(text);
    }

    /**
     * Get language of a question/answer for proper display and handling
     */
    static getTextLanguage(text: string): 'en' | 'ru' {
        return this.containsCyrillic(text) ? 'ru' : 'en';
    }

    /**
     * Initialize the question service
     */
    static initialize(): void {
        this.isInitialized = true;
        console.log('Question Service initialized');
    }

    static async saveUserQuestion(question: Omit<UserQuestion, 'id' | 'createdAt'>): Promise<UserQuestion> {
        try {
            // Generate a unique ID
            const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create new question object
            const newQuestion: UserQuestion = {
                ...question,
                id,
                createdAt: new Date().toISOString(),
            };

            // Get existing questions
            const existingQuestions = await this.getUserQuestions();

            // Add new question
            const updatedQuestions = [...existingQuestions, newQuestion];

            // Save to AsyncStorage
            await AsyncStorage.setItem('userQuestions', JSON.stringify(updatedQuestions));

            return newQuestion;
        } catch (error) {
            console.error('Error saving user question:', error);
            throw error;
        }
    }

    // Get all user-created questions
    static async getUserQuestions(): Promise<UserQuestion[]> {
        try {
            const questionsJson = await AsyncStorage.getItem('userQuestions');
            if (questionsJson) {
                return JSON.parse(questionsJson);
            }
            return [];
        } catch (error) {
            console.error('Error getting user questions:', error);
            return [];
        }
    }

    // Delete a user question
    static async deleteUserQuestion(id: string): Promise<void> {
        try {
            const questions = await this.getUserQuestions();
            const updatedQuestions = questions.filter(q => q.id !== id);
            await AsyncStorage.setItem('userQuestions', JSON.stringify(updatedQuestions));
        } catch (error) {
            console.error('Error deleting user question:', error);
            throw error;
        }
    }

    // Update a user question
    static async updateUserQuestion(updatedQuestion: UserQuestion): Promise<void> {
        try {
            const questions = await this.getUserQuestions();
            const updatedQuestions = questions.map(q =>
                q.id === updatedQuestion.id ? updatedQuestion : q
            );
            await AsyncStorage.setItem('userQuestions', JSON.stringify(updatedQuestions));
        } catch (error) {
            console.error('Error updating user question:', error);
            throw error;
        }
    }

    /**
     * Fetch a set of random questions from db.chgk.info
     * @param count Number of questions to fetch
     * @param fromYear Optional year to start from (e.g., '2015')
     * @param difficulty Optional difficulty level to filter by
     */
    static async fetchRandomQuestions(
        count: number = 10,
        fromYear?: string,
        difficulty?: 'Easy' | 'Medium' | 'Hard'
    ): Promise<QuestionData[]> {
        try {
            // Construct the URL based on parameters
            let url = `${this.BASE_URL}/random`;

            if (fromYear) {
                url += `/from_${fromYear}-01-01`;
            }

            url += `/limit${count * 2}`; // Request more than needed to account for filtering
            url += `/types1`; // Add question type parameter

            console.log(`Fetching questions from: ${url}`);

            // Fetch the data with better error handling
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/xml, text/xml',
                    'Content-Type': 'application/xml'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log("Received response from db.chgk.info");
            console.log("Response status:", response.status);
            console.log("Response data type:", typeof response.data);

            // Check if we got HTML instead of XML (common error)
            if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                throw new Error('Received HTML instead of XML from API');
            }

            // Parse the XML response
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: "",
                textNodeName: "value",
                allowBooleanAttributes: true,
                parseTagValue: true,
                trimValues: true,
                parseAttributeValue: true,
                // Force arrays for question elements
                isArray: (name, jpath) => {
                    return name === 'question';
                }
            });

            const result = parser.parse(response.data);
            console.log("Parsed XML data successfully");
            console.log("Result structure:", JSON.stringify(Object.keys(result), null, 2));

            // Process the questions
            let questions: QuestionData[] = [];

            // Handle different response structures
            if (result && result.search && result.search.question) {
                // Multiple questions in search results
                const questionArray = Array.isArray(result.search.question)
                    ? result.search.question
                    : [result.search.question];

                console.log(`Found ${questionArray.length} questions in search response`);

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
            } else if (result && result.question) {
                // Single question or array of questions at root level
                const questionArray = Array.isArray(result.question)
                    ? result.question
                    : [result.question];

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

            // Filter invalid questions (with very short answers or questions)
            questions = questions.filter(q =>
                q.question && q.question.length > 10 &&
                q.answer && q.answer.length > 0
            );

            // Limit to requested count
            questions = questions.slice(0, count);
            console.log(`Returning ${questions.length} filtered questions`);

            // Log first question for debugging
            if (questions.length > 0) {
                console.log("Sample question:", {
                    question: questions[0].question.substring(0, 50) + "...",
                    answer: questions[0].answer
                });
            }

            return questions;
        } catch (error) {
            console.error('Error fetching questions from db.chgk.info:', error);

            // Log more details about the error
            if (axios.isAxiosError(error)) {
                console.error('Axios error details:', {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data ? String(error.response.data).substring(0, 200) : 'No data'
                });
            }

            // If API fails, use fallback
            console.log('Using fallback questions due to API failure');
            return this.getFallbackQuestions(count, difficulty);
        }
    }

    /**
     * Search for questions by topic or keyword
     */
    static async searchQuestions(
        keyword: string,
        count: number = 10,
        difficulty?: 'Easy' | 'Medium' | 'Hard'
    ): Promise<QuestionData[]> {
        try {
            // Replace spaces with URL-encoded spaces
            const encodedKeyword = encodeURIComponent(keyword);

            // Construct the URL
            const url = `${this.BASE_URL}/search/questions/types1/${encodedKeyword}/A`;

            // Try to get from cache first
            const cacheKey = `search_${keyword}_${count}`;
            if (this.cache[cacheKey]) {
                return this.cache[cacheKey];
            }

            // Fetch the data
            const response = await axios.get(url);

            // Parse the XML response
            // const result = await parseStringPromise(response.data);
            const parser = new XMLParser();
            const result = parser.parse(response.data);
            console.log("response from answer service" + result)

            // Process the questions
            let questions: QuestionData[] = [];

            if (result && result.questions && result.questions.question) {
                // Multiple questions
                questions = await Promise.all(result.questions.question.map(async (q: any) => {
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
                console.warn('No questions found for keyword:', keyword);
            }

            // Filter invalid questions
            questions = questions.filter(q =>
                q.question && q.question.length > 10 &&
                q.answer && q.answer.length > 1
            );

            // Limit to requested count
            questions = questions.slice(0, count);

            // Cache the results
            this.cache[cacheKey] = questions;

            return questions;
        } catch (error) {
            console.error('Error searching questions:', error);

            // Return fallback questions if search fails
            return this.getFallbackQuestions(count, difficulty);
        }
    }

    /**
     * Fetch questions by difficulty
     */
    static async getQuestionsByDifficulty(
        difficulty: 'Easy' | 'Medium' | 'Hard',
        count: number = 10
    ): Promise<QuestionData[]> {
        // Map difficulty to year ranges (more recent questions are typically easier)
        const yearRanges = {
            'Easy': '2018',    // Recent, easier questions
            'Medium': '2010',  // Somewhat older questions
            'Hard': '2000'     // Older, more challenging questions
        };

        // Fetch random questions from the appropriate year range
        return this.fetchRandomQuestions(count, yearRanges[difficulty], difficulty);
    }

    /**
     * Clean and parse a question object from the XML response
     */
    private static parseQuestionFromXml(q: XMLQuestionFields): QuestionData {
        let questionText = '';
        let answerText = '';
        let sourceText = '';
        let additionalInfo = '';
        let id = '';

        // Extract ID - check for camelCase property first
        if (q.QuestionId !== undefined) {
            id = String(q.QuestionId);
        } else if (q.dbid) {
            id = Array.isArray(q.dbid) ? q.dbid[0] : String(q.dbid);
        }

        // Extract question text - check for camelCase property first
        if (q.Question !== undefined) {
            questionText = this.cleanText(String(q.Question));
        } else if (q.text) {
            questionText = this.cleanText(Array.isArray(q.text) ? q.text[0] : String(q.text));
        }

        // Extract answer text - check for camelCase property first
        if (q.Answer !== undefined) {
            answerText = this.cleanText(String(q.Answer));
        } else if (q.answer) {
            answerText = this.cleanText(Array.isArray(q.answer) ? q.answer[0] : String(q.answer));
        }

        // Extract source if available
        if (q.Sources !== undefined) {
            sourceText = this.cleanText(String(q.Sources));
        } else if (q.sources) {
            const sourcesArray = Array.isArray(q.sources) ? q.sources : [q.sources];
            if (q.Sources !== undefined) {
                // Direct string from camelCase property
                sourceText = this.cleanText(String(q.Sources));
            } else if (q.sources) {
                // Check what type sources is
                if (typeof q.sources === 'string') {
                    // Direct string
                    sourceText = this.cleanText(q.sources);
                } else if (Array.isArray(q.sources)) {
                    // Array of objects
                    for (const sourceObj of q.sources) {
                        if (sourceObj && typeof sourceObj === 'object' && sourceObj.source) {
                            const source = sourceObj.source;
                            sourceText = this.cleanText(Array.isArray(source) ? source[0] : String(source));
                            break; // Just use the first one
                        }
                    }
                } else if (typeof q.sources === 'object' && q.sources !== null) {
                    // Single object with source property
                    if (q.sources.source) {
                        const source = q.sources.source;
                        sourceText = this.cleanText(Array.isArray(source) ? source[0] : String(source));
                    }
                }
            }
        }

        if (q.Comments !== undefined) {
            additionalInfo = this.cleanText(String(q.Comments));
        } else if (q.comments) {
            additionalInfo = this.cleanText(Array.isArray(q.comments) ? q.comments[0] : String(q.comments));
        }

        // Extract topic if available
        let topic = '';
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
            topic: topic
        };
    }

    /**
     * Clean text from XML (remove HTML tags, normalize spaces, etc.)
     */
    private static cleanText(text: string): string {
        // Remove HTML tags
        let cleaned = text.replace(/<[^>]*>/g, '');

        // Replace HTML entities
        cleaned = cleaned.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            .replace(/&laquo;/g, '«')
            .replace(/&raquo;/g, '»')
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

        // Normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    /**
     * Use GPT-4 to classify question difficulty
     */
    private static async classifyQuestionDifficulty(
        question: string,
        answer: string
    ): Promise<'Easy' | 'Medium' | 'Hard'> {
        // Attempt to use DeepSeek if available
        try {
            // Check if DeepSeekHostService is available and initialized
            if (typeof DeepSeekHostService.classifyQuestionDifficulty === 'function') {
                return await DeepSeekHostService.classifyQuestionDifficulty(question, answer);
            }
        } catch (error) {
            console.log('Error classifying question difficulty:', error);
        }

        // Fallback: Simple heuristic based on question and answer length
        const totalLength = question.length + answer.length;
        const wordCount = question.split(' ').length + answer.split(' ').length;

        if (answer.length <= 15 && wordCount < 30) {
            return 'Easy';
        } else if (totalLength > 500 || wordCount > 60) {
            return 'Hard';
        } else {
            return 'Medium';
        }
    }

    /**
     * Provides fallback questions in case API calls fail
     */
    static getFallbackQuestions(
        count: number = 10,
        difficulty?: 'Easy' | 'Medium' | 'Hard'
    ): QuestionData[] {
        // Define some hardcoded fallback questions by difficulty
        const fallbackQuestions = {
            'Easy': [
                {
                    id: 'e1',
                    question: "Which planet is known as the Red Planet?",
                    answer: "Mars",
                    difficulty: 'Easy' as const
                },
                {
                    id: 'e2',
                    question: "What is the largest mammal in the world?",
                    answer: "Blue Whale",
                    difficulty: 'Easy' as const
                },
                {
                    id: 'e3',
                    question: "What is the capital of France?",
                    answer: "Paris",
                    difficulty: 'Easy' as const
                },
                {
                    id: 'e4',
                    question: "Which element has the chemical symbol 'O'?",
                    answer: "Oxygen",
                    difficulty: 'Easy' as const
                },
                {
                    id: 'e5',
                    question: "Which famous painting features a woman with a mysterious smile?",
                    answer: "Mona Lisa",
                    difficulty: 'Easy' as const
                },
            ],
            'Medium': [
                {
                    id: 'm1',
                    question: "Which scientist formulated the theory of relativity?",
                    answer: "Albert Einstein",
                    difficulty: 'Medium' as const
                },
                {
                    id: 'm2',
                    question: "What is the chemical symbol for gold?",
                    answer: "Au",
                    difficulty: 'Medium' as const
                },
                {
                    id: 'm3',
                    question: "In which year did the Chernobyl disaster occur?",
                    answer: "1986",
                    difficulty: 'Medium' as const
                },
                {
                    id: 'm4',
                    question: "Which novel begins with the line 'It was the best of times, it was the worst of times'?",
                    answer: "A Tale of Two Cities",
                    difficulty: 'Medium' as const
                },
                {
                    id: 'm5',
                    question: "What is the currency of Japan?",
                    answer: "Yen",
                    difficulty: 'Medium' as const
                },
            ],
            'Hard': [
                {
                    id: 'h1',
                    question: "What is the smallest prime number greater than 100?",
                    answer: "101",
                    difficulty: 'Hard' as const
                },
                {
                    id: 'h2',
                    question: "Who authored the philosophical work 'Being and Nothingness'?",
                    answer: "Jean-Paul Sartre",
                    difficulty: 'Hard' as const
                },
                {
                    id: 'h3',
                    question: "What is the hardest natural substance on Earth?",
                    answer: "Diamond",
                    difficulty: 'Hard' as const
                },
                {
                    id: 'h4',
                    question: "Which composer wrote 'The Magic Flute'?",
                    answer: "Wolfgang Amadeus Mozart",
                    difficulty: 'Hard' as const
                },
                {
                    id: 'h5',
                    question: "What is the chemical formula for sulfuric acid?",
                    answer: "H2SO4",
                    difficulty: 'Hard' as const
                },
            ]
        };

        // Return questions matching the requested difficulty, or mix if not specified
        if (difficulty) {
            // Return up to the requested count, repeating if necessary
            const questions = [...fallbackQuestions[difficulty]];
            while (questions.length < count) {
                questions.push(...fallbackQuestions[difficulty]);
            }
            return questions.slice(0, count);
        } else {
            // Mix questions from all difficulties
            const mixed = [
                ...fallbackQuestions.Easy,
                ...fallbackQuestions.Medium,
                ...fallbackQuestions.Hard
            ];

            // Repeat if necessary
            const allQuestions = [...mixed];
            while (allQuestions.length < count) {
                allQuestions.push(...mixed);
            }

            // Shuffle the array
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }

            return allQuestions.slice(0, count);
        }
    }

    /**
     * Add a method to DeepSeekHostService for classifying question difficulty
     * This extends the DeepSeekHostService with a new capability
     */
    static extendGPT4HostService(): void {
        if (typeof DeepSeekHostService.classifyQuestionDifficulty !== 'function') {
            DeepSeekHostService.classifyQuestionDifficulty = async function (
                question: string,
                answer: string
            ): Promise<'Easy' | 'Medium' | 'Hard'> {
                try {
                    // Make API request to DeepSeek
                    const response = await fetch('https://api.deepseek.com/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(this as any).config.apiKey}`
                        },
                        body: JSON.stringify({
                            model: (this as any).config.model || 'deepseek-chat',
                            messages: [
                                {
                                    role: "system",
                                    content: `You are an expert at classifying trivia questions by difficulty. 
                  Classify the following question as either Easy, Medium, or Hard based on:
                  - Easy: Common knowledge, simple facts, popular culture, straightforward answers
                  - Medium: Requires some specific knowledge or reasoning
                  - Hard: Requires specialized knowledge, complex reasoning, or obscure facts
                  
                  Reply with only one word: Easy, Medium, or Hard.`
                                },
                                {
                                    role: "user",
                                    content: `Question: "${question}"
                  Answer: "${answer}"
                  
                  Difficulty:`
                                }
                            ],
                            temperature: 0.3,
                            max_tokens: 10
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`DeepSeek API error: ${response.status}`);
                    }

                    const data = await response.json();
                    const result = data.choices?.[0]?.message?.content?.trim();

                    if (result?.toLowerCase().includes('easy')) {
                        return 'Easy';
                    } else if (result?.toLowerCase().includes('medium')) {
                        return 'Medium';
                    } else if (result?.toLowerCase().includes('hard')) {
                        return 'Hard';
                    } else {
                        return 'Medium'; // Default to Medium if classification fails
                    }

                } catch (error) {
                    console.error('Error classifying question difficulty with DeepSeek:', error);

                    // Simple fallback based on answer length if DeepSeek classification fails
                    if (answer.length <= 15) {
                        return 'Easy';
                    } else if (answer.length >= 30) {
                        return 'Hard';
                    } else {
                        return 'Medium';
                    }
                }
            };
        }

        console.log('Extended DeepSeekHostService with question difficulty classification');
    }

    /**
     * Clear the question cache
     */
    static clearCache(): void {
        this.cache = {};
        console.log('Question cache cleared');
    }
}