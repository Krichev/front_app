declare module 'react-native-config' {
    export interface NativeConfig {
        API_BASE_URL?: string;
        KARAOKE_API_BASE_URL?: string;
        ENVIRONMENT?: string;
    }

    declare const Config: NativeConfig;
    export default Config;
}
