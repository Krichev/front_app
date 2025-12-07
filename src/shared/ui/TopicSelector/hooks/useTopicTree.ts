// src/shared/ui/TopicSelector/hooks/useTopicTree.ts
import { useState, useMemo } from 'react';
import { TopicTreeNode, FlattenedTopic } from '../../../../entities/TopicState/model/types/topic.types';

interface FlattenedTopicNode extends TopicTreeNode {
    level: number;
    isExpanded: boolean;
    isVisible: boolean;
}

/**
 * Hook for managing topic tree state
 * - Handles expand/collapse
 * - Filters by search term
 * - Manages selection
 */
export const useTopicTree = (topics: TopicTreeNode[]) => {
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    /**
     * Recursively flatten the tree for rendering
     */
    const flattenTree = (
        nodes: TopicTreeNode[],
        level: number = 0,
        parentExpanded: boolean = true
    ): FlattenedTopicNode[] => {
        const result: FlattenedTopicNode[] = [];

        nodes.forEach((node) => {
            const isExpanded = expandedIds.has(node.id);
            const isVisible = parentExpanded;

            // Check if node matches search
            const matchesSearch = searchTerm
                ? node.name.toLowerCase().includes(searchTerm.toLowerCase())
                : true;

            // If searching, show all matching nodes and their children
            if (!searchTerm || matchesSearch) {
                result.push({
                    ...node,
                    level,
                    isExpanded,
                    isVisible,
                });

                // Recursively add children if node is expanded or we're searching
                if ((isExpanded || searchTerm) && node.children && node.children.length > 0) {
                    const children = flattenTree(node.children, level + 1, true);
                    result.push(...children);
                }
            } else if (searchTerm && node.children && node.children.length > 0) {
                // If parent doesn't match but children might, check recursively
                const childMatches = flattenTree(node.children, level + 1, false);
                if (childMatches.length > 0) {
                    // Include parent if any child matches
                    result.push({
                        ...node,
                        level,
                        isExpanded: true,
                        isVisible,
                    });
                    result.push(...childMatches);
                }
            }
        });

        return result;
    };

    // Flatten topics for rendering
    const flattenedTopics = useMemo(() => {
        return flattenTree(topics);
    }, [topics, expandedIds, searchTerm]);

    /**
     * Toggle expand/collapse for a node
     */
    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    /**
     * Expand all nodes
     */
    const expandAll = () => {
        const allIds = new Set<number>();
        const collectIds = (nodes: TopicTreeNode[]) => {
            nodes.forEach((node) => {
                allIds.add(node.id);
                if (node.children && node.children.length > 0) {
                    collectIds(node.children);
                }
            });
        };
        collectIds(topics);
        setExpandedIds(allIds);
    };

    /**
     * Collapse all nodes
     */
    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    /**
     * Select a topic
     */
    const selectTopic = (id: number) => {
        setSelectedId(id);
    };

    /**
     * Clear selection
     */
    const clearSelection = () => {
        setSelectedId(null);
    };

    /**
     * Find a topic by ID in the tree
     */
    const findTopicById = (id: number): TopicTreeNode | null => {
        const search = (nodes: TopicTreeNode[]): TopicTreeNode | null => {
            for (const node of nodes) {
                if (node.id === id) {
                    return node;
                }
                if (node.children && node.children.length > 0) {
                    const found = search(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return search(topics);
    };

    return {
        flattenedTopics,
        expandedIds,
        searchTerm,
        setSearchTerm,
        selectedId,
        toggleExpand,
        expandAll,
        collapseAll,
        selectTopic,
        clearSelection,
        findTopicById,
    };
};
