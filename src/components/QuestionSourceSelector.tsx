// src/components/QuestionSourceSelector.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

interface QuestionSourceSelectorProps {
    source: 'app' | 'user';
    onSelectSource: (source: 'app' | 'user') => void;
}

const QuestionSourceSelector: React.FC<QuestionSourceSelectorProps> = ({
                                                                           source,
                                                                           onSelectSource
                                                                       }) => {
    const {theme} = useAppStyles();
    const styles = themeStyles;

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
                        color={source === 'app' ? theme.colors.text.inverse : theme.colors.text.secondary}
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
                        color={source === 'user' ? theme.colors.text.inverse : theme.colors.text.secondary}
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

const themeStyles = createStyles(theme => ({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: theme.spacing.md,
        color: theme.colors.text.secondary,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.layout.borderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.success.main,
    },
    icon: {
        marginRight: theme.spacing.xs,
    },
    toggleText: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    toggleTextActive: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default QuestionSourceSelector;
