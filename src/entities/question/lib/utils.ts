// src/entities/question/lib/utils.ts
export const normalizeAnswer = (answer: string): string => {
    return answer
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^(the|a|an)\s+/i, ''); // Remove articles
};

export const cleanQuestionText = (text: string): string => {
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '');

    // Replace HTML entities
    cleaned = cleaned
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
};

export const formatQuestionForDisplay = (question: string): string => {
    // Capitalize first letter
    const formatted = question.charAt(0).toUpperCase() + question.slice(1);

    // Ensure it ends with a question mark if it's a question
    if (formatted.includes('?') || formatted.startsWith('What') ||
        formatted.startsWith('Who') || formatted.startsWith('Where') ||
        formatted.startsWith('When') || formatted.startsWith('How')) {
        return formatted.endsWith('?') ? formatted : formatted + '?';
    }

    return formatted;
};

export const isValidQuestion = (question: QuestionData): boolean => {
    return !!(
        question.id &&
        question.question &&
        question.answer &&
        question.question.trim().length > 5 &&
        question.answer.trim().length > 1
    );
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
};

export const highlightKeywords = (text: string, keywords: string[]): string => {
    let highlighted = text;

    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        highlighted = highlighted.replace(regex, `**${keyword}**`);
    });

    return highlighted;
};

export const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];

    return words
        .filter(word => word.length > 3 && !stopWords.includes(word))
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, 5); // Top 5 keywords
};