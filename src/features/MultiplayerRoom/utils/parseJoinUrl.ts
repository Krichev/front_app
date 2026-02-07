export const parseJoinUrl = (url: string): string | null => {
    if (!url) return null;

    // Handle full URLs: https://play.yourapp.com/join/ABC123
    // or custom schemes: challengerapp://join/ABC123
    const joinMatch = url.match(/\/join\/([A-Z0-9]{6})/i);
    if (joinMatch && joinMatch[1]) {
        return joinMatch[1].toUpperCase();
    }

    // Handle plain 6-char codes
    if (/^[A-Z0-9]{6}$/i.test(url)) {
        return url.toUpperCase();
    }

    return null;
};
