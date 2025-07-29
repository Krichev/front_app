// src/shared/config/theme.ts
export const theme = {
    colors: {
        primary: '#4CAF50',
        primaryLight: '#E8F5E9',
        secondary: '#2196F3',
        error: '#F44336',
        errorLight: '#FFEBEE',
        warning: '#FF9800',
        success: '#4CAF50',
        successLight: '#E8F5E9',
        background: '#f5f5f5',
        surface: '#ffffff',
        text: {
            primary: '#333333',
            secondary: '#555555',
            tertiary: '#888888',     // ADD THIS - tertiary text color
            disabled: '#999999',
            light: '#666666',
            inverse: '#ffffff'
        },
        border: '#ddd',
        borderLight: '#f0f0f0',
        overlay: 'rgba(0, 0, 0, 0.5)',
        disabled: '#cccccc'
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        round: 20,
        circle: 50
    },
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24
    },
    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: 'bold' as const
    },
    shadow: {
        small: {
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        medium: {
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        large: {
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 3},
            shadowOpacity: 0.3,
            shadowRadius: 4,
        }
    }
} as const;