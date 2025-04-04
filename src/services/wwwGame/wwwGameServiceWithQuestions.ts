// src/services/game/wwwGameServiceWithQuestions.ts
import {GameSettings, RoundData, WWWGameService} from './wwwGameService';
import {QuestionData, QuestionService} from './questionService';
import {DeepSeekHostService} from './deepseekHostService.ts';

/**
 * Extended game service that integrates with external question sources
 */
export class WWWGameServiceWithQuestions extends WWWGameService {
    /**
     * Initialize a new game with questions from an external source
     */
    static async initializeGameWithExternalQuestions(
        settings: GameSettings
    ): Promise<{
        gameQuestions: Array<{ question: string, answer: string }>,
        roundsData: RoundData[]
    }> {
        try {
            // Fetch questions based on difficulty
            const questions = await QuestionService.getQuestionsByDifficulty(
                settings.difficulty as 'Easy' | 'Medium' | 'Hard',
                settings.roundCount
            );

            // Convert to game format
            const gameQuestions = questions.map(q => ({
                question: q.question,
                answer: q.answer
            }));

            // Initialize rounds data structure
            const roundsData = gameQuestions.map(q => ({
                question: q.question,
                correctAnswer: q.answer,
                teamAnswer: '',
                isCorrect: false,
                playerWhoAnswered: '',
                discussionNotes: ''
            }));

            return { gameQuestions, roundsData };
        } catch (error) {
            console.error('Error fetching external questions:', error);

            // Fall back to default initialization if external source fails
            return super.initializeGame(settings);
        }
    }

    /**
     * Process speech input during the discussion phase
     * This method takes audio input, converts it to text, and updates the game state
     */
    static async processSpeechInput(
        audioBlob: Blob,
        currentDiscussionNotes: string,
        language: string = 'en-US'
    ): Promise<{
        transcribedText: string,
        updatedDiscussionNotes: string,
        shouldProvideHint: boolean,
        hint?: string
    }> {
        try {
            // This would use a speech-to-text service in a real implementation
            // For now, we'll simulate the transcription with GPT-4 if available

            // Convert audio to text (placeholder for actual speech-to-text implementation)
            let transcribedText = 'Simulated transcription: This would be the text from the speech-to-text service.';

            // In a real implementation, you would use a service like:
            // const transcribedText = await SpeechToTextService.transcribe(audioBlob, language);

            // Update discussion notes
            const updatedDiscussionNotes = currentDiscussionNotes
                ? `${currentDiscussionNotes}\n${transcribedText}`
                : transcribedText;

            // Determine if we should provide a hint based on the discussion
            let shouldProvideHint = false;
            let hint: string | undefined = undefined;

            // Use GPT-4 to analyze if a hint would be helpful
            // This is placeholder logic - real implementation would use GPT4HostService
            if (updatedDiscussionNotes.toLowerCase().includes('hint') ||
                updatedDiscussionNotes.toLowerCase().includes('help')) {
                shouldProvideHint = true;
                hint = 'This would be a contextualized hint from the AI host.';
            }

            return {
                transcribedText,
                updatedDiscussionNotes,
                shouldProvideHint,
                hint
            };
        } catch (error) {
            console.error('Error processing speech input:', error);

            // Return original notes if processing fails
            return {
                transcribedText: '',
                updatedDiscussionNotes: currentDiscussionNotes,
                shouldProvideHint: false
            };
        }
    }

    /**
     * Generate AI host introduction for a question
     */
    static async generateQuestionIntroduction(
        questionData: QuestionData,
        roundNumber: number,
        totalRounds: number
    ): Promise<string> {
        try {
            // Use GPT-4 to generate an engaging introduction
            return DeepSeekHostService.generateQuestionIntroduction(
                questionData.question,
                questionData.difficulty || 'Medium',
                roundNumber,
                totalRounds
            );
        } catch (error) {
            console.error('Error generating question introduction:', error);

            // Fallback to simple introduction
            return `Question ${roundNumber} of ${totalRounds}. ${questionData.question}`;
        }
    }

