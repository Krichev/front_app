// src/shared/ui/TopicSelector/TopicTreeSelector.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SelectableTopic } from '../../../entities/TopicState/model/types/topic.types';
import {
    useGetRootTopicsQuery,
    useGetSelectableTopicsQuery,
    useCreateTopicMutation,
} from '../../../entities/TopicState/model/slice/topicApi';
import { useLazyTopicTree } from './hooks/useLazyTopicTree';
import TopicTreeItem from './TopicTreeItem';
import { useTheme, createStyles } from '../theme';
import CreateTopicModal from './CreateTopicModal';

interface TopicTreeSelectorProps {
    selectedTopicId?: number;
    selectedTopicName?: string;
    onSelectTopic: (topic: SelectableTopic | null) => void;
    onCreateTopic?: (name: string, parentId?: number) => void;
    allowCreate?: boolean;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
}

const TopicTreeSelector: React.FC<TopicTreeSelectorProps> = ({
    selectedTopicId,
    selectedTopicName,
    onSelectTopic,
    onCreateTopic,
    allowCreate = true,
    placeholder = 'Select or create a topic...',
    label = 'Topic',
    required = false,
    error,
}) => {
    const { theme } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    // Fetch topics from API
    const { data: rootTopics = [], isLoading: isLoadingRoots } = useGetRootTopicsQuery();
    const { data: selectableTopics = [], isLoading: isLoadingSelectable } = useGetSelectableTopicsQuery();
    const [createTopic, { isLoading: isCreating }] = useCreateTopicMutation();

    // Tree state management with lazy loading
    const {
        flattenedTopics,
        searchTerm,
        setSearchTerm,
        selectedId,
        toggleExpand,
        selectTopic,
        clearSelection,
        findTopicById,
    } = useLazyTopicTree(rootTopics);

    // Initialize selected ID from props
    useEffect(() => {
        if (selectedTopicId && selectedTopicId !== selectedId) {
            selectTopic(selectedTopicId);
        }
    }, [selectedTopicId]);

    const handleSelectTopic = (topicId: number) => {
        const topic = findTopicById(topicId);
        if (topic) {
            // Convert TopicTreeNode to SelectableTopic
            const selectableTopic: SelectableTopic = {
                id: topic.id,
                name: topic.name,
                fullPath: topic.name, // Will be enhanced with full path in backend
                depth: 0,
                validationStatus: topic.validationStatus,
                isOwn: false,
            };
            selectTopic(topicId);
            onSelectTopic(selectableTopic);
            setModalVisible(false);
        }
    };

    const handleCreateTopic = async (request: any) => {
        try {
            const result = await createTopic(request).unwrap();
            Alert.alert(
                'Topic Created',
                'Your topic has been submitted for review and will be available once approved.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCreateModalVisible(false);
                            // Optionally select the newly created topic
                            const selectableTopic: SelectableTopic = {
                                id: result.id,
                                name: result.name,
                                fullPath: result.name,
                                depth: result.depth,
                                validationStatus: result.validationStatus,
                                isOwn: true,
                            };
                            onSelectTopic(selectableTopic);
                            setModalVisible(false);
                        },
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Failed to create topic. Please try again.');
        }
    };

    const handleClearSelection = () => {
        clearSelection();
        onSelectTopic(null);
    };

    const renderItem = ({ item }: any) => {
        const hasChildren = (item.childCount ?? 0) > 0;

        return (
            <TopicTreeItem
                topic={item}
                isSelected={item.id === selectedId}
                onPress={() => handleSelectTopic(item.id)}
                onToggleExpand={() => toggleExpand(item.id)}
                hasChildren={hasChildren}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Label */}
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            {/* Selector button */}
            <TouchableOpacity
                style={[styles.selector, error && styles.selectorError]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.selectorContent}>
                    {selectedTopicName ? (
                        <>
                            <Text style={styles.selectedText} numberOfLines={1}>
                                {selectedTopicName}
                            </Text>
                            <TouchableOpacity
                                onPress={handleClearSelection}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.text.disabled} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.placeholder}>{placeholder}</Text>
                    )}
                </View>
                <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.text.disabled} />
            </TouchableOpacity>

            {/* Error message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Topic selection modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Topic</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    {/* Search bar */}
                    <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.text.disabled} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search topics..."
                            placeholderTextColor={theme.colors.text.disabled}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchTerm('')}>
                                <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.text.disabled} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Topic tree */}
                    {isLoadingRoots || isLoadingSelectable ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary.main} />
                            <Text style={styles.loadingText}>Loading topics...</Text>
                        </View>
                    ) : flattenedTopics.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="file-tree-outline" size={48} color={theme.colors.neutral.gray[300]} />
                            <Text style={styles.emptyText}>No topics found</Text>
                            {allowCreate && (
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={() => setCreateModalVisible(true)}
                                >
                                    <MaterialCommunityIcons name="plus-circle" size={20} color={theme.colors.neutral.white} />
                                    <Text style={styles.createButtonText}>Create Topic</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={flattenedTopics}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.list}
                        />
                    )}

                    {/* Create topic button */}
                    {allowCreate && flattenedTopics.length > 0 && (
                        <TouchableOpacity
                            style={styles.createTopicButton}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="plus-circle" size={24} color={theme.colors.primary.main} />
                            <Text style={styles.createTopicButtonText}>Create New Topic</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>

            {/* Create topic modal */}
            <CreateTopicModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSubmit={handleCreateTopic}
                isLoading={isCreating}
            />
        </View>
    );
};

const styles = createStyles(theme => ({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    required: {
        color: theme.colors.error.main,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    selectorError: {
        borderColor: theme.colors.error.main,
    },
    selectorContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedText: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    placeholder: {
        fontSize: 15,
        color: theme.colors.text.disabled,
    },
    errorText: {
        fontSize: 13,
        color: theme.colors.error.main,
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background.tertiary,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    headerSpacer: {
        width: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.primary,
        margin: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        paddingVertical: 4,
    },
    list: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.text.disabled,
        textAlign: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary.main,
        borderRadius: 8,
        gap: 8,
    },
    createButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.neutral.white,
    },
    createTopicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background.primary,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        gap: 8,
    },
    createTopicButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary.main,
    },
}));

export default TopicTreeSelector;
