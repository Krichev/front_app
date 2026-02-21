// src/features/PuzzleGame/ui/DraggableJigsawPiece.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    runOnJS,
    useDerivedValue
} from 'react-native-reanimated';
import { PuzzlePieceDTO } from '../../../entities/PuzzleState/model/types';
import { JigsawPiece } from './JigsawPiece';

interface DraggableJigsawPieceProps {
    piece: PuzzlePieceDTO;
    initialX: number;
    initialY: number;
    width: number;
    height: number;
    onDragStart: () => void;
    onDragEnd: (absoluteX: number, absoluteY: number) => void;
    disabled?: boolean;
    isPlacedCorrectly?: boolean;
}

export const DraggableJigsawPiece: React.FC<DraggableJigsawPieceProps> = ({
    piece,
    initialX,
    initialY,
    width,
    height,
    onDragStart,
    onDragEnd,
    disabled,
    isPlacedCorrectly
}) => {
    const isDragging = useSharedValue(false);
    const offsetXX = useSharedValue(initialX);
    const offsetYY = useSharedValue(initialY);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const gesture = Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
            isDragging.value = true;
            runOnJS(onDragStart)();
        })
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            isDragging.value = false;
            const absoluteX = offsetXX.value + event.translationX + width / 2;
            const absoluteY = offsetYY.value + event.translationY + height / 2;
            
            runOnJS(onDragEnd)(absoluteX, absoluteY);
            
            // Note: Parent should update initialX/initialY if piece is snapped to grid
            // For now, we spring back to offset
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: offsetXX.value,
            top: offsetYY.value,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: withSpring(isDragging.value ? 1.1 : 1) }
            ],
            zIndex: isDragging.value ? 1000 : 1,
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={animatedStyle}>
                <JigsawPiece 
                    piece={piece} 
                    width={width} 
                    height={height} 
                    isDragging={isDragging.value}
                    isPlacedCorrectly={isPlacedCorrectly}
                />
            </Animated.View>
        </GestureDetector>
    );
};
