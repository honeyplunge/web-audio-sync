// Tests for MathUtils
import { MathUtils } from '../src/utils/math';

describe('MathUtils', () => {
    describe('mean', () => {
        test('should return 0 for empty array', () => {
            expect(MathUtils.mean([])).toBe(0);
        });

        test('should calculate mean of single value', () => {
            expect(MathUtils.mean([5])).toBe(5);
        });

        test('should calculate mean of multiple values', () => {
            expect(MathUtils.mean([1, 2, 3, 4, 5])).toBe(3);
        });

        test('should calculate mean of negative values', () => {
            expect(MathUtils.mean([-1, -2, -3])).toBe(-2);
        });

        test('should calculate mean of decimal values', () => {
            expect(MathUtils.mean([0.1, 0.2, 0.3])).toBeCloseTo(0.2);
        });
    });

    describe('median', () => {
        test('should return 0 for empty array', () => {
            expect(MathUtils.median([])).toBe(0);
        });

        test('should calculate median of single value', () => {
            expect(MathUtils.median([5])).toBe(5);
        });

        test('should calculate median of odd-length array', () => {
            expect(MathUtils.median([1, 2, 3])).toBe(2);
        });

        test('should calculate median of even-length array', () => {
            expect(MathUtils.median([1, 2, 3, 4])).toBe(2.5);
        });

        test('should calculate median of unsorted array', () => {
            expect(MathUtils.median([3, 1, 2])).toBe(2);
        });
    });

    describe('standardDeviation', () => {
        test('should return 0 for empty array', () => {
            expect(MathUtils.standardDeviation([])).toBe(0);
        });

        test('should return 0 for single value', () => {
            expect(MathUtils.standardDeviation([5])).toBe(0);
        });

        test('should calculate std dev of multiple values', () => {
            const values = [2, 4, 4, 4, 5, 5, 7, 9];
            const stdDev = MathUtils.standardDeviation(values);
            expect(stdDev).toBeCloseTo(2);
        });
    });

    describe('clamp', () => {
        test('should clamp value within range', () => {
            expect(MathUtils.clamp(5, 0, 10)).toBe(5);
        });

        test('should clamp value below minimum', () => {
            expect(MathUtils.clamp(-1, 0, 10)).toBe(0);
        });

        test('should clamp value above maximum', () => {
            expect(MathUtils.clamp(15, 0, 10)).toBe(10);
        });

        test('should handle negative range', () => {
            expect(MathUtils.clamp(-5, -10, -1)).toBe(-5);
        });
    });

    describe('linearRegression', () => {
        test('should return slope 0 and intercept 0 for single point', () => {
            const result = MathUtils.linearRegression([1], [1]);
            expect(result.slope).toBe(0);
            expect(result.intercept).toBe(1);
        });

        test('should calculate linear regression for two points', () => {
            const x = [0, 1];
            const y = [0, 2];
            const result = MathUtils.linearRegression(x, y);
            expect(result.slope).toBe(2);
            expect(result.intercept).toBe(0);
        });

        test('should calculate linear regression for multiple points', () => {
            const x = [1, 2, 3, 4, 5];
            const y = [2, 4, 5, 4, 5];
            const result = MathUtils.linearRegression(x, y);
            expect(result.slope).toBeCloseTo(0.6);
            expect(result.intercept).toBeCloseTo(2.2);
        });
    });

    describe('crossCorrelate', () => {
        const makeRef = (n: number): number[] => {
            const ref: number[] = [];
            for (let i = 0; i < n; i++) {
                ref.push(Math.sin((2 * Math.PI * 440 * i) / 48000) * 0.8);
            }
            return ref;
        };

        test('should find exact integer lag', () => {
            const ref = makeRef(480);
            const delay = 1000;
            const signal: number[] = new Array(delay).fill(0).concat(ref);
            const { lag, score } = MathUtils.crossCorrelate(ref, signal, signal.length - ref.length);
            expect(lag).toBeCloseTo(delay, 0);
            expect(score).toBeGreaterThan(0.99);
        });

        test('should find sub-sample lag within half a sample', () => {
            const ref = makeRef(480);
            const delay = 1000.4;
            const signal: number[] = new Array(Math.floor(delay)).fill(0);
            const frac = delay - Math.floor(delay);
            for (let i = 0; i < ref.length; i++) {
                // linear interpolation for the fractional delay
                const idx = Math.floor(delay) + i;
                const a = ref[i];
                const b = ref[Math.min(i + 1, ref.length - 1)];
                signal[idx] = (1 - frac) * a + frac * b;
            }
            const { lag, score } = MathUtils.crossCorrelate(ref, signal, signal.length - ref.length + 1);
            expect(Math.abs(lag - delay)).toBeLessThan(0.5);
            expect(score).toBeGreaterThan(0.9);
        });

        test('should respect minLag', () => {
            const ref = makeRef(480);
            const delay = 100;
            const signal: number[] = new Array(delay).fill(0).concat(ref, new Array(500).fill(0));
            const { lag } = MathUtils.crossCorrelate(ref, signal, signal.length - ref.length, 500);
            expect(lag).toBeGreaterThanOrEqual(500);
        });

        test('should return score 0 for empty reference', () => {
            const { lag, score } = MathUtils.crossCorrelate([], [1, 2, 3], 2);
            expect(lag).toBe(0);
            expect(score).toBe(0);
        });

        test('should return score 0 for silent reference', () => {
            const { score } = MathUtils.crossCorrelate([0, 0, 0], [1, 2, 3], 1);
            expect(score).toBe(0);
        });

        test('should return low score for uncorrelated signal', () => {
            const ref = makeRef(480);
            const noise: number[] = [];
            let seed = 42;
            for (let i = 0; i < 4000; i++) {
                seed = (seed * 1103515245 + 12345) % 2147483648;
                noise.push((seed / 2147483648 - 0.5) * 0.1);
            }
            const { score } = MathUtils.crossCorrelate(ref, noise, noise.length - ref.length);
            expect(score).toBeLessThan(0.5);
        });
    });
});
