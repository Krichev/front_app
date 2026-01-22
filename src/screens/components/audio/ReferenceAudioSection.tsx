import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AudioPlayer} from '../AudioPlayer';

interface ReferenceAudioSectionProps {
  audioUrl?: string;
  segmentStart?: number;
  segmentEnd?: number;
  title?: string;
}

export const ReferenceAudioSection: React.FC<ReferenceAudioSectionProps> = ({
  audioUrl,
  segmentStart,
  segmentEnd,
  title = 'Listen to Reference',
}) => {
  if (!audioUrl) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <AudioPlayer 
        audioUrl={audioUrl}
        segmentStart={segmentStart}
        segmentEnd={segmentEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
