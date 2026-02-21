// src/features/PuzzleGame/ui/PieceTray.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PuzzlePieceState } from '../../../entities/PuzzleState/model/types';
import { DraggableJigsawPiece } from './DraggableJigsawPiece';

interface PieceTrayProps {
    pieces: PuzzlePieceState[];
    cellWidth: number;
    cellHeight: number;
    onDragEnd: (pieceIndex: number, absoluteX: number, absoluteY: number) => void;
    disabled?: boolean;
}

export const PieceTray: React.FC<PieceTrayProps> = ({
    pieces,
    cellWidth,
    cellHeight,
    onDragEnd,
    disabled
}) => {
    return (
        <View style={styles.container}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {pieces.map((ps, index) => (
                    <View key={`tray-item-${ps.piece.id}`} style={styles.itemWrapper}>
                        <DraggableJigsawPiece
                            piece={ps.piece}
                            initialX={0}
                            initialY={0}
                            width={cellWidth * 1.2}
                            height={cellHeight * 1.2}
                            onDragStart={() => {}}
                            onDragEnd={onDragEnd}
                            disabled={disabled}
                        />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        marginTop: 16,
        width: '100%',
    },
    scrollContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    itemWrapper: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    }
});
