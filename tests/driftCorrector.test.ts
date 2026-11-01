// Tests for DriftCorrector
import { DriftCorrector } from '../src/core/driftCorrector';
import { LatencyMeasurement } from '../src/types';

describe('DriftCorrector', () => {
    let driftCorrector: DriftCorrector;

    beforeEach(() => {
        driftCorrector = new DriftCorrector();
    });

    describe('Initialization', () => {
        test('should initialize', () => {
            expect(driftCorrector).toBeDefined();
        });

        test('should start and stop correction', () => {
            driftCorrector.start();
            expect(driftCorrector.isRunning()).toBe(true);
            driftCorrector.stop();
            expect(driftCorrector.isRunning()).toBe(false);
        });
    });

    describe('addMeasurement', () => {
        test('should add measurement to history', () => {
            const measurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(measurement, 0.1);
            expect(driftCorrector.getDriftSamples().length).toBe(1);
        });

        test('should respect history size limit', () => {
            const measurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            // Add 101 measurements
            for (let i = 0; i < 101; i++) {
                driftCorrector.addMeasurement(measurement, 0.1);
            }
            expect(driftCorrector.getDriftSamples().length).toBeLessThanOrEqual(100);
        });
    });

    describe('getCurrentDrift', () => {
        test('should return 0 when no measurements', () => {
            expect(driftCorrector.getCurrentDrift()).toBe(0);
        });

        test('should calculate drift from measurements', () => {
            const measurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.11,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(measurement, 0.1);
            expect(driftCorrector.getCurrentDrift()).toBeCloseTo(0.01);
        });
    });

    describe('getAverageDrift', () => {
        test('should return 0 when no measurements', () => {
            expect(driftCorrector.getAverageDrift()).toBe(0);
        });

        test('should calculate average drift from multiple measurements', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            baseMeasurement.totalLatency = 0.12;
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            expect(driftCorrector.getAverageDrift()).toBeCloseTo(0.01);
        });
    });

    describe('getDriftTrend', () => {
        test('should return 0 when insufficient data', () => {
            expect(driftCorrector.getDriftTrend()).toBe(0);
        });

        test('should calculate trend from multiple measurements', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            // Add a second measurement with slightly different latency
            baseMeasurement.totalLatency = 0.11;
            baseMeasurement.timestamp = Date.now() + 1000;
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            expect(driftCorrector.getDriftTrend()).toBeGreaterThanOrEqual(-0.001);
        });
    });

    describe('predictDrift', () => {
        test('should predict future drift', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            baseMeasurement.totalLatency = 0.11;
            baseMeasurement.timestamp = Date.now() + 1000;
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            const prediction = driftCorrector.predictDrift(5);
            expect(typeof prediction).toBe('number');
        });

        test('should return current drift when no trend data', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            expect(driftCorrector.predictDrift(5)).toBe(0);
        });
    });

    describe('applyCorrection', () => {
        test('should return null when insufficient data', () => {
            const correction = driftCorrector.applyCorrection();
            expect(correction).toBeNull();
        });

        test('should apply correction with sufficient data', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            // Add 5 measurements to meet minimum requirement
            for (let i = 0; i < 5; i++) {
                driftCorrector.addMeasurement(baseMeasurement, 0.1);
            }
            const correction = driftCorrector.applyCorrection();
            expect(correction).not.toBeNull();
            expect(correction).toHaveProperty('correction');
            expect(correction).toHaveProperty('confidence');
        });

        test('should respect maxCorrection limit', () => {
            driftCorrector = new DriftCorrector({ maxCorrection: 0.01 });
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.2, // Large drift
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            // Add 5 measurements with large drift
            for (let i = 0; i < 5; i++) {
                driftCorrector.addMeasurement(baseMeasurement, 0.1);
            }
            const correction = driftCorrector.applyCorrection();
            expect(Math.abs(correction!.correction)).toBeLessThanOrEqual(0.01);
        });
    });

    describe('getLastCorrection', () => {
        test('should return null when no correction applied', () => {
            expect(driftCorrector.getLastCorrection()).toBeNull();
        });

        test('should return last correction', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            for (let i = 0; i < 5; i++) {
                driftCorrector.addMeasurement(baseMeasurement, 0.1);
            }
            driftCorrector.applyCorrection();
            expect(driftCorrector.getLastCorrection()).not.toBeNull();
        });
    });

    describe('getSyncStatus', () => {
        test('should return sync status', () => {
            const status = driftCorrector.getSyncStatus(0.1);
            expect(status).toHaveProperty('isSynced');
            expect(status).toHaveProperty('currentLatency');
            expect(status).toHaveProperty('drift');
            expect(status).toHaveProperty('timestamp');
            expect(status).toHaveProperty('quality');
        });

        test('should determine quality based on drift', () => {
            const baseMeasurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            // Add measurement with no drift
            driftCorrector.addMeasurement(baseMeasurement, 0.1);
            const status = driftCorrector.getSyncStatus(0.1);
            expect(status.quality).toBe('excellent');
        });
    });

    describe('clearHistory', () => {
        test('should clear drift samples', () => {
            const measurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(measurement, 0.1);
            expect(driftCorrector.getDriftSamples().length).toBe(1);
            driftCorrector.clearHistory();
            expect(driftCorrector.getDriftSamples().length).toBe(0);
        });
    });

    describe('reset', () => {
        test('should reset all state', () => {
            driftCorrector.start();
            const measurement: LatencyMeasurement = {
                outputLatency: 0.05,
                inputLatency: 0.05,
                totalLatency: 0.1,
                timestamp: Date.now(),
             confidence: 0.8,
             method: 'native'
            };
            driftCorrector.addMeasurement(measurement, 0.1);
            driftCorrector.reset();
            expect(driftCorrector.isRunning()).toBe(false);
            expect(driftCorrector.getDriftSamples().length).toBe(0);
        });
    });
});
