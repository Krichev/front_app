// src/shared/ui/Button/index.ts

// Main component export
export { Button } from './Button';

// Enums and types
export { ButtonVariant, ButtonSize } from './Button';
export type { ButtonProps } from './Button';

// Legacy support (for backward compatibility)
export { ButtonTheme } from './Button';

// Custom hooks
export {
    useButton,
    useIconButton,
    useButtonGroup,
    useAnimatedButton,
} from './useButton';

// Style utilities and helpers
export {
    getButtonStylesFromTheme,
    staticButtonStyles,
    createCustomButtonVariant,
    createCommonButtonStyles,
    buttonAnimations,
    getButtonAccessibilityProps,
} from './Button.styles';

// Re-export types for external use
export type {
    UseButtonOptions,
    UseButtonReturn,
} from './useButton';

// Default export (main component)
export { Button as default } from './Button';