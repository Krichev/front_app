// Additional validation functions
export const validateRequired = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
    return value && value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
    return !value || value.length <= maxLength;
};

export const validatePattern = (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
};

export const validateRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
};
// src/shared/lib/validation/index.ts
export { validateEmail } from './email';
export { validatePassword } from './password';
export { validateForm } from './form';
export { validateFile } from './file';