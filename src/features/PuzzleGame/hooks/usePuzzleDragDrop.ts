// src/features/PuzzleGame/hooks/usePuzzleDragDrop.ts
import { useState, useCallback, useRef } from 'react';
import { LayoutRectangle, Platform, Vibration } from 'react-native';
import { 
    Gesture, 
} from 'react-native-gesture-handler';
import { 
    useSharedValue, 
    withSpring, 
    runOnJS,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { PuzzlePieceDTO, PuzzlePieceState, PuzzleGameMode } from '../../../entities/PuzzleState/model/types';
import { getTargetGridCell } from '../model/puzzleUtils';

const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

const triggerHaptic = (type: HapticFeedbackTypes = HapticFeedbackTypes.impactMedium) => {
    try {
        ReactNativeHapticFeedback.trigger(type, hapticOptions);
    } catch (error) {
        Vibration.vibrate(Platform.OS === 'ios' ? 10 : 50);
    }
};

interface UsePuzzleDragDropOptions {
    pieces: PuzzlePieceDTO[];
    gridRows: number;
    gridCols: number;
    gameMode: PuzzleGameMode;
    boardLayout: LayoutRectangle | null;
    cellWidth: number;
    cellHeight: number;
    onPiecePlaced: (pieceIndex: number, row: number, col: number) => void;
    disabled?: boolean;
}

export const usePuzzleDragDrop = ({
    pieces,
    gridRows,
    gridCols,
    gameMode,
    boardLayout,
    cellWidth,
    cellHeight,
    onPiecePlaced,
    disabled
}: UsePuzzleDragDropOptions) => {
    const [pieceStates, setPieceStates] = useState<PuzzlePieceState[]>(() => 
        pieces.map(p => ({
            piece: p,
            currentRow: -1,
            currentCol: -1,
            isPlacedCorrectly: false,
            isDragging: false,
            isInTray: true
        }))
    );

    const [totalMoves, setTotalMoves] = useState(0);

    const handleDragEnd = useCallback((pieceIndex: number, absoluteX: number, absoluteY: number) => {
        if (!boardLayout) return;

        const cell = getTargetGridCell(
            absoluteX,
            absoluteY,
            boardLayout,
            gridRows,
            gridCols,
            cellWidth,
            cellHeight
        );

        if (cell) {
            const { row, col } = cell;
            const piece = pieces.find(p => p.pieceIndex === pieceIndex);
            const isCorrect = piece?.gridRow === row && piece?.gridCol === col;

            setPieceStates(prev => {
                const newState = [...prev];
                const idx = newState.findIndex(ps => ps.piece.pieceIndex === pieceIndex);
                if (idx > -1) {
                    newState[idx] = {
                        ...newState[idx],
                        currentRow: row,
                        currentCol: col,
                        isPlacedCorrectly: isCorrect,
                        isInTray: false
                    };
                }
                return newState;
            });

            setTotalMoves(m => m + 1);
            onPiecePlaced(pieceIndex, row, col);
            
            if (isCorrect) {
                triggerHaptic(HapticFeedbackTypes.notificationSuccess);
            } else {
                triggerHaptic(HapticFeedbackTypes.impactLight);
            }
        } else {
            // Snap back to tray or previous position? 
            // For now, if dropped outside board, return to tray if it was in tray
            setPieceStates(prev => {
                const newState = [...prev];
                const idx = newState.findIndex(ps => ps.piece.pieceIndex === pieceIndex);
                if (idx > -1 && newState[idx].isInTray) {
                    // Logic to stay in tray is handled by JigsawPiece not having shared value updates
                }
                return newState;
            });
        }
    }, [boardLayout, gridRows, gridCols, cellWidth, cellHeight, pieces, onPiecePlaced]);

    const completionPercentage = (pieceStates.filter(p => p.isPlacedCorrectly).length / (gridRows * gridCols)) * 100;

    return {
        pieceStates,
        completionPercentage,
        totalMoves,
        handleDragEnd,
        triggerHaptic
    };
};
