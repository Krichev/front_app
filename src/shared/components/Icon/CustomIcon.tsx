import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

interface IconProps {
    name: string;
    size?: number;
    color?: string;
}

export const CustomIcon: React.FC<IconProps> = ({
                                              name,
                                              size = 24,
                                              color = '#000'
                                          }) => {
    const getIconPath = () => {
        switch (name) {
            case 'brain':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M21.33 12.91C21.33 14.5 20.83 15.91 19.97 17.04C19.97 17.04 19.71 17.4 19.32 17.86C18.54 18.75 17.43 19.91 15.83 19.91C14.23 19.91 13.12 18.75 12.34 17.86L12 17.46L11.66 17.86C10.88 18.75 9.77 19.91 8.17 19.91C6.57 19.91 5.46 18.75 4.68 17.86C4.29 17.4 4.03 17.04 4.03 17.04C3.17 15.91 2.67 14.5 2.67 12.91C2.67 9.87 4.65 7.3 7.4 6.4C8.17 3.71 10.83 1.66 14 1.66C17.17 1.66 19.83 3.71 20.6 6.4C23.35 7.3 21.33 9.87 21.33 12.91Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'account-edit':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M21.7 13.35L20.7 14.35L18.65 12.3L19.65 11.3C19.86 11.09 20.21 11.09 20.42 11.3L21.7 12.58C21.91 12.79 21.91 13.14 21.7 13.35M12 18.94L18.06 12.88L20.11 14.93L14.05 21H12V18.94M12 14C13.1 14 14 13.1 14 12S13.1 10 12 10 10 10.9 10 12 10.9 14 12 14M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M21 9H15L13.5 7.5C13.1 7.1 12.6 6.9 12 6.9S10.9 7.1 10.5 7.5L9 9H3C1.9 9 1 9.9 1 11V20C1 21.1 1.9 22 3 22H21C22.1 22 23 21.1 23 20V11C23 9.9 22.1 9 21 9Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'alert-circle-outline':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'close':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'trophy':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M12,1L14.5,6.5H20.5L15.75,10L17.25,15.5L12,12L6.75,15.5L8.25,10L3.5,6.5H9.5L12,1Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'thumb-up':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M5,9V21H1V9H5M9,21A2,2 0 0,1 7,19V9C7,8.45 7.22,7.95 7.59,7.59L14.17,1L15.23,2.06C15.5,2.33 15.67,2.7 15.67,3.11L15.64,3.43L14.69,8H21C22.11,8 23,8.9 23,10V12C23,12.26 22.95,12.5 22.86,12.73L19.84,19.78C19.54,20.5 18.83,21 18,21H9M9,19H18.03L21,12V10H12.21L13.34,4.68L9,9.03V19Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'heart':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'help-circle':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M12,2C6.48,2 2,6.48 2,12S6.48,22 12,22S22,17.52 22,12S17.52,2 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6M11,16H13V18H11V16Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'play-circle':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5V7.5L16,12L10,16.5Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'account-group':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'pencil':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'comment-text':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M6,7V9H18V7H6M6,11V13H15V11H6Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'information':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'delete':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'edit':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'check':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                            fill={color}
                        />
                    </Svg>
                );
            case 'plus':
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Path
                            d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                            fill={color}
                        />
                    </Svg>
                );
            default:
                return (
                    <Svg width={size} height={size} viewBox="0 0 24 24">
                        <Circle cx={12} cy={12} r={10} fill={color} />
                    </Svg>
                );
        }
    };

    return getIconPath();
};