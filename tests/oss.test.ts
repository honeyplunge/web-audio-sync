// Tests for OSS version
import { createWebAudioSyncOSS } from '../src/oss';
import { AudioEngine } from '../src/core/audioEngine';
import { SyncStatus, LatencyMeasurement } from '../src/types';

describe('OSS Version', () => {
    let sync: ReturnType<typeof createWebAudioSyncOSS>;
    let audioEngine: AudioEngine;

    beforeEach(() => {
        audioEngine = new AudioEngine();
        sync = createWebAudioSyncOSS();
    });

    afterEach(async () => {
        await sync.destroy();
        audioEngine.cleanupAll();
    });

    describe('Initialization', () => {
        test('should initialize', () => {
            expect(sync).toBeDefined();
        });

        test('should initialize with custom options', () => {
            const options = {
                pulseCheck: { duration: 3 },
                onSyncChange: (status: SyncStatus) => {},
             onLatencyUpdate: (measurement: LatencyMeasurement) => {}
            };
            const instance = createWebAudioSyncOSS(options);
            expect(instance).toBeDefined();
            instance.destroy();
        });

        test('should initialize audio context', async () => {
            const success = await sync.initialize();
            expect(success).toBe(true);
        });
    });

    describe('startSync/stopSync', () => {
        test('should start sync', async () => {
            await sync.initialize();
            const success = await sync.startSync();
            expect(success).toBe(true);
        });

        test('should stop sync', async () => {
            await sync.initialize();
            await sync.startSync();
            await sync.stopSync();
            expect(true).toBe(true);
        });
    });

    describe('manual tap sync', () => {
        test('should start manual tap sync', () => {
            sync.startManualTapSync();
            expect(true).toBe(true);
        });

        test('should start manual tap sync with options', () => {
            sync.startManualTapSync({
                pulseCount: 10,
                pulseInterval: 0.5,
                onTap: (timestamp: number, expectedTime?: number) => {}
            });
            expect(true).toBe(true);
        });
    });

    describe('detectLatency', () => {
        test('should detect latency', async () => {
            await sync.initialize();
            const measurement: LatencyMeasurement = await sync.detectLatency();
            expect(measurement).toHaveProperty('outputLatency');
            expect(measurement).toHaveProperty('totalLatency');
        });
    });

    describe('getSyncStatus', () => {
        test('should return sync status', () => {
            const status: SyncStatus = sync.getSyncStatus();
            expect(status).toHaveProperty('isSynced');
            expect(status).toHaveProperty('currentLatency');
            expect(status).toHaveProperty('drift');
            expect(status).toHaveProperty('quality');
        });
    });

    describe('getCurrentLatency', () => {
        test('should return current latency', () => {
            const latency: number = sync.getCurrentLatency();
            expect(typeof latency).toBe('number');
        });
    });

    describe('calibrate', () => {
        test('should perform calibration', async () => {
            await sync.initialize();
            const result = await sync.calibrate();
            expect(result).toHaveProperty('success');
        });
    });

    describe('event handling', () => {
        test('should add and remove event listeners', () => {
            const listener = jest.fn();
            sync.addEventListener(listener);
            sync.removeEventListener(listener);
            expect(true).toBe(true);
        });
    });

    describe('version info', () => {
        test('should return version', () => {
            const version = sync.getVersion();
            expect(typeof version).toBe('string');
        });

        test('should return tier', () => {
            const tier = sync.getTier();
            expect(tier).toBe('oss');
        });
    });

    describe('cleanup', () => {
        test('should clean up resources', async () => {
            await sync.initialize();
            await sync.startSync();
            await sync.destroy();
            expect(true).toBe(true);
        });
    });
});
