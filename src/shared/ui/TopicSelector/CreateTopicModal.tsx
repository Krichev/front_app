// src/shared/ui/TopicSelector/CreateTopicModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    CreateTopicRequest,
    Topic,
} from '../../../entities/TopicState/model/types/topic.types';
import {
    useGetRootTopicsQuery,
    useLazyGetTopicChildrenQuery,
} from '../../../entities/TopicState/model/slice/topicApi';

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
                                    <ActivityIndicator size="small" color="#007AFF" />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                                        size={18}
                                        color="#666"
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
                            <MaterialCommunityIcons name="check-circle" size={18} color="#007AFF" />
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
                            color={isLoading ? '#999' : '#007AFF'}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create New Topic</Text>
                    <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={styles.submitButton}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Warning about validation */}
                    <View style={styles.warningBox}>
                        <MaterialCommunityIcons name="information" size={20} color="#FF9800" />
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
                            placeholderTextColor="#999"
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
                            placeholderTextColor="#999"
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
                            <MaterialCommunityIcons name="file-tree" size={20} color="#007AFF" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    submitButton: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: '#E65100',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#000',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 10,
    },
    helperText: {
        fontSize: 13,
        color: '#666',
        marginTop: 6,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1565C0',
    },
});

export default CreateTopicModal;
