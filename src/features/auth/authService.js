// authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

class AuthService {
    async updateAuthToken(newToken) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
        // Update axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }

    async updateUserData(userData) {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }

    async getCurrentUser() {
        const userDataStr = await AsyncStorage.getItem(USER_DATA_KEY);
        return userDataStr ? JSON.parse(userDataStr) : null;
    }

    async getAuthToken() {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    }

    async logout() {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_DATA_KEY);
        delete axios.defaults.headers.common['Authorization'];
    }
}

export default new AuthService();