    /**
     * Process answer with voice response
     */
    static async processVoiceAnswer(
        roundsData: RoundData[],
        currentRound: number,
        audioAnswer: Blob,
        selectedPlayer: string,
        discussionNotes: string,
        language: string = 'en-US'
    ): Promise<{
        updatedRoundsData: RoundData[],
        isCorrect: boolean,
        transcribedAnswer: string,
        aiResponse: string
    }> {
        try {
            // Convert audio answer to text (placeholder)
            let transcribedAnswer = 'Simulated answer: This would be the answer from speech-to-text.';

            // In a real implementation:
            // const transcribedAnswer = await SpeechToTextService.transcribe(audioAnswer, language);

            // Process the answer using the base service
            const { updatedRoundsData, isCorrect } = super.processRoundAnswer(
                roundsData,
                currentRound,
                transcribedAnswer,
                selectedPlayer,
                discussionNotes
            );

            // Generate AI host response to the answer
            let aiResponse = '';

            if (isCorrect) {
                aiResponse = 'That\'s correct! Well done!';
            } else {
                aiResponse = `I'm sorry, that's not correct. The answer is "${roundsData[currentRound].correctAnswer}".`;

                // Add extra information if the correct answer was mentioned in the discussion
                const { correctAnswerMentioned } = await DeepSeekHostService.analyzeDiscussion(
                    discussionNotes,
                    roundsData[currentRound].correctAnswer
                );

                if (correctAnswerMentioned) {
                    aiResponse += ' Interestingly, I heard someone mention the correct answer during your discussion.';
                }
            }

            return {
                updatedRoundsData,
                isCorrect,
                transcribedAnswer,
                aiResponse
            };
        } catch (error) {
            console.error('Error processing voice answer:', error);

            // Fall back to text-based processing
            const { updatedRoundsData, isCorrect } = super.processRoundAnswer(
                roundsData,
                currentRound,
                'Fallback answer',
                selectedPlayer,
                discussionNotes
            );

            return {
                updatedRoundsData,
                isCorrect,
                transcribedAnswer: 'Error processing voice',
                aiResponse: isCorrect
                    ? 'That\'s correct!'
                    : `That's incorrect. The answer is "${roundsData[currentRound].correctAnswer}".`
            };
        }
    }

    /**
     * Prepare game session with themed questions
     */
    static async prepareGameWithTheme(
        settings: GameSettings,
        theme: string
    ): Promise<{
        gameQuestions: Array<{ question: string, answer: string }>,
        roundsData: RoundData[]
    }> {
        try {
            // Search for questions matching the theme
            const questions = await QuestionService.searchQuestions(
                theme,
                settings.roundCount,
                settings.difficulty as 'Easy' | 'Medium' | 'Hard'
            );

            // If we don't have enough themed questions, supplement with random ones
            if (questions.length < settings.roundCount) {
                const additionalQuestions = await QuestionService.getQuestionsByDifficulty(
                    settings.difficulty as 'Easy' | 'Medium' | 'Hard',
                    settings.roundCount - questions.length
                );

                questions.push(...additionalQuestions);
            }

            // Convert to game format
            const gameQuestions = questions.map(q => ({
                question: q.question,
                answer: q.answer
            }));

            // Initialize rounds data structure
            const roundsData = gameQuestions.map(q => ({
                question: q.question,
                correctAnswer: q.answer,
                teamAnswer: '',
                isCorrect: false,
                playerWhoAnswered: '',
                discussionNotes: ''
            }));

            return { gameQuestions, roundsData };
        } catch (error) {
            console.error('Error preparing themed game:', error);

            // Fall back to default game initialization
            return super.initializeGame(settings);
        }
    }
}

// Add method to GPT4HostService for generating question introductions
// This extends the GPT4HostService with a new capability
if (typeof DeepSeekHostService.generateQuestionIntroduction !== 'function') {
    DeepSeekHostService.generateQuestionIntroduction = async function(
        question: string,
        difficulty: 'Easy' | 'Medium' | 'Hard',
        roundNumber: number,
        totalRounds: number
    ): Promise<string> {
        try {
            // Make API request to GPT-4
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(this as any).config.apiKey}`
                },
                body: JSON.stringify({
                    model: (this as any).config.model || 'gpt-4',
                    messages: [
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
                    ],
                    temperature: 0.7,
                    max_tokens: 100
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const intro = data.choices?.[0]?.message?.content?.trim();

            if (!intro) {
                throw new Error('Empty introduction from GPT-4');
            }

            // Combine introduction with the question
            return `${intro}\n\nQuestion ${roundNumber} of ${totalRounds}: ${question}`;

        } catch (error) {
            console.error('Error generating question introduction with GPT-4:', error);

            // Simple fallback introduction if GPT-4 fails
            return `Let's move on to question ${roundNumber} of ${totalRounds}. ${question}`;
        }
    };
}