// src/hooks/useAudioRecorder.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';

interface UseAudioRecorderResult {
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<string | null>;
    isRecording: boolean;
    duration: number;
    audioPath: string | null;
    playAudio: () => void;
    stopPlayback: () => void;
    isPlaying: boolean;
    resetRecording: () => void;
    hasPermission: boolean;
    initializeRecorder: () => Promise<void>;
}

export const useAudioRecorder = (): UseAudioRecorderResult => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioPath, setAudioPath] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const soundRef = useRef<Sound | null>(null);
    const durationInterval = useRef<NodeJS.Timeout | null>(null);

    const requestPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'App needs access to your microphone to record audio.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const initializeRecorder = useCallback(async () => {
        const permission = await requestPermission();
        setHasPermission(permission);
        
        if (!permission) return;

        const options = {
            sampleRate: 44100,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,
            wavFile: 'audio_challenge_ref.wav'
        };

        try {
            AudioRecord.init(options);
            setIsInitialized(true);
        } catch (error) {
            console.error('Failed to init AudioRecord', error);
        }
    }, []);

    useEffect(() => {
        // cleanup
        return () => {
            if (durationInterval.current) clearInterval(durationInterval.current);
            if (soundRef.current) {
                soundRef.current.stop();
                soundRef.current.release();
            }
        };
    }, []);

    const startRecording = async () => {
        if (!isInitialized) {
            await initializeRecorder();
        }
        
        if (!hasPermission) {
            Alert.alert('Permission missing', 'Please grant microphone permission.');
            return;
        }

        try {
            setDuration(0);
            setAudioPath(null);
            AudioRecord.start();
            setIsRecording(true);
            
            durationInterval.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording', error);
        }
    };

    const stopRecording = async (): Promise<string | null> => {
        if (!isRecording) return null;

        try {
            const file = await AudioRecord.stop();
            if (durationInterval.current) clearInterval(durationInterval.current);
            setIsRecording(false);
            setAudioPath(file);
            return file;
        } catch (error) {
            console.error('Failed to stop recording', error);
            return null;
        }
    };

    const playAudio = () => {
        if (!audioPath) return;

        // Enable playback in silence mode
        Sound.setCategory('Playback');

        const sound = new Sound(audioPath, '', (error) => {
            if (error) {
                console.error('Failed to load sound', error);
                return;
            }
            
            soundRef.current = sound;
            setIsPlaying(true);
            
            sound.play((_success) => {
                setIsPlaying(false);
                sound.release();
                soundRef.current = null;
            });
        });
    };

    const stopPlayback = () => {
        if (soundRef.current && isPlaying) {
            soundRef.current.stop();
            setIsPlaying(false);
        }
    };

    const resetRecording = () => {
        stopPlayback();
        setAudioPath(null);
        setDuration(0);
    };

    return {
        startRecording,
        stopRecording,
        isRecording,
        duration,
        audioPath,
        playAudio,
        stopPlayback,
        isPlaying,
        resetRecording,
        hasPermission,
        initializeRecorder
    };
};
