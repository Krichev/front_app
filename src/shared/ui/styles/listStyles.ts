import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const listStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        contentContainer: {
            padding: theme.spacing.lg,
        },
        item: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.layout.borderRadius.md,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        itemSelected: {
            borderColor: theme.colors.primary.main,
            backgroundColor: theme.colors.info.background,
        },
        itemContent: {
            flex: 1,
            marginRight: theme.spacing.md,
        },
        itemTitle: {
            ...theme.typography.body.medium,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs,
        },
        itemSubtitle: {
            ...theme.typography.caption,
            color: theme.colors.text.secondary,
        },
        separator: {
            height: theme.spacing.md,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing.xl,
        },
        emptyText: {
            ...theme.typography.body.medium,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            marginTop: theme.spacing.lg,
        },
    });
