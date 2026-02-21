// src/features/PuzzleGame/ui/PuzzleBoard.tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, LayoutRectangle } from 'react-native';
import { PuzzlePieceDTO, PuzzlePieceState } from '../../../entities/PuzzleState/model/types';
import { DraggableJigsawPiece } from './DraggableJigsawPiece';

interface PuzzleBoardProps {
    gridRows: number;
    gridCols: number;
    cellWidth: number;
    cellHeight: number;
    pieceStates: PuzzlePieceState[];
    onDragEnd: (pieceIndex: number, absoluteX: number, absoluteY: number) => void;
    onLayout: (layout: LayoutRectangle) => void;
    disabled?: boolean;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
    gridRows,
    gridCols,
    cellWidth,
    cellHeight,
    pieceStates,
    onDragEnd,
    onLayout,
    disabled
}) => {
    const boardRef = useRef<View>(null);

    const renderGrid = () => {
        const cells = [];
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                cells.push(
                    <View 
                        key={`cell-${r}-${c}`}
                        style={[
                            styles.cell,
                            { 
                                width: cellWidth, 
                                height: cellHeight,
                                left: c * cellWidth,
                                top: r * cellHeight
                            }
                        ]}
                    />
                );
            }
        }
        return cells;
    };

    return (
        <View 
            ref={boardRef}
            style={[styles.container, { width: cellWidth * gridCols, height: cellHeight * gridRows }]}
            onLayout={(e) => onLayout(e.nativeEvent.layout)}
        >
            {/* Background Grid */}
            {renderGrid()}

            {/* Placed Pieces */}
            {pieceStates.filter(ps => !ps.isInTray).map(ps => (
                <DraggableJigsawPiece
                    key={`piece-${ps.piece.id}`}
                    piece={ps.piece}
                    initialX={ps.currentCol * cellWidth}
                    initialY={ps.currentRow * cellHeight}
                    width={cellWidth * 1.4} // Account for tabs
                    height={cellHeight * 1.4}
                    onDragStart={() => {}}
                    onDragEnd={(x, y) => onDragEnd(ps.piece.pieceIndex, x, y)}
                    isPlacedCorrectly={ps.isPlacedCorrectly}
                    disabled={disabled}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cell: {
        position: 'absolute',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    }
});
