// src/shared/components/Icon/Icon.tsx - Updated with missing icons and style support
import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';
import {ViewStyle} from 'react-native';

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: ViewStyle; // Add style prop support
}

export const CustomIcon: React.FC<IconProps> = ({
                                              name,
                                              size = 24,
                                              color = '#000',
                                              style
                                          }) => {
    const getIconPath = () => {
        switch (name) {
            case 'brain':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M21.33 12.91C21.33 14.5 20.83 15.91 19.97 17.04C19.97 17.04 19.71 17.4 19.32 17.86C18.54 18.75 17.43 19.91 15.83 19.91C14.23 19.91 13.12 18.75 12.34 17.86L12 17.46L11.66 17.86C10.88 18.75 9.77 19.91 8.17 19.91C6.57 19.91 5.46 18.75 4.68 17.86C4.29 17.4 4.03 17.04 4.03 17.04C3.17 15.91 2.67 14.5 2.67 12.91C2.67 9.87 4.65 7.3 7.4 6.4C8.17 3.71 10.83 1.66 14 1.66C17.17 1.66 19.83 3.71 20.6 6.4C23.35 7.3 21.33 9.87 21.33 12.91Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'account-edit':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M21.7 13.35L20.7 14.35L18.65 12.3L19.65 11.3C19.86 11.09 20.21 11.09 20.42 11.3L21.7 12.58C21.91 12.79 21.91 13.14 21.7 13.35M12 18.94L18.06 12.88L20.11 14.93L14.05 21H12V18.94M12 14C13.1 14 14 13.1 14 12S13.1 10 12 10 10 10.9 10 12 10.9 14 12 14M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M21 9H15L13.5 7.5C13.1 7.1 12.6 6.9 12 6.9S10.9 7.1 10.5 7.5L9 9H3C1.9 9 1 9.9 1 11V20C1 21.1 1.9 22 3 22H21C22.1 22 23 21.1 23 20V11C23 9.9 22.1 9 21 9Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'alert-circle-outline':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'close':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'trophy':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,1L15,7H23L17,11L19,23L12,19L5,23L7,11L1,7H9L12,1Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'thumb-up':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M5,9V21H1V9H5M9,21A2,2 0 0,1 7,19V9C7,8.45 7.22,7.95 7.59,7.59L14.17,1L15.23,2.06C15.5,2.33 15.67,2.7 15.67,3.11L15.64,3.43L14.69,8H21C22.11,8 23,8.9 23,10V12C23,12.26 22.95,12.5 22.86,12.73L19.84,19.78C19.54,20.5 18.83,21 18,21H9M9,19H18.03L21,12V10H12.21L13.34,4.68L9,9.03V19Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'heart':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'help-circle':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,2C6.48,2 2,6.48 2,12S6.48,22 12,22S22,17.52 22,12S17.52,2 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6M11,16H13V18H11V16Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'play-circle':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5V7.5L16,12L10,16.5Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'account-group':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'pencil':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'comment-text':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M6,7V9H18V7H6M6,11V13H15V11H6Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'information':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                            fill={color}
                        />
                    </Svg>
                );

            // NEW ICONS - Missing from original component
            case 'run':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M13.5,5.5C14.59,5.5 15.5,4.59 15.5,3.5S14.59,1.5 13.5,1.5S11.5,2.41 11.5,3.5S12.41,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7.08C13.69,7.08 13.5,6.5 13,6.5S12.31,7.08 12.31,7.08L9.93,9.63C9.93,9.63 9.31,10.13 9.31,10.63S9.93,11.63 9.93,11.63L11.31,10.25L14.69,8.58L14.19,10L11.5,8.5L9.31,10.69C8.81,11.19 8.31,12.25 8.31,13.25C8.31,13.25 8.5,14.63 9,15.13L11.31,17.44C11.81,17.94 12.31,18.44 12.31,19.44C12.31,19.44 12.31,20.94 12.31,20.94C12.31,20.94 12.31,22.13 12.31,22.13H14.31C14.31,22.13 14.31,19.94 14.31,19.94L9.89,19.38Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'calendar-check':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19M10.56,17.46L16.5,11.5L15.43,10.44L10.56,15.31L8.45,13.19L7.39,14.25L10.56,17.46Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'checkbox-marked-circle-outline':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M10.56,15.89L16.95,9.5L15.54,8.08L10.56,13.06L8.47,11L7.05,12.39L10.56,15.89Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'magnify':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'trophy-outline':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,1L15,7H23L17,11L19,23L12,19L5,23L7,11L1,7H9L12,1M12,4.3L10.5,8H6.9L9.9,10.3L8.8,14.7L12,12.6L15.2,14.7L14.1,10.3L17.1,8H13.5L12,4.3Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'account-search-outline':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14A2.5,2.5 0 0,0 13,16.5A2.5,2.5 0 0,0 15.5,19A2.5,2.5 0 0,0 18,16.5A2.5,2.5 0 0,0 15.5,14M10,4A4,4 0 0,1 14,8C14,8.91 13.69,9.75 13.18,10.43C12.32,10.75 11.55,11.26 10.91,11.9L10,12A4,4 0 0,1 6,8A4,4 0 0,1 10,4M2,20V18C2,15.88 5.31,14.14 9.5,14C9.18,14.78 9,15.62 9,16.5C9,17.79 9.38,19 10,20H2Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'delete':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'edit':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'check':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'check-circle':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'plus':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'star':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'chevron-right':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'alert-circle':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z"
                            fill={color}
                        />
                    </Svg>
                );

            // Additional icons found in your project
            case 'camera':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'map-marker':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'microphone':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'video':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'qrcode-scan':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M4,4H10V10H4V4M20,4V10H14V4H20M14,15H16V13H14V11H16V13H18V11H20V13H18V15H20V18H18V20H16V18H13V20H11V16H14V15M16,15V18H18V15H16M4,20V14H10V20H4M6,6V8H8V6H6M16,6V8H18V6H16M6,16V18H8V16H6M4,11H6V13H4V11M9,11H13V15H11V13H9V11M11,6H13V10H11V6M2,2V6H0V2A2,2 0 0,1 2,0H6V2H2M22,0A2,2 0 0,1 24,2V6H22V2H18V0H22M2,18V22H6V24H2A2,2 0 0,1 0,22V18H2M22,22V18H24V22A2,2 0 0,1 22,24H18V22H22Z"
                            fill={color}
                        />
                    </Svg>
                );

            case 'fingerprint':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Path
                            d="M17.81,4.47C17.73,4.47 17.65,4.45 17.58,4.41C15.66,3.42 14,3.42 12,3.42S8.34,3.42 6.42,4.41C6.26,4.5 6.07,4.43 5.97,4.28C5.88,4.12 5.95,3.93 6.11,3.83C8.24,2.71 10.24,2.71 12,2.71S15.76,2.71 17.89,3.83C18.05,3.93 18.12,4.12 18.03,4.28C17.97,4.38 17.89,4.47 17.81,4.47M3.5,9.72C3.4,9.72 3.31,9.69 3.26,9.62C3.17,9.5 3.2,9.33 3.32,9.25C5.1,8 7.55,7.35 12,7.35S18.9,8 20.68,9.25C20.8,9.33 20.83,9.5 20.74,9.62C20.66,9.74 20.5,9.77 20.37,9.68C18.72,8.5 15.78,7.89 12,7.89S5.28,8.5 3.63,9.68C3.58,9.71 3.54,9.72 3.5,9.72M9.75,21.79C9.62,21.79 9.5,21.7 9.46,21.58C9.4,21.41 9.5,21.24 9.68,21.18C10.8,20.84 11.72,19.9 12.31,18.65C12.64,17.9 12.8,17.13 12.8,16.5C12.8,15.85 12.64,15.09 12.31,14.35C11.72,13.1 10.8,12.16 9.68,11.82C9.5,11.76 9.4,11.59 9.46,11.42C9.5,11.3 9.62,11.21 9.75,11.21C11.09,11.6 12.16,12.68 12.85,14.13C13.24,14.96 13.44,15.73 13.44,16.5S13.24,18.04 12.85,18.87C12.16,20.32 11.09,21.4 9.75,21.79M16.92,19.94C15.73,19.94 14.68,19.64 13.82,19.05C12.96,18.46 12.29,17.58 11.84,16.45C11.18,14.88 11.18,13.12 11.84,11.55C12.29,10.42 12.96,9.54 13.82,8.95C14.68,8.36 15.73,8.06 16.92,8.06C18.11,8.06 19.16,8.36 20.02,8.95C20.88,9.54 21.55,10.42 22,11.55C22.66,13.12 22.66,14.88 22,16.45C21.55,17.58 20.88,18.46 20.02,19.05C19.16,19.64 18.11,19.94 16.92,19.94M16.92,8.6C15.89,8.6 14.99,8.84 14.26,9.32C13.53,9.8 12.96,10.52 12.57,11.43C11.97,12.8 11.97,14.2 12.57,15.57C12.96,16.48 13.53,17.2 14.26,17.68C14.99,18.16 15.89,18.4 16.92,18.4C17.95,18.4 18.85,18.16 19.58,17.68C20.31,17.2 20.88,16.48 21.27,15.57C21.87,14.2 21.87,12.8 21.27,11.43C20.88,10.52 20.31,9.8 19.58,9.32C18.85,8.84 17.95,8.6 16.92,8.6Z"
                            fill={color}
                        />
                    </Svg>
                );

            default:
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
                        <Circle cx={12} cy={12} r={10} fill={color} />
                    </Svg>
                );
        }
    };

    return getIconPath();
};