import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { themeStyles as styles } from '../styles';
import { DifficultyFilter, DIFFICULTY_OPTIONS } from '../lib/questionManagement.types';

interface DifficultyFilterBarProps {
    selectedDifficulty: DifficultyFilter;
    onDifficultyChange: (diff: DifficultyFilter) => void;
}

export const DifficultyFilterBar: React.FC<DifficultyFilterBarProps> = ({ 
    selectedDifficulty, 
    onDifficultyChange 
}) => {
    return (
        <View style={styles.difficultyFilter}>
            <Text style={styles.sectionLabel}>Filter by Difficulty:</Text>
            <View style={styles.difficultyButtons}>
                {DIFFICULTY_OPTIONS.map((diff) => (
                    <TouchableOpacity
                        key={diff}
                        style={[
                            styles.difficultyButton,
                            selectedDifficulty === diff && styles.selectedDifficulty
                        ]}
                        onPress={() => onDifficultyChange(diff)}
                    >
                        <Text
                            style={[
                                styles.difficultyText,
                                selectedDifficulty === diff && styles.selectedDifficultyText
                            ]}
                        >
                            {diff}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
