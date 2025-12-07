// src/shared/ui/TopicSelector/TopicTreeSelector.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SelectableTopic } from '../../../entities/TopicState/model/types/topic.types';
import {
    useGetTopicTreeQuery,
    useGetSelectableTopicsQuery,
    useCreateTopicMutation,
} from '../../../entities/TopicState/model/slice/topicApi';
import { useTopicTree } from './hooks/useTopicTree';
import TopicTreeItem from './TopicTreeItem';
import TopicBreadcrumb from './TopicBreadcrumb';
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
    const [modalVisible, setModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    // Fetch topics from API
    const { data: topicTree = [], isLoading: isLoadingTree } = useGetTopicTreeQuery();
    const { data: selectableTopics = [], isLoading: isLoadingSelectable } = useGetSelectableTopicsQuery();
    const [createTopic, { isLoading: isCreating }] = useCreateTopicMutation();

    // Tree state management
    const {
        flattenedTopics,
        searchTerm,
        setSearchTerm,
        selectedId,
        toggleExpand,
        selectTopic,
        clearSelection,
        findTopicById,
    } = useTopicTree(topicTree);

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
        const hasChildren = item.children && item.children.length > 0;

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
                                <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.placeholder}>{placeholder}</Text>
                    )}
                </View>
                <MaterialCommunityIcons name="chevron-down" size={24} color="#999" />
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
                            <MaterialCommunityIcons name="close" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Topic</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    {/* Search bar */}
                    <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search topics..."
                            placeholderTextColor="#999"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchTerm('')}>
                                <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Topic tree */}
                    {isLoadingTree || isLoadingSelectable ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Loading topics...</Text>
                        </View>
                    ) : flattenedTopics.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="file-tree-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyText}>No topics found</Text>
                            {allowCreate && (
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={() => setCreateModalVisible(true)}
                                >
                                    <MaterialCommunityIcons name="plus-circle" size={20} color="#007AFF" />
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
                            <MaterialCommunityIcons name="plus-circle" size={24} color="#007AFF" />
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

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    required: {
        color: '#FF3B30',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    selectorError: {
        borderColor: '#FF3B30',
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
        color: '#000',
    },
    placeholder: {
        fontSize: 15,
        color: '#999',
    },
    errorText: {
        fontSize: 13,
        color: '#FF3B30',
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    headerSpacer: {
        width: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        margin: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
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
        color: '#666',
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
        color: '#999',
        textAlign: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        gap: 8,
    },
    createButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    createTopicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        gap: 8,
    },
    createTopicButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default TopicTreeSelector;
