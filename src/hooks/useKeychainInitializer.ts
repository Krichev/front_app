// src/hooks/useKeychainInitializer.ts
import {useEffect, useRef} from 'react';
import KeychainService from '../services/auth/KeychainService';

/**
 * Custom hook to ensure KeychainService is initialized only once
 * This prevents multiple initialization attempts
 */
export const useKeychainInitializer = () => {
    const isInitializedRef = useRef(false);

    useEffect(() => {
        const initializeKeychain = async () => {
            // Guard against multiple initializations
            if (isInitializedRef.current) {
                console.log('🔐 KeychainService already initialized, skipping...');
                return;
            }

            try {
                console.log('🔄 Starting KeychainService initialization...');
                await KeychainService.initialize();
                isInitializedRef.current = true;

                // Log storage info
                const info = KeychainService.getStorageInfo();
                console.log(`✅ Using ${info.storageType} on ${info.platform}`);
            } catch (error) {
                console.error('❌ Failed to initialize KeychainService:', error);
            }
        };

        initializeKeychain();
    }, []); // Empty dependency array = run once on mount
};