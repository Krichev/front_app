import React from 'react';
import {Animated, View} from 'react-native';
import {styles} from "./Loader.styles.ts";

const Loader = () => {
    const animationValues = [
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ];

    React.useEffect(() => {
        const animations = animationValues.map((value, index) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(value, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(value, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
        });

        animations.forEach(animation => animation.start());

        return () => {
            animations.forEach(animation => animation.stop());
        };
    }, []);

    const getAnimationStyle = (index: number) => {
        if (index === 0 || index === 3) {
            // Scale animation for first and last dots
            return {
                transform: [
                    {
                        scale: animationValues[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                        }),
                    },
                ],
            };
        } else {
            // Translate animation for middle dots
            return {
                transform: [
                    {
                        translateX: animationValues[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 24],
                        }),
                    },
                ],
            };
        }
    };

    return (
        <View style={styles.container}>
            {animationValues.map((_, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.dot,
                        { left: index * 24 + 8 },
                        getAnimationStyle(index),
                    ]}
                />
            ))}
        </View>
    );
};


export default Loader;