// src/app/providers/WWWGameProvider.tsx
import React, {createContext, useContext, useEffect, useState} from 'react';
import {initializeWWWGame, isWWWGameInitialized} from '../../services/wwwGame/initialize';
import {getConfig, updateConfig, WWWGameConfig} from '../../services/wwwGame/config';

// Define the context
interface WWWGameContextType {
    isInitialized: boolean;
    config: WWWGameConfig;
    updateGameConfig: (newConfig: Partial<WWWGameConfig>) => void;
    setApiKey: (apiKey: string) => void;
}

// Create context with default values
const WWWGameContext = createContext<WWWGameContextType>({
    isInitialized: false,
    config: getConfig(),
    updateGameConfig: () => {},
    setApiKey: () => {},
});

// Hook to use the WWW Game context
export const useWWWGame = () => useContext(WWWGameContext);

// Provider component
export const WWWGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState<boolean>(isWWWGameInitialized());
    const [config, setConfig] = useState<WWWGameConfig>(getConfig());

    // Initialize the WWW Game services when component mounts
    useEffect(() => {
        const initialize = async () => {
            if (!isInitialized) {
                await initializeWWWGame();
                setIsInitialized(true);
                // Update config after initialization
                setConfig(getConfig());
            }
        };

        initialize();
    }, [isInitialized]);

    // Function to update game configuration
    const updateGameConfig = (newConfig: Partial<WWWGameConfig>) => {
        const updatedConfig = updateConfig(newConfig);
        setConfig(updatedConfig);
    };

    // Helper function to update just the API key
    const setApiKey = (apiKey: string) => {
        updateGameConfig({
            aiHost: {
                ...config.aiHost,
                apiKey,
                enabled: true
            }
        });
    };

    // Context value
    const contextValue: WWWGameContextType = {
        isInitialized,
        config,
        updateGameConfig,
        setApiKey,
    };

    return (
        <WWWGameContext.Provider value={contextValue}>
            {children}
        </WWWGameContext.Provider>
    );
};

