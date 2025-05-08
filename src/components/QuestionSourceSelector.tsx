// src/components/QuestionSourceSelector.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface QuestionSourceSelectorProps {
    source: 'app' | 'user';
    onSelectSource: (source: 'app' | 'user') => void;
}

const QuestionSourceSelector: React.FC<QuestionSourceSelectorProps> = ({
                                                                           source,
                                                                           onSelectSource
                                                                       }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Question Source:</Text>
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        source === 'app' && styles.toggleButtonActive
                    ]}
                    onPress={() => onSelectSource('app')}
                >
                    <Text
                        style={[
                            styles.toggleText,
                            source === 'app' && styles.toggleTextActive
                        ]}
                    >
                        App Questions
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        source === 'user' && styles.toggleButtonActive
                    ]}
                    onPress={() => onSelectSource('user')}
                >
                    <Text
                        style={[
                            styles.toggleText,
                            source === 'user' && styles.toggleTextActive
                        ]}
                    >
                        My Questions
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#555',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#4CAF50',
    },
    toggleText: {
        fontSize: 14,
        color: '#555',
    },
    toggleTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default QuestionSourceSelector;