// src/shared/ui/TopicSelector/TopicTreeItem.tsx
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Topic } from '../../../entities/TopicState/model/types/topic.types';
import ValidationStatusBadge from '../ValidationStatusBadge/ValidationStatusBadge';
import { useTheme, createStyles } from '../theme';

interface TopicTreeItemProps {
    topic: Topic & { level: number; isExpanded: boolean; isLoading: boolean };
    isSelected: boolean;
    onPress: () => void;
    onToggleExpand: () => void;
    hasChildren: boolean;
}

const TopicTreeItem: React.FC<TopicTreeItemProps> = ({
    topic,
    isSelected,
    onPress,
    onToggleExpand,
    hasChildren,
}) => {
    const { theme } = useTheme();
    const indentWidth = topic.level * 20;

    return (
        <View style={[styles.container, isSelected && styles.selectedContainer]}>
            {/* Indentation spacer */}
            <View style={{ width: indentWidth }} />

            {/* Expand/Collapse chevron */}
            {hasChildren ? (
                <TouchableOpacity
                    style={styles.chevronButton}
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        onToggleExpand();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {topic.isLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary.main} />
                    ) : (
                        <MaterialCommunityIcons
                            name={topic.isExpanded ? 'chevron-down' : 'chevron-right'}
                            size={20}
                            color={theme.colors.text.secondary}
                        />
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.chevronPlaceholder} />
            )}

            {/* Topic content */}
            <TouchableOpacity
                style={styles.content}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.topicInfo}>
                    <Text style={[styles.topicName, isSelected && styles.selectedText]}>
                        {topic.name}
                    </Text>
                    {topic.questionCount > 0 && (
                        <Text style={styles.questionCount}>
                            ({topic.questionCount})
                        </Text>
                    )}
                </View>

                {/* Validation status badge */}
                <ValidationStatusBadge status={topic.validationStatus} size="small" showLabel={false} />

                {/* Selection checkmark */}
                {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary.main} />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = createStyles(theme => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingRight: 16,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    selectedContainer: {
        backgroundColor: theme.colors.info.background,
    },
    chevronButton: {
        padding: 4,
        marginRight: 4,
    },
    chevronPlaceholder: {
        width: 28,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    topicInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    topicName: {
        fontSize: 15,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    selectedText: {
        color: theme.colors.primary.main,
        fontWeight: '600',
    },
    questionCount: {
        fontSize: 13,
        color: theme.colors.text.disabled,
    },
}));

export default TopicTreeItem;
