// Tests for AudioEngine
import { AudioEngine } from '../src/core/audioEngine';

describe('AudioEngine', () => {
    let audioEngine: AudioEngine;

    beforeEach(() => {
        audioEngine = new AudioEngine();
    });

    afterEach(() => {
        audioEngine.close();
    });

    test('should initialize', () => {
        expect(audioEngine).toBeDefined();
    });

    test('should have null context initially', () => {
        expect(audioEngine.getContext()).toBeNull();
    });
});
