// src/features/PuzzleGame/model/puzzleUtils.ts
import { Dimensions, LayoutRectangle } from 'react-native';
import { PuzzlePieceDTO, PuzzlePieceState, PuzzleGameMode } from '../../../entities/PuzzleState/model/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const calculateGridSizing = (
    gridRows: number,
    gridCols: number,
    sourceImageWidth: number = 1000,
    sourceImageHeight: number = 1000,
    padding: number = 16
) => {
    const availableWidth = screenWidth - (padding * 2);
    let cellWidth = availableWidth / gridCols;
    
    // Maintain aspect ratio of source image
    const imageAspectRatio = sourceImageHeight / sourceImageWidth;
    let cellHeight = (cellWidth * gridCols * imageAspectRatio) / gridRows;

    const maxBoardHeight = screenHeight * 0.5;
    if (cellHeight * gridRows > maxBoardHeight) {
        cellHeight = maxBoardHeight / gridRows;
        cellWidth = (cellHeight * gridRows) / (gridCols * imageAspectRatio);
    }

    return {
        cellWidth,
        cellHeight,
        boardWidth: cellWidth * gridCols,
        boardHeight: cellHeight * gridRows,
    };
};

export const getTargetGridCell = (
    dropX: number,
    dropY: number,
    boardLayout: LayoutRectangle,
    gridRows: number,
    gridCols: number,
    cellWidth: number,
    cellHeight: number
) => {
    const relativeX = dropX - boardLayout.x;
    const relativeY = dropY - boardLayout.y;

    const col = Math.floor(relativeX / cellWidth);
    const row = Math.floor(relativeY / cellHeight);

    if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
        return { row, col };
    }

    return null;
};

export const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const initializePieceStates = (
    pieces: PuzzlePieceDTO[],
    gameMode: PuzzleGameMode,
    gridRows: number,
    gridCols: number
): PuzzlePieceState[] => {
    if (gameMode === 'INDIVIDUAL') {
        // Mode B: All pieces scrambled on the board
        const positions = [];
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                positions.push({ r, c });
            }
        }
        const shuffledPositions = shuffleArray(positions);
        
        return pieces.map((piece, index) => {
            const pos = shuffledPositions[index];
            return {
                piece,
                currentRow: pos.r,
                currentCol: pos.c,
                isPlacedCorrectly: piece.gridRow === pos.r && piece.gridCol === pos.c,
                isDragging: false,
                isInTray: false
            };
        });
    } else {
        // Mode A: Pieces start in tray
        return pieces.map(piece => ({
            piece,
            currentRow: -1,
            currentCol: -1,
            isPlacedCorrectly: false,
            isDragging: false,
            isInTray: true
        }));
    }
};
