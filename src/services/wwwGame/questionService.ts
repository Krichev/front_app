// src/services/wwwGame/questionService.ts - FIXED: React Native compatible XML parsing
import {DeepSeekHostService} from './deepseekHostService';
import {XMLParser} from 'fast-xml-parser';

// FIXED: Support both UI and API difficulty formats
export type UIDifficulty = 'Easy' | 'Medium' | 'Hard';
export type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// FIXED: Bidirectional difficulty mapping
export const DIFFICULTY_MAPPING = {
    // UI to API
    'Easy': 'EASY' as const,
    'Medium': 'MEDIUM' as const,
    'Hard': 'HARD' as const,
    // API to UI
    'EASY': 'Easy' as const,
    'MEDIUM': 'Medium' as const,
    'HARD': 'Hard' as const
};

export interface QuestionData {
    id: string;
    question: string;
    answer: string;
    difficulty?: UIDifficulty; // Keep UI format for backward compatibility
    source?: string;
    additionalInfo?: string;
    topic?: string;
}

export interface UserQuestion {
    id: string;
    question: string;
    answer: string;
    difficulty: UIDifficulty; // UI format
    topic?: string;
    source?: string;
    additionalInfo?: string;
    isUserCreated: boolean;
    creatorId?: string;
    createdAt: string;
}

// FIXED: Flexible types for different XML parsing methods
interface XMLQuestionFields {
    QuestionId?: string | number;
    Question?: string;
    Answer?: string;
    Sources?: string;
    Comments?: string;
    Topic?: string;
    dbid?: string | string[] | number;
    text?: string | string[];
    answer?: string | string[];
    sources?: string | string[] | { source: string | string[] }[];
    comments?: string | string[];
    topic?: string | string[];
    // Support for attribute-based parsing
    '@_QuestionId'?: string;
    '@_id'?: string;
    // Support for text nodes
    '#text'?: string;
    // Catch-all for any other properties
    [key: string]: any;
}

export class QuestionService {
    private static cache: { [key: string]: QuestionData[] } = {};
    private static readonly BASE_URL = 'https://db.chgk.info/xml/random';

    // FIXED: Minimal XMLParser configuration to avoid compatibility issues
    private static xmlParser = new XMLParser({});

    /**
     * FIXED: Get questions by difficulty with proper type handling
     */
    static async getQuestionsByDifficulty(
        difficulty: UIDifficulty | APIDifficulty,
        count: number = 10
    ): Promise<QuestionData[]> {
        // Normalize difficulty to UI format for internal processing
        const normalizedDifficulty = this.normalizeToUIDifficulty(difficulty);

        // Map difficulty to year ranges (more recent questions are typically easier)
        const yearRanges = {
            'Easy': '2018',    // Recent, easier questions
            'Medium': '2010',  // Somewhat older questions
            'Hard': '2000'     // Older, more challenging questions
        };

        // Fetch random questions from the appropriate year range
        return this.fetchRandomQuestions(count, yearRanges[normalizedDifficulty], normalizedDifficulty);
    }

    /**
     * FIXED: Normalize difficulty to UI format
     */
    private static normalizeToUIDifficulty(difficulty: UIDifficulty | APIDifficulty): UIDifficulty {
        if (difficulty === 'EASY' || difficulty === 'Easy') return 'Easy';
        if (difficulty === 'MEDIUM' || difficulty === 'Medium') return 'Medium';
        if (difficulty === 'HARD' || difficulty === 'Hard') return 'Hard';

        // Default fallback
        return 'Medium';
    }

    /**
     * FIXED: Convert UI difficulty to API difficulty
     */
    static convertToAPIDifficulty(difficulty: UIDifficulty): APIDifficulty {
        return DIFFICULTY_MAPPING[difficulty];
    }

    /**
     * FIXED: Convert API difficulty to UI difficulty
     */
    static convertToUIDifficulty(difficulty: APIDifficulty): UIDifficulty {
        return DIFFICULTY_MAPPING[difficulty];
    }

