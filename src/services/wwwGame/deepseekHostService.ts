// src/services/wwwGame/deepseekHostService.ts
import {Platform} from 'react-native';

/**
 * Configuration for the DeepSeek AI Host Service
 */
export interface DeepSeekHostConfig {
    apiKey: string | null;      // DeepSeek API key
    model: string;              // Model to use (e.g., "deepseek-chat")
    fallbackToLocal: boolean;   // Whether to use local methods if API fails
    language: string;           // Language for prompts and responses
    temperature: number;        // Temperature for generation (0.0-1.0)
    maxTokens: number;          // Maximum tokens to generate
}

/**
 * Response structure from discussion analysis
 */
export interface DiscussionAnalysisResponse {
    correctAnswerMentioned: boolean;
    bestGuesses: string[];
    analysis: string;
    confidence: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: DeepSeekHostConfig = {
    apiKey: null,
    model: 'deepseek-chat',
    fallbackToLocal: true,
    language: 'en',
    temperature: 0.7,
    maxTokens: 200
};

/**
 * DeepSeek based AI Host Service for the What? Where? When? game
 */
export class DeepSeekHostService {
    private static config: DeepSeekHostConfig = { ...DEFAULT_CONFIG };
    private static isInitialized: boolean = false;

    /**
     * Initialize the DeepSeek Host service
     */
    static initialize(config: Partial<DeepSeekHostConfig> = {}): void {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.isInitialized = true;

        if (!this.config.apiKey) {
            console.warn('DeepSeekHostService: No API key provided. The service will use local fallbacks only.');
        } else {
            console.log('DeepSeekHostService initialized with model:', this.config.model);
        }
    }

    /**
     * Get whether the service is initialized
     */
    static getIsInitialized(): boolean {
        return this.isInitialized;
    }

    /**
     * Update configuration
     */
    static updateConfig(config: Partial<DeepSeekHostConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    static getConfig(): DeepSeekHostConfig {
        return { ...this.config };
    }

    /**
     * Core function to call DeepSeek API
     */
    private static async callDeepSeekAPI(messages: any[], options: any = {}): Promise<string> {
        if (!this.isInitialized) {
            throw new Error('DeepSeekHostService is not initialized. Call DeepSeekHostService.initialize() first.');
        }

        if (!this.config.apiKey) {
            throw new Error('No API key provided. Please set a valid API key.');
        }

        const {
            model = this.config.model,
            temperature = this.config.temperature,
            max_tokens = this.config.maxTokens,
            stream = false,
            ...otherOptions
        } = options;

        const url = 'https://api.deepseek.com/chat/completions';
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
        };

        const body = JSON.stringify({
            model: model,
            messages: messages,
            stream: stream,
            temperature: temperature,
            max_tokens: max_tokens,
            ...otherOptions,
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
            }

            const data = await response.json();

            if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
                throw new Error('Invalid response format from DeepSeek API');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling DeepSeek API:', error);
            throw error;
        }
    }

    /**
     * Validate if a user's answer is semantically equivalent to the correct answer
     * Uses DeepSeek AI to check for synonyms, paraphrases, and equivalent meanings
     */
    static async validateAnswerWithAi(
        userAnswer: string,
        correctAnswer: string,
        language: string = 'en'
    ): Promise<{
        equivalent: boolean;
        confidence: number;
        explanation: string;
        aiUsed: boolean;
    }> {
        if (!userAnswer || !correctAnswer) {
            return { equivalent: false, confidence: 0, explanation: '', aiUsed: false };
        }

        try {
            const messages = [
                {
                    role: "system",
                    content: `You are an answer validation assistant for a quiz game. Compare the user's answer with the correct answer. Determine if they are semantically equivalent (synonyms, same meaning, different wording, abbreviations, translations between languages). Respond ONLY with JSON: {"equivalent": true/false, "confidence": 0.0-1.0, "explanation": "brief reason"}`
                },
                {
                    role: "user",
                    content: `Correct answer: "${correctAnswer}"
User's answer: "${userAnswer}"
Language context: ${language}

Are these answers semantically equivalent?`
                }
            ];

            try {
                // Call the DeepSeek API
                const responseContent = await this.callDeepSeekAPI(messages, {
                    temperature: 0.1,
                    max_tokens: 100,
                    response_format: { type: "json_object" }
                });

                // Parse the JSON response
                const parsedResponse = JSON.parse(responseContent);
                
                return {
                    equivalent: !!parsedResponse.equivalent,
                    confidence: typeof parsedResponse.confidence === 'number' ? parsedResponse.confidence : 0,
                    explanation: parsedResponse.explanation || '',
                    aiUsed: true
                };
            } catch (apiError) {
                console.error('DeepSeek API error for answer validation:', apiError);
                return { equivalent: false, confidence: 0, explanation: '', aiUsed: false };
            }
        } catch (error) {
            console.error('Error in AI answer validation:', error);
            return { equivalent: false, confidence: 0, explanation: '', aiUsed: false };
        }
    }

