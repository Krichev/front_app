// src/entities/CompetitiveMatch/hooks/useCompetitiveWebSocket.ts
import { useEffect, useState, useCallback } from 'react';

export interface CompetitiveEvent {
    type: 'MATCH_FOUND' | 'OPPONENT_READY' | 'ROUND_STARTED' | 'OPPONENT_SUBMITTED' | 'ROUND_RESULT' | 'MATCH_COMPLETED';
    payload: any;
}

export const useCompetitiveWebSocket = (matchId?: number) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<CompetitiveEvent | null>(null);

    useEffect(() => {
        if (!matchId) return;

        // Mock connection
        // In real implementation, connect to STOMP/WebSocket using matchId topic
        console.log(`🔌 [MockWS] Connecting to match ${matchId}...`);
        setIsConnected(true);

        return () => {
            console.log(`🔌 [MockWS] Disconnecting from match ${matchId}`);
            setIsConnected(false);
        };
    }, [matchId]);

    const sendMessage = useCallback((destination: string, body: any) => {
        console.log(`📤 [MockWS] Sending to ${destination}:`, body);
        // Mock sending
    }, []);

    return {
        isConnected,
        lastEvent,
        sendMessage
    };
};
