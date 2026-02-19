import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetworkConfigManager from '../../config/NetworkConfig';

// Generate unique session ID per app launch
const SESSION_ID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});

interface LogEntry {
    level: 'LOG' | 'WARN' | 'ERROR';
    message: string;
    timestamp: string;
    stackTrace: string | null;
}

class RemoteLogService {
    private static instance: RemoteLogService;
    private buffer: LogEntry[] = [];
    private isEnabled: boolean = false;
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private originalConsole: { log: Function; warn: Function; error: Function } | null = null;
    private isFlushing: boolean = false;

    private static readonly BATCH_THRESHOLD = 20;
    private static readonly FLUSH_INTERVAL_MS = 10_000;
    private static readonly MAX_BUFFER_SIZE = 500;
    private static readonly MAX_MESSAGE_LENGTH = 2000;
    private static readonly MAX_STACK_LENGTH = 5000;

    private deviceInfo: any = null;

    private constructor() {}

    public static getInstance(): RemoteLogService {
        if (!RemoteLogService.instance) {
            RemoteLogService.instance = new RemoteLogService();
        }
        return RemoteLogService.instance;
    }

    /**
     * Call this ONCE in App.tsx, as early as possible.
     * In __DEV__ mode, this is a no-op unless forceEnable=true.
     */
    public async initialize(forceEnable: boolean = false): Promise<void> {
        if (__DEV__ && !forceEnable) {
            return; // Don't clutter dev with remote logs
        }
        this.isEnabled = true;
        this.deviceInfo = {
            platform: Platform.OS,
            appVersion: DeviceInfo.getVersion() + '.' + DeviceInfo.getBuildNumber(),
            osVersion: Platform.Version?.toString() || 'unknown',
            deviceModel: await DeviceInfo.getModel(),
        };
        this.patchConsole();
        this.startFlushTimer();
    }

    private patchConsole(): void {
        this.originalConsole = {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
        };

        console.log = (...args: any[]) => {
            this.originalConsole!.log(...args);
            this.capture('LOG', args);
        };
        console.warn = (...args: any[]) => {
            this.originalConsole!.warn(...args);
            this.capture('WARN', args);
        };
        console.error = (...args: any[]) => {
            this.originalConsole!.error(...args);
            this.capture('ERROR', args);
        };
    }

    private capture(level: 'LOG' | 'WARN' | 'ERROR', args: any[]): void {
        if (!this.isEnabled) return;

        const message = args
            .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ')
            .substring(0, RemoteLogService.MAX_MESSAGE_LENGTH);

        let stackTrace: string | null = null;
        if (level === 'ERROR') {
            const errArg = args.find(a => a instanceof Error);
            if (errArg?.stack) {
                stackTrace = errArg.stack.substring(0, RemoteLogService.MAX_STACK_LENGTH);
            }
        }

        this.buffer.push({ level, message, timestamp: new Date().toISOString(), stackTrace });

        // Cap buffer size
        if (this.buffer.length > RemoteLogService.MAX_BUFFER_SIZE) {
            this.buffer = this.buffer.slice(-RemoteLogService.MAX_BUFFER_SIZE);
        }

        // Flush if threshold reached
        if (this.buffer.length >= RemoteLogService.BATCH_THRESHOLD) {
            this.flush();
        }
    }

    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => this.flush(), RemoteLogService.FLUSH_INTERVAL_MS);
    }

    private async flush(): Promise<void> {
        if (!this.isEnabled || this.buffer.length === 0 || this.isFlushing) return;

        this.isFlushing = true;
        const logsToSend = [...this.buffer];
        this.buffer = [];

        try {
            const baseUrl = NetworkConfigManager.getInstance().getBaseUrl();
            const response = await fetch(`${baseUrl}/public/logs/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: SESSION_ID,
                    deviceInfo: this.deviceInfo,
                    logs: logsToSend,
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (_) {
            // Re-add logs to buffer on failure (up to max)
            this.buffer = [...logsToSend, ...this.buffer].slice(0, RemoteLogService.MAX_BUFFER_SIZE);
        } finally {
            this.isFlushing = false;
        }
    }

    public disable(): void {
        this.isEnabled = false;
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        if (this.originalConsole) {
            console.log = this.originalConsole.log as any;
            console.warn = this.originalConsole.warn as any;
            console.error = this.originalConsole.error as any;
        }
    }
}

export default RemoteLogService;