    /**
     * Analyze team discussion using DeepSeek
     * @param discussionText The transcription of the team's discussion
     * @param correctAnswer The correct answer to the question
     */
    static async analyzeDiscussion(
        discussionText: string,
        correctAnswer: string
    ): Promise<DiscussionAnalysisResponse> {
        if (!discussionText || !correctAnswer) {
            return this.getDefaultAnalysisResponse();
        }

        try {
            // Create the messages for DeepSeek API
            const messages = [
                {
                    role: "system",
                    content: `You are an AI host for a "What? Where? When?" trivia game. Your task is to analyze the team's discussion, which has been transcribed from speech. 
        
        Analyze to determine:
        1. If they mentioned the correct answer or something very close to it
        2. What their best guesses were
        3. How confident they seemed in their answers
        4. How well they collaborated during the discussion
        
        Respond with a JSON object structured as follows:
        {
          "correctAnswerMentioned": boolean,
          "bestGuesses": string[],
          "analysis": string,
          "confidence": number
        }`
                },
                {
                    role: "user",
                    content: `Team discussion transcript: "${discussionText}"

Correct answer: "${correctAnswer}"

Did the team mention the correct answer or something very close to it? Extract their best guesses and analyze their discussion.`
                }
            ];

            try {
                // Call the DeepSeek API
                const responseContent = await this.callDeepSeekAPI(messages, {
                    temperature: 0.3,
                    max_tokens: 300
                });

                // Parse the JSON response
                try {
                    const parsedResponse = JSON.parse(responseContent);
                    return {
                        correctAnswerMentioned: !!parsedResponse.correctAnswerMentioned,
                        bestGuesses: Array.isArray(parsedResponse.bestGuesses) ? parsedResponse.bestGuesses : [],
                        analysis: parsedResponse.analysis || 'No analysis provided',
                        confidence: typeof parsedResponse.confidence === 'number'
                            ? parsedResponse.confidence
                            : 0.7
                    };
                } catch (parseError) {
                    console.error('Failed to parse DeepSeek response:', parseError);
                    throw new Error('Invalid response format from DeepSeek');
                }
            } catch (apiError) {
                // If API call fails and fallback is enabled, use local analysis
                if (this.config.fallbackToLocal) {
                    console.log('Falling back to local discussion analysis');
                    return this.localAnalyzeDiscussion(discussionText, correctAnswer);
                }
                throw apiError;
            }
        } catch (error) {
            console.error('Error in DeepSeek discussion analysis:', error);
            return this.getDefaultAnalysisResponse();
        }
    }

