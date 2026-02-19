/**
 * Compare two version strings segment by segment.
 * "1.0.0.153" vs "1.0.0.160"
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
    const partsA = a.replace(/^v/, '').split('.').map(Number);
    const partsB = b.replace(/^v/, '').split('.').map(Number);
    const maxLen = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < maxLen; i++) {
        const segA = partsA[i] || 0;
        const segB = partsB[i] || 0;
        if (segA < segB) return -1;
        if (segA > segB) return 1;
    }
    return 0;
}

/**
 * Check if current version requires a forced update
 */
export function isForceUpdateRequired(currentVersion: string, minSupported: string): boolean {
    return compareVersions(currentVersion, minSupported) < 0;
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
