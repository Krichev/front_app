import {StyleSheet, TextStyle, ViewStyle} from "react-native";
import {InputSize, InputState, InputVariant} from "./Input";
import {theme} from "../theme";

// Define the InputStyle type
interface InputStyle {
    container: ViewStyle;
    field: ViewStyle;
    text: TextStyle;
    label: TextStyle;
    supportText: TextStyle;
    addon: ViewStyle;
}

// Helper function to generate size-specific styles
const getSizeStyles = (size: InputSize): { container: ViewStyle; text: TextStyle } => {
    const sizeStyles: Record<InputSize, { container: ViewStyle; text: TextStyle }> = {
        [InputSize.SMALL]: {
            container: {
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                minHeight: 32,
            },
            text: {
                fontSize: theme.typography.fontSize.sm,
                lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
            },
        },
        [InputSize.MEDIUM]: {
            container: {
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                minHeight: 40,
            },
            text: {
                fontSize: theme.typography.fontSize.base,
                lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
            },
        },
        [InputSize.LARGE]: {
            container: {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                minHeight: 48,
            },
            text: {
                fontSize: theme.typography.fontSize.lg,
                lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
            },
        },
    };
    return sizeStyles[size];
};

// Helper function to generate variant-specific styles
const getVariantStyles = (variant: InputVariant): ViewStyle => {
    const variantStyles: Record<InputVariant, ViewStyle> = {
        [InputVariant.DEFAULT]: {
            ...theme.components.input.field,
        },
        [InputVariant.OUTLINE]: {
            ...theme.components.input.field,
            borderWidth: theme.layout.borderWidth.thick,
            borderColor: theme.colors.border.main,
        },
        [InputVariant.FILLED]: {
            ...theme.components.input.field,
            backgroundColor: theme.colors.background.secondary,
            borderWidth: theme.layout.borderWidth.none,
            borderBottomWidth: theme.layout.borderWidth.thick,
            borderBottomColor: theme.colors.border.main,
            borderRadius: theme.layout.borderRadius.sm,
        },
        [InputVariant.UNDERLINE]: {
            backgroundColor: 'transparent',
            borderWidth: theme.layout.borderWidth.none,
            borderBottomWidth: theme.layout.borderWidth.thin,
            borderBottomColor: theme.colors.border.main,
            borderRadius: 0,
            paddingHorizontal: 0,
        },
    };
    return variantStyles[variant];
};

// Helper function to generate state-specific styles
const getStateStyles = (state: InputState): { field: ViewStyle; text: TextStyle } => {
    const stateStyles: Record<InputState, { field: ViewStyle; text: TextStyle }> = {
        [InputState.DEFAULT]: {
            field: {},
            text: {
                color: theme.colors.text.primary,
            },
        },
        [InputState.FOCUSED]: {
            field: {
                ...theme.components.input.focused,
                shadowColor: theme.colors.primary.main,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
            },
            text: {
                color: theme.colors.text.primary,
            },
        },
        [InputState.ERROR]: {
            field: {
                ...theme.components.input.error,
                shadowColor: theme.colors.error.main,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
            },
            text: {
                color: theme.colors.text.primary,
            },
        },
        [InputState.DISABLED]: {
            field: {
                ...theme.components.input.disabled,
                opacity: 0.6,
            },
            text: {
                ...theme.components.input.disabledText,
            },
        },
        [InputState.READONLY]: {
            field: {
                ...theme.components.input.disabled,
                backgroundColor: theme.colors.background.tertiary,
            },
            text: {
                color: theme.colors.text.secondary,
            },
        },
    };
    return stateStyles[state];
};

// Helper function to get support text styles (helper or error)
const getSupportTextStyles = (isError: boolean): TextStyle => {
    return isError
        ? theme.components.input.errorText
        : theme.components.input.helperText;
};

// Main function to generate input styles
export const getInputStyle = (
    variant: InputVariant,
    size: InputSize,
    state: InputState,
    hasAddons: boolean,
    isErrorText: boolean = false
): InputStyle => {
    const sizeStyles = getSizeStyles(size);
    const variantStyles = getVariantStyles(variant);
    const stateStyles = getStateStyles(state);
    const supportTextStyles = getSupportTextStyles(isErrorText);

    const baseContainerStyles: ViewStyle = {
        flexDirection: hasAddons ? 'row' : 'column',
        alignItems: hasAddons ? 'center' : 'stretch',
    };

    const fieldStyles = StyleSheet.create({
        field: {
            ...variantStyles,
            ...sizeStyles.container,
            ...stateStyles.field,
            ...(hasAddons && {
                flexDirection: 'row',
                alignItems: 'center',
            }),
        },
    }).field;

    const textStyles = StyleSheet.create({
        text: {
            flex: hasAddons ? 1 : undefined,
            ...sizeStyles.text,
            ...stateStyles.text,
            fontFamily: theme.typography.fontFamily.primary,
            fontWeight: theme.typography.fontWeight.regular,
        },
    }).text;

    const labelStyles = StyleSheet.create({
        label: {
            ...theme.components.input.label,
        },
    }).label;

    const addonStyles = StyleSheet.create({
        addon: {
            justifyContent: 'center',
            alignItems: 'center',
        },
    }).addon;

    return {
        container: StyleSheet.create({
            container: {
                ...theme.components.input.container,
                ...baseContainerStyles,
            },
        }).container,
        field: fieldStyles,
        text: textStyles,
        label: labelStyles,
        supportText: StyleSheet.create({ supportText: supportTextStyles }).supportText,
        addon: addonStyles,
    };
};

// Helper function to get addon styles
export const getAddonStyles = (position: 'left' | 'right'): ViewStyle => {
    return StyleSheet.create({
        addon: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.xs,
            [position === 'left' ? 'marginRight' : 'marginLeft']: theme.spacing.sm,
        },
    }).addon;
};

// Helper function to get placeholder text color based on state
export const getPlaceholderTextColor = (state: InputState): string => {
    switch (state) {
        case InputState.DISABLED:
        case InputState.READONLY:
            return theme.colors.text.disabled;
        case InputState.ERROR:
            return theme.colors.error.light;
        default:
            return theme.colors.text.disabled;
    }
};

// Export additional utility functions
export const inputStyleUtils = {
    getSizeStyles,
    getVariantStyles,
    getStateStyles,
    getSupportTextStyles,
    getAddonStyles,
    getPlaceholderTextColor,
};