import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme/createStyles';

/**
 * Props for the SearchResultSection component
 */
export interface SearchResultSectionProps<T> {
  /** The title of the section */
  title: string;
  /** The icon name from MaterialCommunityIcons */
  icon: string;
  /** The list of items to display in the section */
  items: T[];
  /** The unique key for the section used for expansion state */
  sectionKey: string;
  /** Whether the section is currently expanded */
  isExpanded: boolean;
  /** Callback function when the section is toggled */
  onToggle: () => void;
  /** Function to render a single item in the section */
  renderItem: (item: T) => React.ReactNode;
  /** The number of items to show by default (preview) */
  previewLimit?: number;
}

/**
 * A generic expandable section component for search results
 */
export const SearchResultSection = <T extends { id: string | number }>(props: SearchResultSectionProps<T>) => {
    const { 
        title, 
        icon, 
        items, 
        isExpanded, 
        onToggle, 
        renderItem, 
        previewLimit = 3 
    } = props;

    const { theme } = useAppStyles();
    const { t } = useTranslation();
    const styles = themeStyles;

    if (items.length === 0) return null;

    const showToggle = items.length > previewLimit;
    const displayItems = isExpanded ? items : items.slice(0, previewLimit);

    return (
        <View style={styles.section}>
            {/* Section Header */}
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => showToggle && onToggle()}
                disabled={!showToggle}
            >
                <View style={styles.sectionHeaderLeft}>
                    <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary.main} />
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{items.length}</Text>
                    </View>
                </View>
                {showToggle && (
                    <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={theme.colors.text.secondary}
                    />
                )}
            </TouchableOpacity>

            {/* Section Content */}
            <View style={styles.sectionContent}>
                {displayItems.map((item) => (
                    <React.Fragment key={item.id}>
                        {renderItem(item)}
                    </React.Fragment>
                ))}
            </View>

            {/* See All Button */}
            {!isExpanded && showToggle && (
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={onToggle}
                >
                    <Text style={styles.seeAllText}>
                        {t('search.seeAll', { count: items.length, type: title.toLowerCase() })}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    section: {
        marginBottom: theme.spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.background.tertiary,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.md,
    },
    countBadge: {
        backgroundColor: theme.colors.info.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.lg,
        marginLeft: theme.spacing.sm,
    },
    countText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sectionContent: {
        backgroundColor: theme.colors.background.primary,
    },
    seeAllButton: {
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.background.tertiary,
    },
    seeAllText: {
        color: theme.colors.primary.main,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
}));
