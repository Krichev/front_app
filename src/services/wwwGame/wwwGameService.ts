// src/services/game/wwwGameService.ts

// Define types for game data
import {QuestionData, UserQuestion} from "./questionService.ts";

export interface RoundData {
    question: string;
    correctAnswer: string;
    teamAnswer: string;
    isCorrect: boolean;
    playerWhoAnswered: string;
    discussionNotes: string;
}

export interface PlayerPerformance {
    player: string;
    total: number;
    correct: number;
    percentage: number;
}

export interface GameSettings {
    teamName: string;
    teamMembers: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    // Add these new properties:
    questionSource?: 'app' | 'user';
    userQuestions?: QuestionData[] | UserQuestion[];
    challengeId?: string; // Challenge ID for tracking
}

export type GamePhase = 'question' | 'discussion' | 'answer' | 'feedback';


// Questions database by difficulty
const QUESTIONS = {
    Easy: [
        {
            question: "Which planet is known as the Red Planet?",
            answer: "Mars"
        },
        {
            question: "What is the largest mammal in the world?",
            answer: "Blue Whale"
        },
        {
            question: "What is the capital of France?",
            answer: "Paris"
        },
        {
            question: "Which element has the chemical symbol 'O'?",
            answer: "Oxygen"
        },
        {
            question: "Which famous painting features a woman with a mysterious smile?",
            answer: "Mona Lisa"
        },
        {
            question: "How many sides does a hexagon have?",
            answer: "Six"
        },
        {
            question: "What is the main ingredient in guacamole?",
            answer: "Avocado"
        },
        {
            question: "Which animal is known as the 'King of the Jungle'?",
            answer: "Lion"
        },
        {
            question: "What is the tallest mountain in the world?",
            answer: "Mount Everest"
        },
        {
            question: "Which country is known as the Land of the Rising Sun?",
            answer: "Japan"
        },
        {
            question: "What is the largest ocean on Earth?",
            answer: "Pacific Ocean"
        },
        {
            question: "Who wrote 'Romeo and Juliet'?",
            answer: "William Shakespeare"
        },
        {
            question: "What is the name of the toy cowboy in Toy Story?",
            answer: "Woody"
        },
        {
            question: "How many continents are there on Earth?",
            answer: "Seven"
        },
        {
            question: "Which instrument has 88 keys?",
            answer: "Piano"
        }
    ],
    Medium: [
        {
            question: "Which scientist formulated the theory of relativity?",
            answer: "Albert Einstein"
        },
        {
            question: "What is the chemical symbol for gold?",
            answer: "Au"
        },
        {
            question: "In which year did the Chernobyl disaster occur?",
            answer: "1986"
        },
        {
            question: "Which novel begins with the line 'It was the best of times, it was the worst of times'?",
            answer: "A Tale of Two Cities"
        },
        {
            question: "What is the currency of Japan?",
            answer: "Yen"
        },
        {
            question: "Which planet has the Great Red Spot?",
            answer: "Jupiter"
        },
        {
            question: "Who painted 'Starry Night'?",
            answer: "Vincent van Gogh"
        },
        {
            question: "What is the capital of Argentina?",
            answer: "Buenos Aires"
        },
        {
            question: "Which mountain range separates Europe from Asia?",
            answer: "Ural Mountains"
        },
        {
            question: "What is the largest organ in the human body?",
            answer: "Skin"
        },
        {
            question: "Who discovered penicillin?",
            answer: "Alexander Fleming"
        },
        {
            question: "In mythology, who was the Greek god of the sea?",
            answer: "Poseidon"
        },
        {
            question: "What year did the Titanic sink?",
            answer: "1912"
        },
        {
            question: "Which band released the album 'Abbey Road'?",
            answer: "The Beatles"
        },
        {
            question: "What is the freezing point of water in Fahrenheit?",
            answer: "32 degrees"
        }
    ],
    Hard: [
        {
            question: "What is the smallest prime number greater than 100?",
            answer: "101"
        },
        {
            question: "Who authored the philosophical work 'Being and Nothingness'?",
            answer: "Jean-Paul Sartre"
        },
        {
            question: "What is the hardest natural substance on Earth?",
            answer: "Diamond"
        },
        {
            question: "Which composer wrote 'The Magic Flute'?",
            answer: "Wolfgang Amadeus Mozart"
        },
        {
            question: "What is the chemical formula for sulfuric acid?",
            answer: "H2SO4"
        },
        {
            question: "What is the world's oldest known city that's still inhabited?",
            answer: "Damascus"
        },
        {
            question: "What was the former name of Thailand until 1939?",
            answer: "Siam"
        },
        {
            question: "Which bird has the largest wingspan?",
            answer: "Wandering Albatross"
        },
        {
            question: "Who discovered the structure of DNA?",
            answer: "Watson and Crick"
        },
        {
            question: "What is the name of the deepest oceanic trench on Earth?",
            answer: "Mariana Trench"
        },
        {
            question: "Which element has the atomic number 79?",
            answer: "Gold"
        },
        {
            question: "Who directed the 1941 film 'Citizen Kane'?",
            answer: "Orson Welles"
        },
        {
            question: "What is the capital of Burkina Faso?",
            answer: "Ouagadougou"
        },
        {
            question: "What is the largest moon of Saturn?",
            answer: "Titan"
        },
        {
            question: "Which ancient civilization built the city of Machu Picchu?",
            answer: "Incas"
        }
    ]
};


