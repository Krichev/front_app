// src/shared/ui/TopicSelector/TopicTreeItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TopicTreeNode } from '../../../entities/TopicState/model/types/topic.types';
import ValidationStatusBadge from '../ValidationStatusBadge/ValidationStatusBadge';

interface TopicTreeItemProps {
    topic: TopicTreeNode & { level: number; isExpanded: boolean };
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
    const indentWidth = topic.level * 20;

    return (
        <View style={[styles.container, isSelected && styles.selectedContainer]}>
            {/* Indentation spacer */}
            <View style={{ width: indentWidth }} />

            {/* Expand/Collapse chevron */}
            {hasChildren ? (
                <TouchableOpacity
                    style={styles.chevronButton}
                    onPress={onToggleExpand}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialCommunityIcons
                        name={topic.isExpanded ? 'chevron-down' : 'chevron-right'}
                        size={20}
                        color="#666"
                    />
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
                    <MaterialCommunityIcons name="check-circle" size={20} color="#007AFF" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingRight: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedContainer: {
        backgroundColor: '#F0F8FF',
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
        color: '#000',
        fontWeight: '500',
    },
    selectedText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    questionCount: {
        fontSize: 13,
        color: '#999',
    },
});

export default TopicTreeItem;
