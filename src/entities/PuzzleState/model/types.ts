// src/entities/PuzzleState/model/types.ts

// ============================================================================
// ENUMS
// ============================================================================

export type PuzzleGameMode = 'SHARED' | 'INDIVIDUAL';

export type PuzzleEdgeType = 'FLAT' | 'TAB' | 'BLANK';

export type PuzzleSessionStatus = 
    | 'CREATED' | 'DISTRIBUTING' | 'IN_PROGRESS' 
    | 'GUESSING' | 'COMPLETED' | 'ABANDONED';

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface CreatePuzzleGameRequest {
    challengeId: number;
    sourceImageMediaId: number;
    gameMode: PuzzleGameMode;
    gridRows: number;        // 2-8
    gridCols: number;        // 2-8
    answer: string;
    answerAliases?: string[];
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    timeLimitSeconds?: number;
    hintText?: string;
    hintAvailableAfterSeconds?: number;
    enableAiValidation?: boolean;
}

export interface BoardStateUpdate {
    pieceIndex: number;
    newRow: number;
    newCol: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PuzzleGameDTO {
    id: number;
    challengeId: number;
    gameMode: PuzzleGameMode;
    gridRows: number;
    gridCols: number;
    totalPieces: number;
    difficulty: string;
    status: PuzzleSessionStatus;
    timeLimitSeconds?: number;
    hintText?: string;
    hintAvailableAfterSeconds?: number;
    participantCount: number;
    createdAt: string;
    startedAt?: string;
}

export interface PuzzlePieceDTO {
    id: number;
    pieceIndex: number;
    gridRow?: number;       // correct position (may be hidden in Mode A until end)
    gridCol?: number;       // correct position
    imageUrl: string;      // presigned URL
    edgeTop: PuzzleEdgeType;
    edgeRight: PuzzleEdgeType;
    edgeBottom: PuzzleEdgeType;
    edgeLeft: PuzzleEdgeType;
    svgClipPath: string;   // SVG path data for jigsaw shape
    widthPx: number;
    heightPx: number;
}

export interface PuzzleParticipantDTO {
    userId: number;
    username: string;
    piecesPlacedCorrectly: number;
    totalMoves: number;
    answerSubmitted: boolean;
    answerCorrect: boolean;
    score: number;
    completionTimeMs?: number;
}

export interface AnswerResult {
    correct: boolean;
    message: string;
    score: number;
    rank: number;
}

export interface PuzzleGameStatusDTO {
    game: PuzzleGameDTO;
    participants: PuzzleParticipantDTO[];
    isStarted: boolean;
    isCompleted: boolean;
    elapsedTimeMs: number;
}

export interface SpectatorViewDTO {
    game: PuzzleGameDTO;
    players: SpectatorPlayerState[];
}

export interface SpectatorPlayerState {
    username: string;
    boardState: PiecePlacement[];
    hasAnswered: boolean;
}

export interface PiecePlacement {
    pieceIndex: number;
    currentRow: number;
    currentCol: number;
}

// ============================================================================
// LOCAL UI STATE TYPES (not from API)
// ============================================================================

/** Represents a piece on the board with its current drag/position state */
export interface PuzzlePieceState {
    piece: PuzzlePieceDTO;
    currentRow: number;       // Current position on the board (-1 if in tray)
    currentCol: number;       // Current position on the board (-1 if in tray)
    isPlacedCorrectly: boolean;
    isDragging: boolean;
    isInTray: boolean;        // true if piece hasn't been placed on board yet
}

/** Full local game state managed by the puzzle hook */
export interface PuzzleLocalState {
    pieces: PuzzlePieceState[];
    gameStatus: PuzzleSessionStatus;
    elapsedMs: number;
    hintVisible: boolean;
    answerText: string;
    answerSubmitted: boolean;
    answerResult: AnswerResult | null;
    completionPercentage: number; // 0-100
    totalMoves: number;
}

/** Game phase for UI rendering */
export type PuzzleGamePhase = 
    | 'LOADING'           // Fetching game data and pieces
    | 'WAITING_FOR_START' // Lobby / waiting for host
    | 'PLAYING'           // Active puzzle solving
    | 'ANSWER_INPUT'      // Typing answer (overlay/drawer)
    | 'SUBMITTED'         // Answer submitted, waiting for results
    | 'RESULTS';          // Final results/leaderboard
