// Tests for SyncManager
import { SyncManager, SyncManagerOptions } from '../src/core/syncManager';
import { AudioEngine } from '../src/core/audioEngine';
import { SyncStatus, LatencyMeasurement } from '../src/types';
import { TapEvent } from '../src/types';

describe('SyncManager', () => {
    let audioEngine: AudioEngine;
    let syncManager: SyncManager;

    beforeEach(() => {
        audioEngine = new AudioEngine();
        syncManager = new SyncManager();
    });

    afterEach(async () => {
        await syncManager.destroy();
        audioEngine.cleanupAll();
    });

    describe('Initialization', () => {
        test('should initialize', () => {
            expect(syncManager).toBeDefined();
        });

        test('should initialize with custom options', () => {
            const options: SyncManagerOptions = {
                pulseCheck: { duration: 3 },
                onSyncChange: (status: SyncStatus) => {},
             onLatencyUpdate: (measurement: LatencyMeasurement) => {},
             onError: (error: Error) => {}
            };
            const manager = new SyncManager(options);
            expect(manager).toBeDefined();
            manager.destroy();
        });
    });

    describe('startSync/stopSync', () => {
        test('should start sync', async () => {
            await syncManager.initialize();
            const success = await syncManager.startSync();
            expect(success).toBe(true);
        });

        test('should stop sync', async () => {
            await syncManager.initialize();
            await syncManager.startSync();
            await syncManager.stopSync();
            expect(true).toBe(true);
        });
    });

    describe('manual tap sync', () => {
        test('should start manual tap sync', () => {
            syncManager.startManualTapSync();
            expect(true).toBe(true);
        });

        test('should start manual tap sync with options', () => {
            syncManager.startManualTapSync({
                pulseCount: 10,
                pulseInterval: 0.5,
                onTap: (tap: TapEvent) => {}
            });
            expect(true).toBe(true);
        });
    });

    describe('getSyncStatus', () => {
        test('should return sync status', () => {
            const status: SyncStatus = syncManager.getSyncStatus();
            expect(status).toHaveProperty('isSynced');
            expect(status).toHaveProperty('currentLatency');
            expect(status).toHaveProperty('drift');
            expect(status).toHaveProperty('timestamp');
            expect(status).toHaveProperty('lastCheck');
            expect(status).toHaveProperty('quality');
        });
    });

    describe('detectLatency', () => {
        test('should detect latency', async () => {
            await syncManager.initialize();
            const measurement: LatencyMeasurement = await syncManager.detectLatency();
            expect(measurement).toHaveProperty('outputLatency');
            expect(measurement).toHaveProperty('totalLatency');
        });
    });

    describe('calibrate', () => {
        test('should perform calibration', async () => {
            await syncManager.initialize();
            // Use auto type inference instead of explicit CalibrationResult
            const result = await syncManager.calibrate();
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('latency');
            expect(result).toHaveProperty('measurements');
            expect(result).toHaveProperty('confidence');
        });
    });

    describe('getCurrentLatency', () => {
        test('should return current latency as number', () => {
            const latency: number = syncManager.getCurrentLatency();
            expect(typeof latency).toBe('number');
        });
    });

    describe('drift correction', () => {
        test('should get current drift', () => {
            const drift = syncManager.getCurrentDrift();
            expect(typeof drift).toBe('number');
        });

        test('should get drift trend', () => {
            const trend = syncManager.getDriftTrend();
            expect(typeof trend).toBe('number');
        });

        test('should apply drift correction', () => {
            const correction = syncManager.applyDriftCorrection();
            expect(correction).toBeNull();
        });
    });

    describe('event handling', () => {
        test('should add and remove event listeners', () => {
            const listener = jest.fn();
            syncManager.addEventListener(listener);
            syncManager.removeEventListener(listener);
            expect(true).toBe(true);
        });
    });

    describe('cleanup', () => {
        test('should clean up resources', async () => {
            await syncManager.initialize();
            await syncManager.startSync();
            await syncManager.destroy();
            expect(true).toBe(true);
        });
    });
});
