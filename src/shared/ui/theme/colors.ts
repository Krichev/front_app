// src/shared/ui/theme/colors.ts
import type {Colors} from './types';

export const colors: Colors = {
    // Primary colors
    primary: {
        main: '#007AFF',
        light: '#4DA3FF',
        dark: '#0051B3',
        contrast: '#FFFFFF',
    },

    // Secondary colors
    secondary: {
        main: '#FF6B6B',
        light: '#FF9999',
        dark: '#CC5555',
        contrast: '#FFFFFF',
    },

    // Neutral colors
    neutral: {
        white: '#FFFFFF',
        black: '#000000',
        gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
        },
    },

    // Semantic colors
    success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
        background: '#ECFDF5',
    },

    error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
        background: '#FEE2E2',
    },

    warning: {
        main: '#F59E0B',
        light: '#FCD34D',
        dark: '#D97706',
        background: '#FEF3C7',
    },

    info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
        background: '#EFF6FF',
    },

    // Background colors
    background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
    },

    // Text colors
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        disabled: '#9CA3AF',
        inverse: '#FFFFFF',
    },

    // Border colors
    border: {
        light: '#E5E7EB',
        main: '#D1D5DB',
        dark: '#9CA3AF',
    },
};