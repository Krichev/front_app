// src/screens/competitive/CompetitiveHistoryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGetUserMatchesQuery } from '../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { useTheme } from '../../shared/ui/theme';
import { CompetitiveMatch } from '../../entities/CompetitiveMatch/model/types';

export const CompetitiveHistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { data: matches, isLoading } = useGetUserMatchesQuery({});

    const renderItem = ({ item }: { item: CompetitiveMatch }) => (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}
            onPress={() => navigation.navigate('MatchResult', { matchId: item.id })}
        >
            <View style={styles.row}>
                <Text style={[styles.type, { color: theme.colors.primary.main }]}>
                    {t(`audioChallenge.types.${item.audioChallengeType}.label`)}
                </Text>
                <Text style={[styles.date, { color: theme.colors.text.secondary }]}>
                    {new Date(item.createdAt || '').toLocaleDateString()}
                </Text>
            </View>
            <Text style={[styles.vs, { color: theme.colors.text.primary }]}>
                vs {item.player2Username || t('competitive.history.opponent')}
            </Text>
            <Text style={[styles.status, { color: item.status === 'COMPLETED' ? theme.colors.success.main : theme.colors.text.secondary }]}>
                {item.status}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <FlatList
                data={matches}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={[styles.empty, { color: theme.colors.text.secondary }]}>
                        {t('competitive.history.noMatches')}
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    type: {
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    vs: {
        fontSize: 16,
        marginBottom: 4,
    },
    status: {
        fontSize: 12,
        fontWeight: '600',
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
    },
});
