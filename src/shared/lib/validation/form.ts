// src/shared/lib/validation/form.ts
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export const validateForm = (
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
): ValidationResult => {
    const errors: Record<string, string> = {};

    Object.entries(rules).forEach(([field, rule]) => {
        const value = data[field];

        if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errors[field] = `${field} is required`;
            return;
        }

        if (value && typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = `${field} must be at least ${rule.minLength} characters`;
                return;
            }

            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `${field} must not exceed ${rule.maxLength} characters`;
                return;
            }

            if (rule.pattern && !rule.pattern.test(value)) {
                errors[field] = `${field} format is invalid`;
                return;
            }
        }

        if (rule.custom) {
            const customError = rule.custom(value);
            if (customError) {
                errors[field] = customError;
                return;
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};