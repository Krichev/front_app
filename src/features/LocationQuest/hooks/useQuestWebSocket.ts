import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';
import NetworkConfigManager from '../../../config/NetworkConfig';
import { ParticipantLocationDTO } from '../../../entities/LocationQuest';

const WS_URL = `${NetworkConfigManager.getInstance().getBaseUrl()}/ws-game`;

export const useQuestWebSocket = (questId?: number) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');
    const [participants, setParticipants] = useState<ParticipantLocationDTO[]>([]);
    const [lastEvent, setLastEvent] = useState<any | null>(null);
    
    const clientRef = useRef<Client | null>(null);
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.deactivate();
            clientRef.current = null;
            setIsConnected(false);
            setConnectionStatus('DISCONNECTED');
        }
    }, []);

    const connect = useCallback(() => {
        if (!questId || !accessToken) return;

        disconnect();
        setConnectionStatus('CONNECTING');

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: {
                Authorization: `Bearer ${accessToken}`
            },
            onConnect: () => {
                setIsConnected(true);
                setConnectionStatus('CONNECTED');

                // Subscribe to quest progress updates
                client.subscribe(`/topic/quest/${questId}/progress`, (message) => {
                    const data = JSON.parse(message.body);
                    if (data.participants) {
                        setParticipants(data.participants);
                    }
                    setLastEvent({ type: 'PROGRESS', data });
                });

                // Subscribe to quest events
                client.subscribe(`/topic/quest/${questId}/events`, (message) => {
                    setLastEvent({ type: 'EVENT', data: message.body });
                });

                // Subscribe to personal hint messages
                client.subscribe('/user/queue/quest-hints', (message) => {
                    setLastEvent({ type: 'HINT', data: message.body });
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
                setConnectionStatus('DISCONNECTED');
            },
            onStompError: (frame) => {
                console.error('❌ Stomp error', frame);
                setConnectionStatus('ERROR');
            }
        });

        client.activate();
        clientRef.current = client;
    }, [questId, accessToken, disconnect]);

    useEffect(() => {
        if (questId) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [questId, connect, disconnect]);

    return {
        isConnected,
        connectionStatus,
        participants,
        lastEvent,
        reconnect: connect
    };
};