    /**
     * FIXED: Fetch random questions using React Native compatible HTTP and XML parsing
     */
    static async fetchRandomQuestions(
        count: number = 10,
        fromYear?: string,
        difficulty?: UIDifficulty
    ): Promise<QuestionData[]> {
        const cacheKey = `${difficulty || 'mixed'}_${count}_${fromYear || 'all'}`;

        // Return cached questions if available
        if (this.cache[cacheKey]) {
            console.log(`Returning ${this.cache[cacheKey].length} cached questions for ${difficulty}`);
            return this.cache[cacheKey];
        }

        try {
            // Build URL with parameters
            let url = `${this.BASE_URL}`;
            if (fromYear) {
                url += `/from_${fromYear}-01-01`;
            }
            url += `/limit${Math.max(count, 40)}/types1`; // Get more questions to ensure we have enough

            console.log(`Fetching questions from: ${url}`);

            // FIXED: Use fetch instead of axios for React Native compatibility
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const xmlText = await response.text();
            console.log('Received XML response, parsing...');

            // FIXED: Parse XML using fast-xml-parser with fallback
            let parsedData;
            try {
                parsedData = this.xmlParser.parse(xmlText);
                console.log('XML parsed successfully with fast-xml-parser');
            } catch (parseError) {
                console.warn('fast-xml-parser failed, trying regex fallback:', parseError);
                parsedData = this.parseXMLWithRegex(xmlText);
                console.log('XML parsed with regex fallback');
            }

            // Extract questions from parsed data with robust handling
            const questions: QuestionData[] = [];

            // Handle different response structures with type safety
            let questionArray: any[] = [];

            try {
                // Check for search results structure
                if (parsedData?.search?.question) {
                    questionArray = Array.isArray(parsedData.search.question)
                        ? parsedData.search.question
                        : [parsedData.search.question];
                }
                // Check for direct question array
                else if (parsedData?.question) {
                    questionArray = Array.isArray(parsedData.question)
                        ? parsedData.question
                        : [parsedData.question];
                }
                // Check for root level questions
                else if (Array.isArray(parsedData)) {
                    questionArray = parsedData;
                }
                // Handle case where parsedData itself is a single question
                else if (parsedData && (parsedData.Question || parsedData.question || parsedData.text)) {
                    questionArray = [parsedData];
                }

                console.log(`Found ${questionArray.length} question objects in parsed data`);
            } catch (structureError) {
                console.warn('Error analyzing parsed data structure:', structureError);
                questionArray = [];
            }

            // Process each question
            for (let i = 0; i < questionArray.length && questions.length < count; i++) {
                try {
                    const questionData = this.parseQuestionFromObject(questionArray[i]);

                    // Assign or classify difficulty
                    if (difficulty) {
                        questionData.difficulty = difficulty;
                    } else {
                        questionData.difficulty = await this.classifyQuestionDifficulty(
                            questionData.question,
                            questionData.answer
                        );
                    }

                    questions.push(questionData);
                } catch (error) {
                    console.warn(`Failed to parse question ${i}:`, error);
                    continue;
                }
            }

            console.log(`Successfully parsed ${questions.length} questions`);
            console.log(`Successfully parsed ${questions.pop()?.question} questions`);

            // If we couldn't get enough questions from the API, supplement with fallback
            if (questions.length < count) {
                console.log(`Only got ${questions.length} questions from API, supplementing with fallback questions`);
                const fallbackQuestions = this.getFallbackQuestions(count - questions.length, difficulty);
                questions.push(...fallbackQuestions);
            }

            // Cache the results
            this.cache[cacheKey] = questions.slice(0, count);
            return this.cache[cacheKey];

        } catch (error) {
            console.error('Error fetching questions from API:', error);

            // Return fallback questions on error
            console.log(`Returning ${count} fallback questions for ${difficulty}`);
            const fallbackQuestions = this.getFallbackQuestions(count, difficulty);
            this.cache[cacheKey] = fallbackQuestions;
            return fallbackQuestions;
        }
    }

    /**
     * Fallback XML parser using regex for basic question extraction
     */
    private static parseXMLWithRegex(xmlText: string): any {
        // Extract all question blocks
        const questionRegex = /<question[^>]*>(.*?)<\/question>/gs;
        const questions: any[] = [];
        let match;

        while ((match = questionRegex.exec(xmlText)) !== null) {
            const questionBlock = match[1];

            // Extract individual fields
            const extractField = (fieldName: string): string => {
                const fieldRegex = new RegExp(`<${fieldName}[^>]*>(.*?)<\/${fieldName}>`, 'is');
                const fieldMatch = questionBlock.match(fieldRegex);
                return fieldMatch ? fieldMatch[1].trim() : '';
            };

            // Try different field name variations
            const question = extractField('Question') || extractField('text');
            const answer = extractField('Answer') || extractField('answer');
            const sources = extractField('Sources') || extractField('sources');
            const comments = extractField('Comments') || extractField('comments');
            const topic = extractField('Topic') || extractField('topic');

            // Extract ID from attributes or tags
            let id = '';
            const idAttrMatch = match[0].match(/QuestionId\s*=\s*["']([^"']+)["']/i);
            if (idAttrMatch) {
                id = idAttrMatch[1];
            } else {
                const idTagMatch = questionBlock.match(/<(?:QuestionId|dbid)[^>]*>(.*?)<\/(?:QuestionId|dbid)>/i);
                if (idTagMatch) {
                    id = idTagMatch[1].trim();
                }
            }

            if (question && answer) {
                questions.push({
                    QuestionId: id || `q_${Date.now()}_${Math.random()}`,
                    Question: question,
                    Answer: answer,
                    Sources: sources,
                    Comments: comments,
                    Topic: topic
                });
            }
        }

        // Return in expected format
        if (questions.length > 0) {
            return {
                search: {
                    question: questions.length === 1 ? questions[0] : questions
                }
            };
        }

        return { search: { question: [] } };
    }