    /**
     * Generate a hint for the current question using DeepSeek
     */
    static async generateHint(
        question: string,
        correctAnswer: string,
        difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
        previousHints: string[] = []
    ): Promise<string> {
        if (!question || !correctAnswer) {
            return this.localGenerateHint(correctAnswer, difficulty);
        }

        try {
            // Create hint generation prompt based on difficulty
            let hintInstructions = '';

            switch (difficulty) {
                case 'EASY':
                    hintInstructions = `Provide a fairly obvious hint that gives clear direction without directly revealing the answer. The player should be able to easily identify the answer with this hint.`;
                    break;
                case 'MEDIUM':
                    hintInstructions = `Provide a moderately helpful hint that points in the right direction without making the answer too obvious. The player should need to think a bit to identify the answer.`;
                    break;
                case 'HARD':
                    hintInstructions = `Provide a subtle hint that requires significant thought to connect to the answer. The hint should be challenging but fair.`;
                    break;
            }

            // Add context about any previous hints
            let previousHintsContext = '';
            if (previousHints.length > 0) {
                previousHintsContext = `Previous hints provided: ${previousHints.join(', ')}. Provide a different hint that gives new information.`;
            }

            const messages = [
                {
                    role: "system",
                    content: `You are an AI host for a "What? Where? When?" trivia game. You need to provide helpful hints without giving away the answer completely.
          
          ${hintInstructions}
          
          ${previousHintsContext}
          
          Keep your hint concise, in a single sentence if possible. Do not include phrases like "Hint:" or "Here's a hint:" in your response.`
                },
                {
                    role: "user",
                    content: `Question: "${question}"
          Correct answer: "${correctAnswer}"
          
          Provide a ${difficulty.toLowerCase()} difficulty hint.`
                }
            ];

            try {
                // Call the DeepSeek API
                const hint = await this.callDeepSeekAPI(messages, {
                    temperature: 0.7,
                    max_tokens: 100
                });

                if (!hint) {
                    throw new Error('Empty hint from DeepSeek');
                }

                return hint;
            } catch (apiError) {
                // If API call fails and fallback is enabled, use local hint generation
                if (this.config.fallbackToLocal) {
                    console.log('Falling back to local hint generation');
                    return this.localGenerateHint(correctAnswer, difficulty);
                }
                throw apiError;
            }
        } catch (error) {
            console.error('Error generating hint with DeepSeek:', error);
            return this.localGenerateHint(correctAnswer, difficulty);
        }
    }

    /**
     * Generate comprehensive game feedback using DeepSeek
     */
    static async generateGameFeedback(
        teamName: string,
        correctAnswers: number,
        totalQuestions: number,
        playerPerformances: Array<{ player: string, correct: number, total: number }>,
        questionData: Array<{
            question: string,
            correctAnswer: string,
            teamAnswer: string,
            isCorrect: boolean
        }>
    ): Promise<string> {
        try {
            // Calculate success rate
            const successRate = Math.round((correctAnswers / totalQuestions) * 100);

            // Prepare player performance data
            const playerStats = playerPerformances.map(p =>
                `${p.player}: ${p.correct}/${p.total} correct (${Math.round((p.correct/p.total)*100)}%)`
            ).join('\n');

            // Prepare question data
            const questionList = questionData.map(q =>
                `Q: ${q.question}\nCorrect: ${q.correctAnswer}\nTeam answered: ${q.teamAnswer}\nResult: ${q.isCorrect ? 'Correct' : 'Incorrect'}`
            ).join('\n\n');

            const messages = [
                {
                    role: "system",
                    content: `You are an AI host for a "What? Where? When?" trivia game. Your task is to provide comprehensive, encouraging feedback about the team's performance. 
          
          Include:
          1. Overall assessment of their performance
          2. Recognition of the strongest player(s)
          3. Identification of knowledge areas they struggled with
          4. Specific encouragement based on their results
          5. Light-hearted, supportive tone
          
          Keep your feedback to 4-5 sentences, focused and concise.`
                },
                {
                    role: "user",
                    content: `Team: "${teamName}"
          Overall score: ${correctAnswers}/${totalQuestions} (${successRate}%)
          
          Player performances:
          ${playerStats}
          
          Question details:
          ${questionList}
          
          Please provide encouraging feedback about our team's performance.`
                }
            ];

            try {
                // Call the DeepSeek API
                const feedback = await this.callDeepSeekAPI(messages, {
                    temperature: 0.7,
                    max_tokens: 300
                });

                if (!feedback) {
                    throw new Error('Empty feedback from DeepSeek');
                }

                return feedback;
            } catch (apiError) {
                // If API call fails and fallback is enabled, use local feedback generation
                if (this.config.fallbackToLocal) {
                    return this.localGenerateGameFeedback(
                        correctAnswers,
                        totalQuestions,
                        playerPerformances,
                        questionData.filter(q => !q.isCorrect)
                    );
                }
                throw apiError;
            }
        } catch (error) {
            console.error('Error generating game feedback with DeepSeek:', error);

            // Basic fallback message
            return this.localGenerateGameFeedback(
                correctAnswers,
                totalQuestions,
                playerPerformances,
                questionData.filter(q => !q.isCorrect)
            );
        }
    }

