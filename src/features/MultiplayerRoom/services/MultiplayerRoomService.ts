import { useMultiplayerWebSocket } from '../hooks/useMultiplayerWebSocket';
import { useCallback } from 'react';

export const useMultiplayerRoomService = (roomCode?: string) => {
    const ws = useMultiplayerWebSocket(roomCode);

    const submitAnswer = useCallback((questionId: number, answer: string) => {
        if (roomCode) {
            ws.sendMessage(`/app/room/${roomCode}/answer`, {
                questionId,
                answer,
                timestamp: new Date().toISOString()
            });
        }
    }, [roomCode, ws]);

    const sendReady = useCallback(() => {
        if (roomCode) {
            ws.sendMessage(`/app/room/${roomCode}/ready`, {});
        }
    }, [roomCode, ws]);

    const sendBuzz = useCallback(() => {
        if (roomCode) {
            ws.sendMessage(`/app/room/${roomCode}/buzz`, {
                timestamp: new Date().toISOString()
            });
        }
    }, [roomCode, ws]);

    return {
        ...ws,
        submitAnswer,
        sendReady,
        sendBuzz
    };
};
