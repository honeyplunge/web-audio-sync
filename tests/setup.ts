// Jest setup file for WebAudio Sync tests
// Mock browser APIs for Node.js environment

// Mock AudioContext
class MockAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'running';
  currentTime: number = 0;
  sampleRate: number = 44100;
  destination: any = { connect: jest.fn() };
  outputLatency?: number;
  inputLatency?: number;

  constructor(options?: any) {
    if (options) {
      this.sampleRate = options.sampleRate || 44100;
    }
  }

  createOscillator(): any {
    return {
      type: 'sine',
      frequency: { value: 440 },
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      onended: null
    };
  }

  createGain(): any {
    const gain = {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    };

    return {
      gain,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createBufferSource(): any {
    return {
      buffer: null,
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      onended: null
    };
  }

  createAnalyser(): any {
    return {
      frequencyBinCount: 2048,
      getByteFrequencyData: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  createScriptProcessor(bufferSize: number, inputChannels: number, outputChannels: number): any {
    const processor = {
      bufferSize,
      connect: jest.fn(),
      disconnect: jest.fn(),
      onaudioprocess: null
    };
    return processor;
  }

  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Mock global browser APIs
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;

// Mock navigator
(global as any).navigator = {
  userAgent: 'node.js',
  platform: 'Linux',
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue({
      then: jest.fn(),
                                              catch: jest.fn(),
    }),
  },
} as any;

// Mock performance
(global as any).performance = {
  now: jest.fn(() => Date.now()),
  timeOrigin: Date.now(),
} as any;

// Mock document
(global as any).document = {
  createElement: jest.fn((tag: string) => ({
    tag,
    addEventListener: jest.fn(),
                                           removeEventListener: jest.fn(),
                                           dispatchEvent: jest.fn(),
                                           play: jest.fn().mockResolvedValue(undefined),
                                           pause: jest.fn(),
                                           currentTime: 0,
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any;

// Mock window
(global as any).window = {
  AudioContext: MockAudioContext as any,
  webkitAudioContext: MockAudioContext as any,
  navigator: global.navigator,
  performance: global.performance,
  document: global.document,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
  requestAnimationFrame: jest.fn((cb) => setTimeout(cb, 0)),
  cancelAnimationFrame: jest.fn(),
} as any;

// Mock fetch for license validation
(global as any).fetch = jest.fn(() =>
Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ valid: true, tier: 'pro' }),
})
) as any;

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Export for use in tests
export { MockAudioContext };