    /**
     * Classify question difficulty using DeepSeek
     */
    static async classifyQuestionDifficulty(
        question: string,
        answer: string
    ): Promise<'EASY' | 'MEDIUM' | 'HARD'> {
        try {
            const messages = [
                {
                    role: "system",
                    content: `You are an expert at classifying trivia questions by difficulty. 
          Classify the following question as either EASY, MEDIUM, or HARD based on:
          - EASY: Common knowledge, simple facts, popular culture, straightforward answers
          - MEDIUM: Requires some specific knowledge or reasoning
          - HARD: Requires specialized knowledge, complex reasoning, or obscure facts
          
          Reply with only one word: EASY, MEDIUM, or HARD.`
                },
                {
                    role: "user",
                    content: `Question: "${question}"
          Answer: "${answer}"
          
          Difficulty:`
                }
            ];

            try {
                // Call the DeepSeek API
                const result = await this.callDeepSeekAPI(messages, {
                    temperature: 0.3,
                    max_tokens: 10
                });

                if (result?.toUpperCase().includes('EASY')) {
                    return 'EASY';
                } else if (result?.toUpperCase().includes('MEDIUM')) {
                    return 'MEDIUM';
                } else if (result?.toUpperCase().includes('HARD')) {
                    return 'HARD';
                } else {
                    return 'MEDIUM'; // Default to MEDIUM if classification fails
                }
            } catch (apiError) {
                // Simple fallback
                if (answer.length <= 15) {
                    return 'EASY';
                } else if (answer.length >= 30) {
                    return 'HARD';
                } else {
                    return 'MEDIUM';
                }
            }
        } catch (error) {
            console.error('Error classifying question difficulty with DeepSeek:', error);

            // Simple fallback based on answer length if DeepSeek classification fails
            if (answer.length <= 15) {
                return 'EASY';
            } else if (answer.length >= 30) {
                return 'HARD';
            } else {
                return 'MEDIUM';
            }
        }
    }

    /**
     * Generate introduction for a question
     */
    static async generateQuestionIntroduction(
        question: string,
        difficulty: 'EASY' | 'MEDIUM' | 'HARD',
        roundNumber: number,
        totalRounds: number
    ): Promise<string> {
        try {
            const messages = [
                {
                    role: "system",
                    content: `You are the host of a "What? Where? When?" intellectual game show. 
          Create a brief, engaging introduction for the following question. 
          Your introduction should:
          1. Be conversational and enthusiastic
          2. Not reveal any hints to the answer
          3. Be appropriate for the difficulty level
          4. Be concise (1-2 sentences maximum)
          
          Do not repeat the question itself in your introduction, as I will add it separately.`
                },
                {
                    role: "user",
                    content: `Question: "${question}"
          Difficulty: ${difficulty}
          This is question ${roundNumber} of ${totalRounds}.
          
          Please provide a brief introduction:`
                }
            ];

            try {
                // Call the DeepSeek API
                const intro = await this.callDeepSeekAPI(messages, {
                    temperature: 0.7,
                    max_tokens: 100
                });

                if (!intro) {
                    throw new Error('Empty introduction from DeepSeek');
                }

                // Combine introduction with the question
                return `${intro}\n\nQuestion ${roundNumber} of ${totalRounds}: ${question}`;
            } catch (apiError) {
                // Simple fallback introduction if DeepSeek fails
                return `Let's move on to question ${roundNumber} of ${totalRounds}. ${question}`;
            }
        } catch (error) {
            console.error('Error generating question introduction with DeepSeek:', error);

            // Simple fallback introduction if DeepSeek fails
            return `Let's move on to question ${roundNumber} of ${totalRounds}. ${question}`;
        }
    }

