import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/providers/StoreProvider/store';
import { GamePhase, GameState, RoomPlayer, PlayerRole } from '../types';

const WS_URL = 'http://10.0.2.2:8082/challenger/ws-game';

export const useMultiplayerWebSocket = (roomCode?: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [players, setPlayers] = useState<RoomPlayer[]>([]);
    
    const clientRef = useRef<Client | null>(null);
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const user = useSelector((state: RootState) => state.auth.user);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.deactivate();
            clientRef.current = null;
            setIsConnected(false);
            setConnectionStatus('DISCONNECTED');
        }
    }, []);

    const connect = useCallback(() => {
        if (!roomCode || !accessToken) return;

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

                // Subscribe to room state updates
                client.subscribe(`/topic/room/${roomCode}/state`, (message) => {
                    const state = JSON.parse(message.body);
                    setGameState(state);
                });

                // Subscribe to player list updates
                client.subscribe(`/topic/room/${roomCode}/players`, (message) => {
                    const data = JSON.parse(message.body);
                    setPlayers(data.players || []);
                });

                // Subscribe to personal messages
                client.subscribe('/user/queue/personal', (message) => {
                    console.log('📨 Personal message:', message.body);
                });

                // Join the room as a player
                client.publish({
                    destination: `/app/room/${roomCode}/join`,
                    body: JSON.stringify({
                        displayName: user?.username,
                        role: PlayerRole.PLAYER
                    })
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
    }, [roomCode, accessToken, user?.username, disconnect]);

    const sendMessage = useCallback((destination: string, body: any) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body)
            });
        }
    }, []);

    useEffect(() => {
        if (roomCode) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [roomCode, connect, disconnect]);

    return {
        isConnected,
        connectionStatus,
        gameState,
        players,
        sendMessage,
        reconnect: connect
    };
};
