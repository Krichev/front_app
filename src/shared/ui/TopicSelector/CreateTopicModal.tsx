// src/shared/ui/TopicSelector/CreateTopicModal.tsx
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {CreateTopicRequest, Topic,} from '../../../entities/TopicState/model/types/topic.types';
import {useGetRootTopicsQuery, useLazyGetTopicChildrenQuery,} from '../../../entities/TopicState/model/slice/topicApi';
import {useAppStyles} from '../hooks/useAppStyles';
import {createStyles} from '../theme';

interface CreateTopicModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (topic: CreateTopicRequest) => void;
    initialParentId?: number;
    initialParentName?: string;
    isLoading?: boolean;
}

const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialParentId,
    initialParentName,
    isLoading = false,
}) => {
    const {theme} = useAppStyles();
    const styles = themeStyles;
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Parent selection state
    const [selectedParentId, setSelectedParentId] = useState<number | undefined>(initialParentId);
    const [selectedParentName, setSelectedParentName] = useState<string>(initialParentName || '');
    const [selectedParentPath, setSelectedParentPath] = useState<string>('');
    const [showParentSelector, setShowParentSelector] = useState(false);

    // Tree state for parent selection
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
    const [loadedChildren, setLoadedChildren] = useState<Map<number, Topic[]>>(new Map());

    // RTK Query hooks
    const { data: rootTopics = [], isLoading: isLoadingRoots } = useGetRootTopicsQuery(undefined, {
        skip: !showParentSelector,
    });
    const [fetchChildren] = useLazyGetTopicChildrenQuery();

    // Initialize from props when modal becomes visible
    useEffect(() => {
        if (visible) {
            setSelectedParentId(initialParentId);
            setSelectedParentName(initialParentName || '');
        }
    }, [visible, initialParentId, initialParentName]);

    // Toggle expand and load children
    const handleToggleExpand = async (topicId: number) => {
        if (expandedIds.has(topicId)) {
            // Collapse
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.delete(topicId);
                return next;
            });
        } else {
            // Expand - load children if needed
            if (!loadedChildren.has(topicId)) {
                setLoadingIds(prev => new Set(prev).add(topicId));
                try {
                    const children = await fetchChildren(topicId).unwrap();
                    setLoadedChildren(prev => new Map(prev).set(topicId, children));
                } catch (error) {
                    console.error('Failed to load children:', error);
                } finally {
                    setLoadingIds(prev => {
                        const next = new Set(prev);
                        next.delete(topicId);
                        return next;
                    });
                }
            }
            setExpandedIds(prev => new Set(prev).add(topicId));
        }
    };

    // Select parent topic
    const handleSelectParent = (topic: Topic) => {
        setSelectedParentId(topic.id);
        setSelectedParentName(topic.name);
        // Build path from parent names if available
        setSelectedParentPath(topic.parentName ? `${topic.parentName} > ${topic.name}` : topic.name);
        setShowParentSelector(false);
    };

    // Clear parent selection
    const handleClearParent = () => {
        setSelectedParentId(undefined);
        setSelectedParentName('');
        setSelectedParentPath('');
    };

    const handleSubmit = () => {
        // Validate name
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a topic name');
            return;
        }

        if (name.trim().length < 2) {
            Alert.alert('Error', 'Topic name must be at least 2 characters');
            return;
        }

        if (name.trim().length > 100) {
            Alert.alert('Error', 'Topic name must be less than 100 characters');
            return;
        }

        // Submit topic
        const request: CreateTopicRequest = {
            name: name.trim(),
            description: description.trim() || undefined,
            parentId: selectedParentId,
        };

        onSubmit(request);
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setSelectedParentId(initialParentId);
        setSelectedParentName(initialParentName || '');
        setSelectedParentPath('');
        setShowParentSelector(false);
        setExpandedIds(new Set());
        setLoadedChildren(new Map());
        onClose();
    };

    // Inline component for rendering tree nodes
    interface ParentTreeNodeProps {
        topic: Topic;
        level: number;
        selectedId?: number;
        expandedIds: Set<number>;
        loadingIds: Set<number>;
        loadedChildren: Map<number, Topic[]>;
        onSelect: (topic: Topic) => void;
        onToggleExpand: (id: number) => void;
    }

    const ParentTreeNode: React.FC<ParentTreeNodeProps> = ({
        topic,
        level,
        selectedId,
        expandedIds,
        loadingIds,
        loadedChildren,
        onSelect,
        onToggleExpand,
    }) => {
        const isExpanded = expandedIds.has(topic.id);
        const isLoading = loadingIds.has(topic.id);
        const isSelected = selectedId === topic.id;
        const hasChildren = (topic.childCount ?? 0) > 0;
        const children = loadedChildren.get(topic.id) || [];
        const indentation = level * 20;

        return (
            <>
                <TouchableOpacity
                    style={[
                        styles.treeNode,
                        isSelected && styles.treeNodeSelected,
                    ]}
                    onPress={() => onSelect(topic)}
                >
                    <View style={[styles.treeNodeContent, { paddingLeft: 12 + indentation }]}>
                        {/* Expand button */}
                        {hasChildren ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    onToggleExpand(topic.id);
                                }}
                                style={styles.expandButton}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                                        size={18}
                                        color={theme.colors.text.secondary}
                                    />
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.expandPlaceholder} />
                        )}

                        {/* Topic name */}
                        <Text style={[styles.treeNodeName, isSelected && styles.treeNodeNameSelected]}>
                            {topic.name}
                        </Text>

                        {/* Selection indicator */}
                        {isSelected && (
                            <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary.main} />
                        )}
                    </View>
                </TouchableOpacity>

                {/* Render children if expanded */}
                {isExpanded && children.map(child => (
                    <ParentTreeNode
                        key={child.id}
                        topic={child}
                        level={level + 1}
                        selectedId={selectedId}
                        expandedIds={expandedIds}
                        loadingIds={loadingIds}
                        loadedChildren={loadedChildren}
                        onSelect={onSelect}
                        onToggleExpand={onToggleExpand}
                    />
                ))}
            </>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} disabled={isLoading}>
                        <MaterialCommunityIcons
                            name="close"
                            size={24}
                            color={isLoading ? theme.colors.text.disabled : theme.colors.primary.main}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create New Topic</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary.main} />
                        ) : (
                            <Text style={styles.submitButton}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Warning about validation */}
                    <View style={styles.warningBox}>
                        <MaterialCommunityIcons name="information" size={20} color={theme.colors.warning.main} />
                        <Text style={styles.warningText}>
                            New topics require moderator approval before becoming public.
                        </Text>
                    </View>

                    {/* Name field */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Topic Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Machine Learning"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={name}
                            onChangeText={setName}
                            maxLength={100}
                            autoFocus
                        />
                        <Text style={styles.helperText}>
                            Choose a clear, specific name for your topic
                        </Text>
                    </View>

                    {/* Description field */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Briefly describe what this topic covers..."
                            placeholderTextColor={theme.colors.text.disabled}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Text style={styles.helperText}>
                            Help others understand what questions belong in this topic
                        </Text>
                    </View>

                    {/* Parent topic info */}
                    {initialParentId && (
                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="file-tree" size={20} color={theme.colors.primary.main} />
                            <Text style={styles.infoText}>
                                This topic will be created as a subtopic
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    headerTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    submitButton: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.warning.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    warningText: {
        flex: 1,
        ...theme.typography.body.small,
        color: theme.colors.warning.dark,
        lineHeight: 20,
    },
    section: {
        marginBottom: theme.spacing['2xl'],
    },
    label: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.background.primary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
    },
    textArea: {
        minHeight: 100,
        paddingTop: theme.spacing.sm,
    },
    helperText: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.info.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    infoText: {
        flex: 1,
        ...theme.typography.body.small,
        color: theme.colors.info.dark,
    },
    treeNode: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    treeNodeSelected: {
        backgroundColor: theme.colors.info.background,
    },
    treeNodeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandButton: {
        padding: 4,
    },
    expandPlaceholder: {
        width: 26,
    },
    treeNodeName: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    treeNodeNameSelected: {
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
}));

export default CreateTopicModal;