    /**
     * Analyze live team discussion with real-time feedback
     * This could be used during the discussion phase to give live hints
     */
    static async analyzeLiveDiscussion(
        discussionFragment: string,
        question: string,
        correctAnswer: string,
        timeRemaining: number
    ): Promise<string | null> {
        // Only provide live feedback if there's sufficient discussion and time
        if (discussionFragment.length < 30 || timeRemaining < 15) {
            return null;
        }

        try {
            const messages = [
                {
                    role: "system",
                    content: `You are an AI host for a "What? Where? When?" trivia game. The team is currently discussing their answer. 
          
          Provide very brief, helpful guidance if:
          1. They seem to be on completely the wrong track
          2. They've mentioned the correct answer but dismissed it
          3. They're missing an important insight
          
          Otherwise, return null to avoid interrupting their flow. Keep any feedback to one short sentence.`
                },
                {
                    role: "user",
                    content: `Question: "${question}"
          Correct answer: "${correctAnswer}"
          Time remaining: ${timeRemaining} seconds
          
          Current discussion fragment: "${discussionFragment}"
          
          Should I provide feedback to guide the team? If yes, what feedback? If no, respond with "null".`
                }
            ];

            try {
                // Call the DeepSeek API
                const feedback = await this.callDeepSeekAPI(messages, {
                    temperature: 0.4,
                    max_tokens: 60
                });

                // Don't provide feedback if the AI returns null or similar
                if (!feedback || feedback.toLowerCase() === 'null' || feedback.toLowerCase() === 'no') {
                    return null;
                }

                return feedback;
            } catch (error) {
                console.error('Error in live discussion analysis:', error);
                return null;
            }
        } catch (error) {
            console.error('Error in live discussion analysis:', error);
            return null;
        }
    }

    // ========== Local fallback implementations ==========

    /**
     * Local fallback for discussion analysis
     */
    private static localAnalyzeDiscussion(
        discussionText: string,
        correctAnswer: string
    ): DiscussionAnalysisResponse {
        const lowerDiscussion = discussionText.toLowerCase();
        const lowerAnswer = correctAnswer.toLowerCase();

        // Check if the exact answer is mentioned
        const exactMatch = lowerDiscussion.includes(lowerAnswer);

        // Check for partial matches (words from the answer)
        const answerWords = lowerAnswer.split(' ');
        const partialMatches = answerWords.filter(word =>
            word.length > 3 && lowerDiscussion.includes(word)
        );

        // Extract potential guesses based on common phrases
        const guessIndicators = [
            'I think', 'maybe', 'could be', 'perhaps',
            'the answer is', 'what if', 'possibly'
        ];

        const bestGuesses: string[] = [];

        // Split by sentences or phrases
        const sentences = discussionText.split(/[.!?]|\n/);

        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase().trim();

            // Check if sentence contains a guess indicator
            for (const indicator of guessIndicators) {
                if (lowerSentence.includes(indicator)) {
                    // Extract the part after the indicator as a potential guess
                    const parts = lowerSentence.split(indicator);
                    if (parts.length > 1) {
                        const guess = parts[1].trim().replace(/[,;:].*$/, '');
                        if (guess.length > 0 && !bestGuesses.includes(guess)) {
                            bestGuesses.push(guess);
                        }
                    }
                }
            }
        });

        // Limit the number of best guesses
        const limitedGuesses = bestGuesses.slice(0, 3);

        // Generate analysis
        let analysis = '';
        if (exactMatch) {
            analysis = `The team explicitly mentioned the correct answer "${correctAnswer}" during their discussion.`;
        } else if (partialMatches.length > 0) {
            analysis = `The team mentioned parts of the correct answer, including: ${partialMatches.join(', ')}.`;
        } else if (limitedGuesses.length > 0) {
            analysis = `The team discussed several possible answers but did not mention the correct one. Their main guesses were: ${limitedGuesses.join(', ')}.`;
        } else {
            analysis = `The team's discussion did not include the correct answer or any close alternatives.`;
        }

