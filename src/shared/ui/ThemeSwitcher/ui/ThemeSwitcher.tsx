// import React from 'react';
// import {StyleSheet, TouchableOpacity} from 'react-native';
// import {SvgXml} from 'react-native-svg';
// import {Theme, useTheme} from "../../../../app/providers/ThemeProvider";
// import LightIcon from '../../../assets/icons/theme-light.svg'; // Replace with your actual SVG XML
// import DarkIcon from '../../../assets/icons/dark-icon.svg';
//
// interface ThemeSwitcherProps {
//     style?: any; // Add styles if needed
// }
//
// export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ style }) => {
//     const { theme, toggleTheme } = useTheme();
//
//     return (
//         <TouchableOpacity onPress={toggleTheme} style={[styles.button, style]}>
//             {theme === Theme.DARK ? (
//                 <SvgXml xml={DarkIcon} width="24" height="24" />
//             ) : (
//                 <SvgXml xml={LightIcon} width="24" height="24" />
//             )}
//         </TouchableOpacity>
//     );
// };
//
// const styles = StyleSheet.create({
//     button: {
//         padding: 10,
//     },
// });