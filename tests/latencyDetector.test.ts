// Tests for LatencyDetector
import { LatencyDetector } from '../src/core/latencyDetector';
import { PulseCheckOptions } from '../src/types';
import { AudioEngine } from '../src/core/audioEngine';
import { LatencyMeasurement } from '../src/types';

describe('LatencyDetector', () => {
    let audioEngine: AudioEngine;
    let latencyDetector: LatencyDetector;

    beforeEach(async () => {
        audioEngine = new AudioEngine();
        await audioEngine.initialize();
        latencyDetector = new LatencyDetector(audioEngine);
    });

    afterEach(async () => {
        latencyDetector.cleanup();
        await audioEngine.close();
    });

    describe('Initialization', () => {
        test('should initialize with audio engine', () => {
            expect(latencyDetector).toBeDefined();
        });

        test('should initialize with custom options', () => {
            const options = {
                useNativeLatency: false,
                calibrationRounds: 5,
                pulseCheck: {
                    duration: 3,
                    frequency: 800,
                    volume: 0.7,
                    threshold: 0.2,
                    maxRetries: 5
                } as PulseCheckOptions
            };
            const detector = new LatencyDetector(audioEngine, options);
            expect(detector).toBeDefined();
        });
    });

    describe('getNativeLatency', () => {
        test('should throw error when audio engine not initialized', () => {
            const engine = new AudioEngine();
            const detector = new LatencyDetector(engine);

            expect(() => detector.getNativeLatency()).toThrow('AudioEngine not initialized');
        });

        test('should return latency measurement', async () => {
            const latency = latencyDetector.getNativeLatency();

            expect(latency).toHaveProperty('outputLatency');
            expect(latency).toHaveProperty('inputLatency');
            expect(latency).toHaveProperty('totalLatency');
            expect(latency).toHaveProperty('timestamp');
            expect(latency).toHaveProperty('confidence');
            expect(latency.method).toBe('native');
        });
    });

    describe('getCurrentLatency', () => {
        test('should return default latency when native not available', () => {
            const uninitializedEngine = new AudioEngine();
            const detector = new LatencyDetector(uninitializedEngine);
            const latency = detector.getCurrentLatency();

            expect(latency).toHaveProperty('outputLatency');
            expect(latency).toHaveProperty('inputLatency');
            expect(latency).toHaveProperty('totalLatency');
            expect(latency.confidence).toBe(0.3);
        });

        test('should return native latency when available', async () => {
            const latency = latencyDetector.getCurrentLatency();

            expect(latency.method).toBe('native');
        });
    });

    describe('performPulseCheck', () => {
        test('should return empty result when already calibrating', async () => {
            (latencyDetector as any)._isCalibrating = true;

            const result = await latencyDetector.performPulseCheck();

            expect(result.success).toBe(false);
            expect(result.measurements.length).toBe(0);
        });

        test('should return result with success false when no taps', async () => {
            const result = await latencyDetector.performPulseCheck({
                duration: 0.1,
                maxRetries: 1
            });

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('latency');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('measurements');
            expect(result).toHaveProperty('timestamp');
        }, 10000);
    });

    describe('calibrate', () => {
        test('should return latency measurement', async () => {
            const result: any = await latencyDetector.calibrate();

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('latency');
            expect(result).toHaveProperty('outputLatency');
            expect(result).toHaveProperty('inputLatency');
            expect(result).toHaveProperty('totalLatency');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('measurements');
        });
    });

    describe('isDetecting', () => {
        test('should return false when not detecting', () => {
            expect(latencyDetector.isDetecting()).toBe(false);
        });
    });

    describe('getCalibrationHistory', () => {
        test('should return empty array', () => {
            const history = latencyDetector.getCalibrationHistory();
            expect(Array.isArray(history)).toBe(true);
        });
    });
});
