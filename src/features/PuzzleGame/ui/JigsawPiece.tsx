// src/features/PuzzleGame/ui/JigsawPiece.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from 'react-native-svg';
import { PuzzlePieceDTO } from '../../../entities/PuzzleState/model/types';

interface JigsawPieceProps {
    piece: PuzzlePieceDTO;
    width: number;
    height: number;
    isPlacedCorrectly?: boolean;
    isDragging?: boolean;
    opacity?: number;
}

export const JigsawPiece: React.FC<JigsawPieceProps> = ({
    piece,
    width,
    height,
    isPlacedCorrectly,
    isDragging,
    opacity = 1
}) => {
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isPlacedCorrectly) {
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.4,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            glowAnim.setValue(0);
        }
    }, [isPlacedCorrectly, glowAnim]);

    // Calculate scale factor from backend px to current display size
    const scaleX = width / (piece.widthPx - (width * 0.4)); // Simplified, assume tray/board handling
    // Actually the piece.widthPx includes the tabs. 
    // If piece.widthPx is 140 and cell is 100, then width provided here should be 140.
    
    return (
        <View style={[
            styles.container, 
            { width, height, opacity },
            isDragging && styles.dragging
        ]}>
            <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                    opacity: glowAnim,
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    borderRadius: 8,
                }
            ]} />
            
            <Svg width={width} height={height} viewBox={`0 0 ${piece.widthPx} ${piece.heightPx}`}>
                <Defs>
                    <ClipPath id={`clip-${piece.id}`}>
                        <Path d={piece.svgClipPath} />
                    </ClipPath>
                </Defs>
                
                {/* The Image from react-native-svg is different from regular Image */}
                <SvgImage
                    href={{ uri: piece.imageUrl }}
                    width={piece.widthPx}
                    height={piece.heightPx}
                    clipPath={`url(#clip-${piece.id})`}
                />
                
                {/* Piece Outline */}
                <Path 
                    d={piece.svgClipPath} 
                    fill="none" 
                    stroke={isPlacedCorrectly ? "#4CAF50" : "rgba(255,255,255,0.5)"} 
                    strokeWidth="2" 
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragging: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    }
});
