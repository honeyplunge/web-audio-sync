// Tests for BrowserUtils
import { BrowserUtils } from '../src/utils/browser';

describe('BrowserUtils', () => {
    describe('getOutputLatency', () => {
        test('should return fallback when context is null', () => {
            const latency = BrowserUtils.getOutputLatency(null as any);
            expect(typeof latency).toBe('number');
            expect(latency).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getInputLatency', () => {
        test('should return fallback when context is null', () => {
            const latency = BrowserUtils.getInputLatency(null as any);
            expect(typeof latency).toBe('number');
            expect(latency).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getPerformanceNow', () => {
        test('should return current time', () => {
            const now = BrowserUtils.getPerformanceNow();
            expect(typeof now).toBe('number');
            expect(now).toBeGreaterThan(0);
        });
    });

    describe('getDOMHighResTimeStamp', () => {
        test('should return timestamp', () => {
            const timestamp = BrowserUtils.getDOMHighResTimeStamp();
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeGreaterThan(0);
        });
    });
});
