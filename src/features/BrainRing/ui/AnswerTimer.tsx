import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface AnswerTimerProps {
    deadline: string;
    onTimeout?: () => void;
}

export const AnswerTimer: React.FC<AnswerTimerProps> = ({ deadline, onTimeout }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const end = new Date(deadline).getTime();
            const diff = Math.max(0, Math.floor((end - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0 && onTimeout) {
                onTimeout();
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [deadline, onTimeout]);

    const getColor = () => {
        if (timeLeft <= 5) return '#F44336';
        if (timeLeft <= 10) return '#FF9800';
        return '#4CAF50';
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.timerText, { color: getColor() }]}>
                {timeLeft}s
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10,
    },
    timerText: {
        fontSize: 48,
        fontWeight: 'bold',
    },
});
