// components/CustomButton.tsx

import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {createStyles} from '../shared/ui/theme';

interface Props {
    title: string;
    onPress: () => void;
}

const CustomButton: React.FC<Props> = ({ title, onPress }) => {
    const styles = themeStyles;
    
    return (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
};

const themeStyles = createStyles(theme => ({
    button: {
        width: '70%',
        padding: 15,
        backgroundColor: theme.colors.info.main, // Was #1E90FF (DodgerBlue) -> Info Main is closest semantic or use a specific color if needed
        borderRadius: 25,
        alignItems: 'center',
        marginVertical: 15,
    },
    text: {
        fontSize: 24,
        color: theme.colors.neutral.white,
    },
}));

export default CustomButton;
