export const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const isValidYouTubeUrl = (url: string): boolean => {
    return !!extractYouTubeVideoId(url);
};

export const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export const formatSecondsToTimestamp = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const parseTimestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(':').map(part => parseInt(part, 10));
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
};

export const isValidVideoUrl = (url: string): boolean => {
    if (!url) return false;
    // Check YouTube
    if (isValidYouTubeUrl(url)) return true;
    // Check Vimeo
    if (/vimeo\.com\/\d+/.test(url)) return true;
    // Check direct video URL
    if (/\.(mp4|webm|mov|avi)(\?|$)/i.test(url)) return true;
    // Check if it's a valid URL at all
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const detectVideoPlatform = (url: string): 'youtube' | 'vimeo' | 'direct' | null => {
    if (!url) return null;
    if (isValidYouTubeUrl(url)) return 'youtube';
    if (/vimeo\.com\/\d+/.test(url)) return 'vimeo';
    if (/\.(mp4|webm|mov|avi)(\?|$)/i.test(url)) return 'direct';
    return null;
};
