// src/features/www-game-discussion/lib/deepseekService.ts
import {DiscussionAnalysisResult} from '../model/types';

export interface DeepSeekHostConfig {
    apiKey: string | null;
    model: string;
    fallbackToLocal: boolean;
    language: string;
    temperature: number;
    maxTokens: number;
}

const DEFAULT_CONFIG: DeepSeekHostConfig = {
    apiKey: null,
    model: 'deepseek-chat',
    fallbackToLocal: true,
    language: 'en',
    temperature: 0.7,
    maxTokens: 200
};

export class DeepSeekHostService {
    private static config: DeepSeekHostConfig = { ...DEFAULT_CONFIG };
    private static isInitialized: boolean = false;

    static initialize(config: Partial<DeepSeekHostConfig> = {}): void {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.isInitialized = true;

        if (!this.config.apiKey) {
            console.warn('DeepSeekHostService: No API key provided. Using local fallbacks only.');
        }
    }

    static async analyzeDiscussion(
        question: string,
        correctAnswer: string,
        discussionNotes: string,
        audioTranscript?: string
    ): Promise<DiscussionAnalysisResult> {
        if (!this.isInitialized) {
            console.warn('DeepSeekHostService not initialized. Using fallback analysis.');
            return this.fallbackAnalysis(question, correctAnswer, discussionNotes);
        }

        try {
            if (this.config.apiKey) {
                return await this.callDeepSeekAPI(question, correctAnswer, discussionNotes, audioTranscript);
            } else {
                return this.fallbackAnalysis(question, correctAnswer, discussionNotes);
            }
        } catch (error) {
            console.error('DeepSeek API error, using fallback:', error);
            return this.fallbackAnalysis(question, correctAnswer, discussionNotes);
        }
    }