export class WWWGameService {
    /**
     * Initialize a new game with the given settings
     */

// In src/services/wwwGame/wwwGameService.ts
// Add this method to handle external questions
    static initializeGameWithExternalQuestions(
        settings: GameSettings & { userQuestions?: QuestionData[] }
    ): {
        gameQuestions: Array<{ question: string, answer: string }>,
        roundsData: RoundData[]
    } {
        if (settings.userQuestions && settings.userQuestions.length > 0) {
            // Convert user questions to game format
            const gameQuestions = settings.userQuestions.map(q => ({
                question: q.question,
                answer: q.answer
            }));

            // Limit to the round count
            const limitedQuestions = gameQuestions.slice(0, settings.roundCount);

            // Initialize rounds data structure
            const roundsData = limitedQuestions.map(q => ({
                question: q.question,
                correctAnswer: q.answer,
                teamAnswer: '',
                isCorrect: false,
                playerWhoAnswered: '',
                discussionNotes: ''
            }));

            return {gameQuestions: limitedQuestions, roundsData};
        }

        // Fall back to default initialization if no user questions
        return this.initializeGame(settings);
    }

// Then update the initializeGame method
    static initializeGame(settings: GameSettings): {
        gameQuestions: Array<{ question: string, answer: string }>,
        roundsData: RoundData[]
    } {
        let gameQuestions;

        // Use user questions if specified
        if (settings.questionSource === 'user' && settings.userQuestions && settings.userQuestions.length > 0) {
            // Use the user-provided questions
            gameQuestions = settings.userQuestions.map(q => ({
                question: q.question,
                answer: q.answer
            }));

            // If we don't have enough user questions, limit rounds
            if (gameQuestions.length < settings.roundCount) {
                settings.roundCount = gameQuestions.length;
            }
        } else {
            // Use the original question selection logic
            gameQuestions = this.getShuffledQuestions(settings.difficulty, settings.roundCount);
        }

        // Initialize rounds data structure
        const roundsData = gameQuestions.map(q => ({
            question: q.question,
            correctAnswer: q.answer,
            teamAnswer: '',
            isCorrect: false,
            playerWhoAnswered: '',
            discussionNotes: ''
        }));

        return {gameQuestions, roundsData};
    }

    /**
     * Get shuffled questions based on difficulty and limit to a specific count
     */
    static getShuffledQuestions(
        difficulty: 'Easy' | 'Medium' | 'Hard',
        count: number
    ): Array<{ question: string, answer: string }> {
        // Get questions for selected difficulty
        const questionsForDifficulty = [...QUESTIONS[difficulty]];

        // Shuffle the questions
        const shuffled = questionsForDifficulty.sort(() => 0.5 - Math.random());

        // Return limited number of questions
        return shuffled.slice(0, count);
    }

