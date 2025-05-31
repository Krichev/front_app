// src/shared/lib/hooks/useVoiceRecording.ts
import {useCallback, useRef, useState} from 'react'

interface UseVoiceRecordingOptions {
    onTranscription?: (text: string) => void
    onError?: (error: string) => void
    language?: string
}

export const useVoiceRecording = ({
                                      onTranscription,
                                      onError,
                                      language = 'en-US'
                                  }: UseVoiceRecordingOptions = {}) => {
    const [isRecording, setIsRecording] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const [transcription, setTranscription] = useState('')
    const recognitionRef = useRef<any>(null)

    const startRecording = useCallback(async () => {
        try {
            // Check if speech recognition is supported
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                setIsSupported(false)
                onError?.('Speech recognition is not supported in this browser')
                return false
            }

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()

            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = language

            recognitionRef.current.onstart = () => {
                setIsRecording(true)
            }

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = ''
                let finalTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript
                    } else {
                        interimTranscript += transcript
                    }
                }

                const fullTranscript = finalTranscript || interimTranscript
                setTranscription(fullTranscript)
                onTranscription?.(fullTranscript)
            }

            recognitionRef.current.onerror = (event: any) => {
                onError?.(event.error)
            }

            recognitionRef.current.onend = () => {
                setIsRecording(false)
            }

            recognitionRef.current.start()
            return true
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to start recording')
            return false
        }
    }, [language, onTranscription, onError])

    const stopRecording = useCallback(() => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop()
        }
    }, [isRecording])

    const clearTranscription = useCallback(() => {
        setTranscription('')
    }, [])

    return {
        isRecording,
        isSupported,
        transcription,
        startRecording,
        stopRecording,
        clearTranscription
    }
}