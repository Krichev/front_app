import {useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext} from './ThemeContext';

interface UseThemeResult {
    toggleTheme: () => void;
    theme: Theme;
}

export function useTheme(): UseThemeResult {
    const { theme, setTheme } = useContext(ThemeContext);

    // Toggle between light and dark themes
    const toggleTheme = async () => {
        const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;

        // Update the theme in the context
        if (setTheme) {
            setTheme(newTheme);
        }

        // Persist the selected theme using AsyncStorage
        await AsyncStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
    };

    return {
        theme: theme || Theme.LIGHT, // Default to LIGHT if theme is undefined
        toggleTheme,
    };
}