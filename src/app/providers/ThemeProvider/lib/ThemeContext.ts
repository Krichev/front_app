// import {createContext, useContext} from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
//
// export enum Theme {
//     LIGHT = 'light',
//     DARK = 'dark',
// }
//
// export interface ThemeContextProps {
//     theme?: Theme;
//     setTheme?: (theme: Theme) => void;
// }
//
// export const ThemeContext = createContext<ThemeContextProps>({});
//
// export const LOCAL_STORAGE_THEME_KEY = 'theme';
//
// interface UseThemeResult {
//     toggleTheme: () => void;
//     theme: Theme;
// }
//
// export function useTheme(): UseThemeResult {
//     const { theme, setTheme } = useContext(ThemeContext);
//
//     const toggleTheme = async () => {
//         const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
//         if (setTheme) {
//             setTheme(newTheme);
//             await AsyncStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
//         }
//     };
//
//     return {
//         theme: theme || Theme.LIGHT,
//         toggleTheme,
//     };
// }