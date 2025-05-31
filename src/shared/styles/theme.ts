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
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: 'bold'
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
    },
    // Add common game colors
    gameColors: {
        correct: '#4CAF50',
        incorrect: '#F44336',
        warning: '#FF9800',
        info: '#2196F3',
        timerDanger: '#F44336',
        timerWarning: '#FF9800',
        timerSafe: '#4CAF50',
    },

    // Add common transitions
    transitions: {
        fast: 150,
        normal: 300,
        slow: 500,
    },

    // Add common z-indices
    zIndex: {
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modal: 1040,
        popover: 1050,
        tooltip: 1060,
    },
} as const