    /**
     * FIXED: Parse question data from parsed XML object with safe property access
     */
    private static parseQuestionFromObject(questionObj: any): QuestionData {
        // Helper function to safely extract string values
        const getString = (value: any): string => {
            if (!value) return '';
            if (typeof value === 'string') return this.cleanText(value);
            if (typeof value === 'object' && value['#text']) return this.cleanText(value['#text']);
            if (Array.isArray(value) && value.length > 0) return this.cleanText(String(value[0]));
            return this.cleanText(String(value));
        };

        // Extract ID with fallback
        const id = getString(questionObj.QuestionId || questionObj['@_QuestionId'] || questionObj.dbid || questionObj['@_id']) || `q_${Date.now()}_${Math.random()}`;

        // Extract question text
        const question = getString(questionObj.Question || questionObj.text) || '';

        // Extract answer text
        const answer = getString(questionObj.Answer || questionObj.answer) || '';

        // Extract source with complex handling
        let source = '';
        if (questionObj.Sources) {
            source = getString(questionObj.Sources);
        } else if (questionObj.sources) {
            if (typeof questionObj.sources === 'string') {
                source = getString(questionObj.sources);
            } else if (Array.isArray(questionObj.sources)) {
                const firstSource = questionObj.sources[0];
                if (typeof firstSource === 'object' && firstSource.source) {
                    source = getString(firstSource.source);
                } else {
                    source = getString(firstSource);
                }
            } else if (typeof questionObj.sources === 'object' && questionObj.sources.source) {
                source = getString(questionObj.sources.source);
            }
        }

        // Validate required fields
        if (!question || !answer) {
            throw new Error(`Missing required fields: Q="${question}" A="${answer}"`);
        }

        return {
            id,
            question,
            answer,
            source: source || undefined,
            additionalInfo: getString(questionObj.Comments || questionObj.comments),
            topic: getString(questionObj.Topic || questionObj.topic)
        };
    }

    /**
     * Get fallback questions when API is unavailable
     */
    private static getFallbackQuestions(
        count: number,
        difficulty?: UIDifficulty
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
                {
                    id: 'e6',
                    question: "What is the largest ocean on Earth?",
                    answer: "Pacific Ocean",
                    difficulty: 'Easy' as const
                },
                {
                    id: 'e7',
                    question: "How many sides does a triangle have?",
                    answer: "Three",
                    difficulty: 'Easy' as const
                },
                {
                    id: 'e8',
                    question: "What do bees produce?",
                    answer: "Honey",
                    difficulty: 'Easy' as const
                }
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
                {
                    id: 'm6',
                    question: "Which war was fought between 1914 and 1918?",
                    answer: "World War I",
                    difficulty: 'Medium' as const
                },
                {
                    id: 'm7',
                    question: "What is the capital of Australia?",
                    answer: "Canberra",
                    difficulty: 'Medium' as const
                },
                {
                    id: 'm8',
                    question: "Who painted 'The Starry Night'?",
                    answer: "Vincent van Gogh",
                    difficulty: 'Medium' as const
                }
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
                {
                    id: 'h6',
                    question: "In which year was the Battle of Hastings fought?",
                    answer: "1066",
                    difficulty: 'Hard' as const
                },
                {
                    id: 'h7',
                    question: "What is the longest river in Asia?",
                    answer: "Yangtze River",
                    difficulty: 'Hard' as const
                },
                {
                    id: 'h8',
                    question: "Who developed the theory of evolution by natural selection?",
                    answer: "Charles Darwin",
                    difficulty: 'Hard' as const
                }
            ]
        };

        // Return questions matching the requested difficulty, or mix if not specified
        if (difficulty && fallbackQuestions[difficulty]) {
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
     * Clean text content by removing HTML tags and normalizing whitespace
     */
    private static cleanText(text: string): string {
        if (!text) return '';

        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&quot;/g, '"') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Classify question difficulty using AI or fallback logic
     */
    private static async classifyQuestionDifficulty(
        question: string,
        answer: string
    ): Promise<UIDifficulty> {
        try {
            // Try to use DeepSeek AI classification if available
            if (typeof DeepSeekHostService?.classifyQuestionDifficulty === 'function') {
                return await DeepSeekHostService.classifyQuestionDifficulty(question, answer);
            }
        } catch (error) {
            console.warn('AI classification failed, using fallback logic:', error);
        }

        // Fallback classification based on answer characteristics
        const answerLength = answer.length;
        const questionLength = question.length;

        // Simple heuristic classification
        if (answerLength <= 10 && questionLength <= 50) {
            return 'Easy';
        } else if (answerLength >= 25 || questionLength >= 100) {
            return 'Hard';
        } else {
            return 'Medium';
        }
    }

    /**
     * Get user questions (placeholder - should integrate with actual user question API)
     */
    static async getUserQuestions(): Promise<UserQuestion[]> {
        // This should integrate with your actual user questions API
        // For now, return empty array
        return [];
    }

    /**
     * Clear the question cache
     */
    static clearCache(): void {
        this.cache = {};
        console.log('Question cache cleared');
    }

    /**
     * FIXED: Helper method to get questions with API-compatible difficulty format
     */
    static async getQuestionsWithAPIDifficulty(
        difficulty: APIDifficulty,
        count: number = 10
    ): Promise<QuestionData[]> {
        const uiDifficulty = this.convertToUIDifficulty(difficulty);
        return this.getQuestionsByDifficulty(uiDifficulty, count);
    }
}