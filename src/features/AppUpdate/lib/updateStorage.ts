import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    LAST_CHECK: '@app_update_last_check',
    DISMISSED_VERSION: '@app_update_dismissed_version',
};

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function shouldCheckForUpdate(): Promise<boolean> {
    const lastCheck = await AsyncStorage.getItem(KEYS.LAST_CHECK);
    if (!lastCheck) return true;
    return Date.now() - parseInt(lastCheck, 10) > CHECK_INTERVAL_MS;
}

export async function markUpdateChecked(): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_CHECK, Date.now().toString());
}

export async function getDismissedVersion(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.DISMISSED_VERSION);
}

export async function dismissVersion(version: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.DISMISSED_VERSION, version);
}

export async function clearDismissedVersion(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.DISMISSED_VERSION);
}
