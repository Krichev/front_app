// src/shared/ui/InterestTagInput/InterestTagInput.tsx
import React, { useState, useCallback } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createStyles } from '../theme';
import { useAppStyles } from '../hooks/useAppStyles';

interface InterestTagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
}

const InterestTagInput: React.FC<InterestTagInputProps> = ({
    tags,
    onTagsChange,
    maxTags = 20,
    placeholder = 'Add interest...',
}) => {
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const [inputValue, setInputValue] = useState('');

    const addTag = useCallback(() => {
        const trimmed = inputValue.trim();
        if (!trimmed || tags.length >= maxTags || trimmed.length > 30) {
            return;
        }
        if (!tags.includes(trimmed)) {
            onTagsChange([...tags, trimmed]);
        }
        setInputValue('');
    }, [inputValue, tags, maxTags, onTagsChange]);

    const removeTag = useCallback((index: number) => {
        const next = [...tags];
        next.splice(index, 1);
        onTagsChange(next);
    }, [tags, onTagsChange]);

    return (
        <View>
            <View style={[styles.inputRow, { borderColor: theme.colors.border.main }]}>
                <TextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    onSubmitEditing={addTag}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.disabled}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    maxLength={30}
                />
                <TouchableOpacity
                    onPress={addTag}
                    style={[styles.addButton, { backgroundColor: theme.colors.success.main }]}
                    disabled={!inputValue.trim() || tags.length >= maxTags}
                >
                    <MaterialCommunityIcons name="plus" size={18} color={theme.colors.text.inverse} />
                </TouchableOpacity>
            </View>
            {tags.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tagsScroll}
                    contentContainerStyle={styles.tagsContainer}
                >
                    {tags.map((tag, index) => (
                        <View
                            key={index}
                            style={[styles.chip, { backgroundColor: theme.colors.success.background }]}
                        >
                            <Text style={[styles.chipText, { color: theme.colors.success.main }]}>{tag}</Text>
                            <TouchableOpacity onPress={() => removeTag(index)} style={styles.chipRemove}>
                                <MaterialCommunityIcons name="close" size={14} color={theme.colors.success.main} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.background.primary,
    },
    input: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
    },
    addButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: theme.spacing.xs,
    },
    tagsScroll: {
        marginTop: theme.spacing.sm,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xs,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xl,
        gap: theme.spacing.xs,
    },
    chipText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    chipRemove: {
        padding: 2,
    },
}));

export default InterestTagInput;
