export type BrainRingPhase = 
    | 'waiting'           // Waiting for round to start
    | 'question_display'  // Question shown, buzz enabled
    | 'player_answering'  // Someone buzzed, waiting for answer
    | 'answer_feedback'   // Showing correct/incorrect
    | 'round_complete'    // Round finished
    | 'game_complete';    // All rounds done

export interface BrainRingGameState {
    phase: BrainRingPhase;
    currentRound: number;
    currentBuzzer: number | null;
    lockedOutPlayers: number[];
    answerDeadline: string | null;
    playerScores: Record<number, number>;
    myUserId: number;
    canBuzz: boolean;
    isAnswering: boolean;
}
