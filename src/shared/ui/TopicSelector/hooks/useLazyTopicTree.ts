// src/shared/ui/TopicSelector/hooks/useLazyTopicTree.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Topic } from '../../../../entities/TopicState/model/types/topic.types';
import { useLazyGetTopicChildrenQuery } from '../../../../entities/TopicState/model/slice/topicApi';

interface TreeNode extends Topic {
    level: number;
    isExpanded: boolean;
    isLoading: boolean;
    childrenLoaded: boolean;
    loadedChildren: TreeNode[];
}

export const useLazyTopicTree = (rootTopics: Topic[]) => {
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
    const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set());
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [fetchChildren] = useLazyGetTopicChildrenQuery();

    // Initialize tree when root topics load
    useEffect(() => {
        if (rootTopics && rootTopics.length > 0) {
            setTreeData(rootTopics.map(topic => ({
                ...topic,
                level: 0,
                isExpanded: false,
                isLoading: false,
                childrenLoaded: false,
                loadedChildren: [],
            })));
        }
    }, [rootTopics]);

    // Add children to tree at the correct position
    const addChildrenToNode = useCallback((
        nodes: TreeNode[],
        parentId: number,
        children: Topic[],
        parentLevel: number
    ): TreeNode[] => {
        return nodes.map(node => {
            if (node.id === parentId) {
                return {
                    ...node,
                    childrenLoaded: true,
                    loadedChildren: children.map(child => ({
                        ...child,
                        level: parentLevel + 1,
                        isExpanded: false,
                        isLoading: false,
                        childrenLoaded: false,
                        loadedChildren: [],
                    })),
                };
            }
            if (node.loadedChildren.length > 0) {
                return {
                    ...node,
                    loadedChildren: addChildrenToNode(
                        node.loadedChildren,
                        parentId,
                        children,
                        parentLevel
                    ),
                };
            }
            return node;
        });
    }, []);

    // Find node level in tree
    const findNodeLevel = useCallback((nodes: TreeNode[], targetId: number): number => {
        for (const node of nodes) {
            if (node.id === targetId) return node.level;
            if (node.loadedChildren.length > 0) {
                const level = findNodeLevel(node.loadedChildren, targetId);
                if (level >= 0) return level;
            }
        }
        return 0;
    }, []);

    // Toggle expand/collapse
    const toggleExpand = useCallback(async (id: number) => {
        const isCurrentlyExpanded = expandedIds.has(id);

        if (isCurrentlyExpanded) {
            // Collapse
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } else {
            // Expand - load children if not already loaded
            if (!loadedIds.has(id)) {
                setLoadingIds(prev => new Set(prev).add(id));
                try {
                    const children = await fetchChildren(id).unwrap();
                    const level = findNodeLevel(treeData, id);
                    setTreeData(prev => addChildrenToNode(prev, id, children, level));
                    setLoadedIds(prev => new Set(prev).add(id));
                } catch (error) {
                    console.error('Failed to load children for topic:', id, error);
                } finally {
                    setLoadingIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                }
            }
            setExpandedIds(prev => new Set(prev).add(id));
        }
    }, [expandedIds, loadedIds, fetchChildren, treeData, addChildrenToNode, findNodeLevel]);

    // Flatten tree for FlatList rendering
    const flattenTree = useCallback((
        nodes: TreeNode[],
        parentExpanded: boolean = true
    ): TreeNode[] => {
        const result: TreeNode[] = [];

        nodes.forEach(node => {
            const isExpanded = expandedIds.has(node.id);
            const isLoading = loadingIds.has(node.id);

            // Filter by search term
            const matchesSearch = !searchTerm ||
                node.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (matchesSearch && parentExpanded) {
                result.push({
                    ...node,
                    isExpanded,
                    isLoading,
                });

                // Add children if expanded
                if (isExpanded && node.loadedChildren.length > 0) {
                    result.push(...flattenTree(node.loadedChildren, true));
                }
            }
        });

        return result;
    }, [expandedIds, loadingIds, searchTerm]);

    const flattenedTopics = useMemo(
        () => flattenTree(treeData),
        [flattenTree, treeData]
    );

    // Selection
    const selectTopic = useCallback((id: number) => {
        setSelectedId(id);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedId(null);
    }, []);

    // Find topic by ID
    const findTopicById = useCallback((id: number): TreeNode | null => {
        const search = (nodes: TreeNode[]): TreeNode | null => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.loadedChildren.length > 0) {
                    const found = search(node.loadedChildren);
                    if (found) return found;
                }
            }
            return null;
        };
        return search(treeData);
    }, [treeData]);

    // Check if node is loading
    const isLoading = useCallback((id: number) => loadingIds.has(id), [loadingIds]);

    // Check if node is expanded
    const isExpanded = useCallback((id: number) => expandedIds.has(id), [expandedIds]);

    return {
        flattenedTopics,
        expandedIds,
        selectedId,
        searchTerm,
        setSearchTerm,
        toggleExpand,
        selectTopic,
        clearSelection,
        findTopicById,
        isLoading,
        isExpanded,
    };
};
