// src/app/providers/ThemeProvider/ui/ThemeProvider.tsx
import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext} from "../lib/ThemeContext";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(Theme.LIGHT);

    useEffect(() => {
        const loadTheme = async () => {
            const storedTheme = await AsyncStorage.getItem(LOCAL_STORAGE_THEME_KEY);
            if (storedTheme && (storedTheme === Theme.LIGHT || storedTheme === Theme.DARK)) {
                setTheme(storedTheme as Theme);
            }
        };
        loadTheme();
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};