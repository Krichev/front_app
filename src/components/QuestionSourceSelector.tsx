// src/components/QuestionSourceSelector.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
                    <MaterialCommunityIcons
                        name="brain"
                        size={20}
                        color={source === 'app' ? 'white' : '#666'}
                        style={styles.icon}
                    />
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
                    <MaterialCommunityIcons
                        name="account-edit"
                        size={20}
                        color={source === 'user' ? 'white' : '#666'}
                        style={styles.icon}
                    />
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
        marginBottom: 12,
        color: '#555',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#4CAF50',
    },
    icon: {
        marginRight: 6,
    },
    toggleText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    toggleTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default QuestionSourceSelector;