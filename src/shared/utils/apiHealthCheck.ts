import NetworkConfigManager from '../../config/NetworkConfig';

/**
 * Utility to check the health of the Karaoke service.
 * Used for debugging and to ensure the app is connecting to the correct port.
 */
export const checkKaraokeHealth = async (): Promise<boolean> => {
    try {
        const baseUrl = NetworkConfigManager.getInstance().getKaraokeBaseUrl();
        // Actuator health is at the root, e.g., http://host:8083/actuator/health
        const healthUrl = baseUrl.replace(/\/api$/, '') + '/actuator/health';
        
        console.log(`🔍 Checking karaoke health at: ${healthUrl}`);
        
        const response = await fetch(healthUrl, { 
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log(`📊 Karaoke health status: ${data.status}`);
        
        return response.ok && data.status === 'UP';
    } catch (error) {
        console.error('❌ Karaoke health check failed:', error);
        return false;
    }
};

/**
 * Utility to check the health of the Main Challenger service.
 */
export const checkMainApiHealth = async (): Promise<boolean> => {
    try {
        const baseUrl = NetworkConfigManager.getInstance().getBaseUrl();
        const healthUrl = baseUrl.replace(/\/api$/, '') + '/actuator/health';
        
        const response = await fetch(healthUrl, { method: 'GET' });
        const data = await response.json();
        
        return response.ok && data.status === 'UP';
    } catch {
        return false;
    }
};