    /**
     * Validate team answer against correct answer with improved Russian language support
     */
    static validateAnswer(teamAnswer: string, correctAnswer: string): boolean {
        if (!teamAnswer || !correctAnswer) return false;

        // Normalize strings for comparison (trim whitespace, remove punctuation, lowercase)
        const normalizeForComparison = (text: string): string => {
            return text
                .toLowerCase()
                .trim()
                // Remove punctuation, but keep Cyrillic and Latin characters
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()""''«»]/g, "")
                .replace(/\s{2,}/g, " ");
        };

        const normalizedTeamAnswer = normalizeForComparison(teamAnswer);
        const normalizedCorrectAnswer = normalizeForComparison(correctAnswer);

        // Direct match after normalization
        if (normalizedTeamAnswer === normalizedCorrectAnswer) {
            return true;
        }

        // Check for case where the team answer contains the correct answer or vice versa
        if (normalizedTeamAnswer.includes(normalizedCorrectAnswer) ||
            normalizedCorrectAnswer.includes(normalizedTeamAnswer)) {
            return true;
        }

        // For short answers (1-2 words), use approximate matching
        const isShortAnswer = normalizedCorrectAnswer.split(" ").length <= 2;
        if (isShortAnswer) {
            return this.isApproximatelyCorrect(teamAnswer, correctAnswer);
        }

        return false;
    }

    /**
     * Update round data with team's answer
     */
    static processRoundAnswer(
        roundsData: RoundData[],
        currentRound: number,
        teamAnswer: string,
        selectedPlayer: string,
        discussionNotes: string
    ): {
        updatedRoundsData: RoundData[],
        isCorrect: boolean
    } {
        const updatedRoundsData = [...roundsData];
        const isCorrect = this.validateAnswer(
            teamAnswer,
            roundsData[currentRound].correctAnswer
        );

        updatedRoundsData[currentRound] = {
            ...updatedRoundsData[currentRound],
            teamAnswer,
            isCorrect,
            playerWhoAnswered: selectedPlayer,
            discussionNotes
        };

        return {updatedRoundsData, isCorrect};
    }

    /**
     * Calculate player performance statistics
     */
    static calculatePlayerPerformance(roundsData: RoundData[]): PlayerPerformance[] {
        // Create a map to aggregate player stats
        const playerStatsMap = new Map<string, { total: number, correct: number }>();

        // Process each round
        roundsData.forEach(round => {
            const player = round.playerWhoAnswered;
            if (!player) return; // Skip if no player answered

            if (!playerStatsMap.has(player)) {
                playerStatsMap.set(player, {total: 0, correct: 0});
            }

            const stats = playerStatsMap.get(player)!;
            stats.total += 1;

            if (round.isCorrect) {
                stats.correct += 1;
            }
        });

        // Convert map to array and calculate percentages
        return Array.from(playerStatsMap.entries())
            .map(([player, stats]) => ({
                player,
                total: stats.total,
                correct: stats.correct,
                percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
            }))
            .sort((a, b) => b.correct - a.correct); // Sort by correct answers
    }

    /**
     * Generate AI host feedback for a round
     */
    static generateRoundFeedback(
        roundData: RoundData,
        enableAIHost: boolean
    ): string {
        if (!enableAIHost) return '';

        if (!roundData.isCorrect) {
            // Check if correct answer was mentioned in discussion notes
            const wasCorrectAnswerDiscussed =
                roundData.discussionNotes.toLowerCase().includes(
                    roundData.correctAnswer.toLowerCase()
                );

            if (wasCorrectAnswerDiscussed) {
                return `I heard the correct answer "${roundData.correctAnswer}" during your discussion, but it wasn't your final answer.`;
            } else {
                return `The correct answer was "${roundData.correctAnswer}". I didn't hear this answer during your discussion.`;
            }
        } else {
            return `Great job! "${roundData.correctAnswer}" is correct!`;
        }
    }

    /**
     * Generate an AI hint for the current question
     */
    static generateHint(correctAnswer: string): string {
        let hint = `The answer contains ${correctAnswer.length} characters.`;

        if (correctAnswer.includes(' ')) {
            hint += ` It's ${correctAnswer.split(' ').length} words.`;
        }

        // Could add more sophisticated hints here
        return hint;
    }

    /**
     * Generate comprehensive AI feedback for game results
     */
    static generateGameFeedback(
        roundsData: RoundData[],
        performances: PlayerPerformance[]
    ): string {
        // Best performing player
        const bestPlayer = performances.length > 0 ? performances[0] : null;

        // Identifying what topics the team struggled with
        const incorrectQuestions = roundsData.filter(round => !round.isCorrect);

        let feedback = '';

        if (bestPlayer && bestPlayer.total > 1) {
            feedback += `${bestPlayer.player} was your strongest player, answering ${bestPlayer.correct} out of ${bestPlayer.total} questions correctly. `;
        }

        if (incorrectQuestions.length > 0) {
            feedback += 'The team struggled most with questions about ';
            const topics = incorrectQuestions.map(q => {
                const words = q.question.split(' ');
                // Extract a few words to represent the topic
                return words.length > 3 ? words.slice(1, 4).join(' ') : q.question.substring(0, 15);
            }).slice(0, 3);

            feedback += topics.join(', ');
            feedback += '. Consider studying these topics more for next time!';
        } else {
            feedback += 'Your team showed excellent knowledge across all question categories!';
        }

        return feedback;
    }

    /**
     * Generate overall results message based on score
     */
    static generateResultsMessage(score: number, totalRounds: number): string {
        const correctPercentage = (score / totalRounds) * 100;

        if (correctPercentage >= 90) return 'Outstanding! Your team showcased exceptional knowledge!';
        if (correctPercentage >= 70) return 'Great job! Your team has impressive knowledge!';
        if (correctPercentage >= 50) return 'Good effort! Your team did well!';
        if (correctPercentage >= 30) return 'Nice try! Keep learning and you\'ll improve!';
        return 'Don\'t give up! Every game is a learning opportunity!';
    }

    /**
     * Determine if an answer is approximately correct
     * This provides more flexibility in accepting answers
     */
    static isApproximatelyCorrect(userAnswer: string, correctAnswer: string): boolean {
        // Handle null/undefined inputs
        if (!userAnswer || !correctAnswer) return false;

        // Convert to lowercase and trim
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();

        // Handle empty strings after normalization
        if (!normalizedUserAnswer || !normalizedCorrectAnswer) return false;

        // Exact match
        if (normalizedUserAnswer === normalizedCorrectAnswer) return true;

        // Check if the answer contains the correct answer (for partial matches)
        if (normalizedUserAnswer.includes(normalizedCorrectAnswer) ||
            normalizedCorrectAnswer.includes(normalizedUserAnswer)) {
            return true;
        }

        // Calculate similarity ratio using Levenshtein distance
        // This is a simple implementation that could be improved
        const distance = this.levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
        const maxLength = Math.max(normalizedUserAnswer.length, normalizedCorrectAnswer.length);

        // Avoid division by zero (though this shouldn't happen after our checks above)
        if (maxLength === 0) return false;

        const similarityRatio = 1 - distance / maxLength;

        // Accept answers that are at least 80% similar
        return similarityRatio >= 0.8;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * (Helper for approximate matching)
     */
    private static levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // Initialize matrix
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Analyze discussion notes to find potential answers
     */
    static analyzeDiscussionNotes(
        notes: string,
        correctAnswer: string
    ): {
        mentionedCorrectAnswer: boolean,
        potentialAnswers: string[]
    } {
        // Split notes into sentences
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Extract potential answers (simple approach)
        const potentialAnswers: string[] = [];
        const lowercaseNotes = notes.toLowerCase();
        const lowercaseAnswer = correctAnswer.toLowerCase();

        // Check if correct answer was mentioned
        const mentionedCorrectAnswer = lowercaseNotes.includes(lowercaseAnswer);

        // Extract statements that sound like answers
        for (const sentence of sentences) {
            if (
                sentence.includes('maybe') ||
                sentence.includes('could be') ||
                sentence.includes('I think') ||
                sentence.includes('answer is')
            ) {
                potentialAnswers.push(sentence.trim());
            }
        }

        return {mentionedCorrectAnswer, potentialAnswers};
    }
}