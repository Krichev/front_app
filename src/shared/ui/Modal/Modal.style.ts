// src/shared/ui/Modal/Modal.style.ts
import { StyleSheet, Dimensions } from 'react-native';
import type { Theme } from '../theme/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Creates theme-aware modal styles
 * Supports both light and dark modes
 */
export const createModalStyles = (theme: Theme) =>
  StyleSheet.create({
    // ============================================
    // OVERLAY & BACKDROP
    // ============================================
    overlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay.medium,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ============================================
    // MODAL CONTAINER (Theme variants)
    // ============================================
    modal: {
      width: '90%',
      maxWidth: 500,
      maxHeight: SCREEN_HEIGHT * 0.85,
      borderRadius: 16,
      overflow: 'hidden',
      // Shadow for iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      // Elevation for Android
      elevation: 8,
    },
    light: {
      backgroundColor: theme.colors.background.primary,
    },
    dark: {
      backgroundColor: theme.colors.background.dark,
    },

    // ============================================
    // HEADER
    // ============================================
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
    },
    lightText: {
      color: theme.colors.text.primary,
    },
    darkText: {
      color: theme.colors.text.inverse,
    },

    // ============================================
    // CLOSE BUTTON
    // ============================================
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
    },
    closeButtonText: {
      fontSize: 24,
      fontWeight: '300',
      lineHeight: 28,
    },

    // ============================================
    // CONTENT
    // ============================================
    content: {
      padding: theme.spacing.lg,
      maxHeight: SCREEN_HEIGHT * 0.7,
    },

    // ============================================
    // LEGACY STYLES (for backward compatibility)
    // ============================================
    opened: {
      zIndex: 1000,
      pointerEvents: 'auto' as const,
    },
    closed: {
      zIndex: -1,
      pointerEvents: 'none' as const,
    },
    text: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
      color: theme.colors.text.primary,
    },

    // ============================================
    // FORM ELEMENTS (used by children components)
    // ============================================
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border.main,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top' as const,
    },
    configSection: {
      backgroundColor: theme.colors.background.secondary,
      padding: 16,
      borderRadius: 8,
    },
  });

/**
 * Static styles for non-themed usage (fallback)
 * @deprecated Use createModalStyles with theme instead
 */
export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  light: {
    backgroundColor: '#FFFFFF',
  },
  dark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  lightText: {
    color: '#111827',
  },
  darkText: {
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
    color: '#111827',
  },
  content: {
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  opened: {
    zIndex: 1000,
    pointerEvents: 'auto' as const,
  },
  closed: {
    zIndex: -1,
    pointerEvents: 'none' as const,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  configSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
});