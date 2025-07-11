import React from 'react'
import {StyleSheet, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'

interface CardProps {
    children: React.ReactNode
    padding?: keyof typeof theme.spacing
    margin?: keyof typeof theme.spacing
    style?: ViewStyle | ViewStyle[] | (ViewStyle | false | undefined)[]
    shadow?: 'small' | 'medium' | 'large'
}

export const CustomCard: React.FC<CardProps> = ({
                                                    children,
                                                    padding = 'lg',
                                                    margin = 'lg',
                                                    style,
                                                    shadow = 'medium'
                                                }) => {
    const processedStyle = React.useMemo(() => {
        if (!style) return undefined
        if (Array.isArray(style)) {
            const validStyles = style.filter(Boolean) as ViewStyle[]
            return StyleSheet.flatten(validStyles)
        }
        return style
    }, [style])

    return (
        <View
            style={[
                styles.card,
                {
                    padding: theme.spacing[padding],
                    marginBottom: theme.spacing[margin]
                },
                theme.shadow[shadow],
                processedStyle
            ]}
        >
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
    },
})