        return {
            correctAnswerMentioned: exactMatch || (partialMatches.length === answerWords.length),
            bestGuesses: limitedGuesses,
            analysis,
            confidence: 0.6  // Lower confidence for local analysis
        };
    }

    /**
     * Default response for analysis when there's an error
     */
    private static getDefaultAnalysisResponse(): DiscussionAnalysisResponse {
        return {
            correctAnswerMentioned: false,
            bestGuesses: [],
            analysis: 'Unable to analyze the discussion.',
            confidence: 0
        };
    }

    /**
     * Local fallback for hint generation
     */
    private static localGenerateHint(
        correctAnswer: string,
        difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    ): string {
        // Basic hints that reveal more based on difficulty
        const words = correctAnswer.split(' ');
        const totalChars = correctAnswer.length;

        switch (difficulty) {
            case 'EASY':
                // For easy, give first letters and word count
                const firstLetters = words.map(word => word[0]).join('');
                return `The answer begins with "${firstLetters}" and has ${words.length} word${words.length !== 1 ? 's' : ''}.`;

            case 'MEDIUM':
                // For medium, give character count and word count
                return `The answer has ${totalChars} characters in ${words.length} word${words.length !== 1 ? 's' : ''}.`;

            case 'HARD':
                // For hard, just give basic structure
                if (words.length > 1) {
                    return `The answer is a ${words.length}-word term.`;
                } else {
                    return `The answer is a single word with ${totalChars} letters.`;
                }

            default:
                return `The answer contains ${totalChars} characters.`;
        }
    }

    /**
     * Local fallback for game feedback generation
     */
    private static localGenerateGameFeedback(
        correctAnswers: number,
        totalQuestions: number,
        playerPerformances: Array<{ player: string, correct: number, total: number }>,
        incorrectQuestions: Array<{ question: string, correctAnswer: string }>
    ): string {
        const correctPercentage = (correctAnswers / totalQuestions) * 100;
        let feedback = '';

        // Start with overall performance
        if (correctPercentage >= 80) {
            feedback += `Excellent performance! Your team correctly answered ${correctAnswers} out of ${totalQuestions} questions. `;
        } else if (correctPercentage >= 60) {
            feedback += `Good job! Your team correctly answered ${correctAnswers} out of ${totalQuestions} questions. `;
        } else if (correctPercentage >= 40) {
            feedback += `Nice effort! Your team correctly answered ${correctAnswers} out of ${totalQuestions} questions. `;
        } else {
            feedback += `Your team answered ${correctAnswers} out of ${totalQuestions} questions correctly. Keep practicing! `;
        }

        // Add best player feedback if available
        if (playerPerformances.length > 0) {
            // Sort by correct answers descending
            const sortedPlayers = [...playerPerformances].sort((a, b) => b.correct - a.correct);
            const bestPlayer = sortedPlayers[0];

            if (bestPlayer.correct > 0) {
                feedback += `${bestPlayer.player} was your strongest player, answering ${bestPlayer.correct} out of ${bestPlayer.total} questions correctly. `;
            }
        }

        // Add feedback about incorrect questions
        if (incorrectQuestions.length > 0 && incorrectQuestions.length < totalQuestions) {
            // Extract topics from questions (simple approach)
            const topics = incorrectQuestions.map(q => {
                const words = q.question.split(' ');
                return words.length > 3 ? words.slice(1, 4).join(' ') : q.question.substring(0, 15);
            }).slice(0, 3);

            feedback += `Your team could improve knowledge in these areas: ${topics.join(', ')}. `;
        }

        // Add encouraging ending
        feedback += 'Remember, every game is a learning opportunity!';

        return feedback;
    }

    /**
     * Check if the platform supports speech recognition
     */
    static isVoiceRecognitionAvailable(): boolean {
        // This should be replaced with actual platform-specific checks
        return Platform.OS === 'ios' || Platform.OS === 'android';
    }
}