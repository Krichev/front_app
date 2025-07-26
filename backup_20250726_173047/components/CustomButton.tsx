// components/CustomButton.tsx

import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
}

const CustomButton: React.FC<Props> = ({ title, onPress }) => (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        width: '70%',
        padding: 15,
        backgroundColor: '#1E90FF',
        borderRadius: 25,
        alignItems: 'center',
        marginVertical: 15,
    },
    text: {
        fontSize: 24,
        color: '#FFFFFF',
    },
});

export default CustomButton;