    static async classifyQuestionDifficulty(
        question: string,
        answer: string
    ): Promise<'Easy' | 'Medium' | 'Hard'> {
        if (!this.config.apiKey || !this.isInitialized) {
            return this.fallbackDifficultyClassification(question, answer);
        }

        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert at classifying trivia question difficulty. Respond with only: Easy, Medium, or Hard.'
                },
                {
                    role: 'user',
                    content: `Classify this question's difficulty:\nQuestion: ${question}\nAnswer: ${answer}`
                }
            ];

            const response = await this.callDeepSeekAPI(messages);
            const difficulty = response.trim() as 'Easy' | 'Medium' | 'Hard';

            if (['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                return difficulty;
            } else {
                return this.fallbackDifficultyClassification(question, answer);
            }
        } catch (error) {
            return this.fallbackDifficultyClassification(question, answer);
        }
    }

    private static async callDeepSeekAPI(
        question: string,
        correctAnswer: string,
        discussionNotes: string,
        audioTranscript?: string
    ): Promise<DiscussionAnalysisResult>;
    private static async callDeepSeekAPI(messages: any[]): Promise<string>;
    private static async callDeepSeekAPI(...args: any[]): Promise<any> {
        if (!this.config.apiKey) {
            throw new Error('No API key configured');
        }

        let messages: any[];

        if (args.length === 1 && Array.isArray(args[0])) {
            // Direct messages format
            messages = args[0];
        } else {
            // Discussion analysis format
            const [question, correctAnswer, discussionNotes, audioTranscript] = args;

            const systemPrompt = `You are an expert game show host analyzing team discussions for "What? Where? When?" game. 
Analyze the team's discussion and provide insights about their reasoning process.
Return a JSON object with these fields:
- correctAnswerMentioned: boolean
- bestGuesses: string[] (top 3 potential answers mentioned)
- confidence: number (0-1, how confident the team seems)
- analysis: string (brief analysis of their discussion)
- suggestions: string[] (helpful hints for similar questions)
- keyTopics: string[] (main topics discussed)`;

            messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nTeam Discussion: ${discussionNotes}${audioTranscript ? `\nAudio Transcript: ${audioTranscript}` : ''}`
                }
            ];
        }

        // Simulate API call (replace with actual implementation)
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (args.length === 1) {
            return content; // Return raw string for simple requests
        } else {
            // Parse JSON response for discussion analysis
            try {
                return JSON.parse(content);
            } catch {
                // Fallback if JSON parsing fails
                return this.fallbackAnalysis(args[0], args[1], args[2]);
            }
        }
    }

    private static fallbackAnalysis(
        question: string,
        correctAnswer: string,
        discussionNotes: string
    ): DiscussionAnalysisResult {
        const lowercaseNotes = discussionNotes.toLowerCase();
        const lowercaseAnswer = correctAnswer.toLowerCase();

        // Check if correct answer was mentioned
        const correctAnswerMentioned = lowercaseNotes.includes(lowercaseAnswer);

        // Extract potential answers using simple regex
        const answerPatterns = [
            /(?:answer is|it's|it is|could be|maybe)\s+([^.!?\n]+)/gi,
            /(?:i think|i believe)\s+(?:it's|it is)?\s*([^.!?\n]+)/gi,
        ];

        const bestGuesses: string[] = [];
        answerPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(discussionNotes)) !== null) {
                const guess = match[1].trim();
                if (guess.length > 2 && guess.length < 100 && !bestGuesses.includes(guess)) {
                    bestGuesses.push(guess);
                }
            }
        });

        // Simple confidence calculation
        const hasSpecificGuesses = bestGuesses.length > 0;
        const mentionsCorrectAnswer = correctAnswerMentioned;
        const discussionLength = discussionNotes.length;

        let confidence = 0.3; // Base confidence
        if (hasSpecificGuesses) confidence += 0.3;
        if (mentionsCorrectAnswer) confidence += 0.4;
        if (discussionLength > 100) confidence += 0.1;

        // Extract key topics (simple keyword extraction)
        const keyTopics = this.extractKeywords(discussionNotes);

        return {
            correctAnswerMentioned,
            bestGuesses: bestGuesses.slice(0, 3),
            confidence: Math.min(1, confidence),
            analysis: this.generateAnalysisText(discussionNotes, correctAnswerMentioned, bestGuesses),
            suggestions: this.generateSuggestions(question, correctAnswer),
            keyTopics,
            speakerContributions: {}, // Not implemented in fallback
        };
    }

    private static fallbackDifficultyClassification(
        question: string,
        answer: string
    ): 'Easy' | 'Medium' | 'Hard' {
        const totalLength = question.length + answer.length;
        const wordCount = question.split(' ').length + answer.split(' ').length;

        // Simple heuristic classification
        if (answer.length <= 15 && wordCount < 30) {
            return 'Easy';
        } else if (totalLength > 500 || wordCount > 60) {
            return 'Hard';
        } else {
            return 'Medium';
        }
    }

    private static extractKeywords(text: string): string[] {
        const words = text.toLowerCase().split(/\W+/);
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

        const wordCounts: Record<string, number> = {};
        words.forEach(word => {
            if (word.length > 3 && !stopWords.includes(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });

        return Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }

    private static generateAnalysisText(
        notes: string,
        mentionedAnswer: boolean,
        guesses: string[]
    ): string {
        if (mentionedAnswer) {
            return 'Great discussion! The team mentioned the correct answer during their deliberation.';
        } else if (guesses.length > 0) {
            return `The team explored several possibilities: ${guesses.join(', ')}. Consider the reasoning behind each guess.`;
        } else {
            return 'The team discussion shows they are working through the problem. Encourage more specific reasoning.';
        }
    }

    private static generateSuggestions(question: string, answer: string): string[] {
        // Simple suggestion generation based on question type
        const suggestions = ['Break down the question into key components'];

        if (question.includes('when') || question.includes('date')) {
            suggestions.push('Consider historical context and timelines');
        }
        if (question.includes('where') || question.includes('location')) {
            suggestions.push('Think about geographical relationships');
        }
        if (question.includes('who') || question.includes('person')) {
            suggestions.push('Consider the person\'s field and time period');
        }

        suggestions.push('Discuss what you know about the topic');
        suggestions.push('Eliminate obviously incorrect options');

        return suggestions;
    }
}