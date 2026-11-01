// Core types for WebAudio Sync library

export interface AudioContextOptions {
  sampleRate?: number;
  latencyHint?: 'interactive' | 'playback' | 'balanced' | 'realtime';
}

export interface LatencyMeasurement {
  outputLatency: number; // in seconds
  inputLatency: number; // in seconds
  totalLatency: number; // in seconds
  timestamp: number; // DOMHighResTimeStamp
  confidence: number; // 0-1 confidence score
  method: 'native' | 'pulse' | 'acoustic' | 'manual';
}

export interface SyncStatus {
  isSynced: boolean;
  currentLatency: number; // in seconds
  drift: number; // in seconds (positive = audio is ahead)
  timestamp: number; // DOMHighResTimeStamp
  lastCheck: number; // DOMHighResTimeStamp
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PulseCheckOptions {
  duration?: number; // in seconds (default: 2)
  frequency?: number; // in Hz (default: 1000)
  volume?: number; // 0-1 (default: 0.5)
  threshold?: number; // detection threshold 0-1 (default: 0.1)
  maxRetries?: number; // default: 3
}

export interface AcousticLoopbackOptions {
  chirpFrequency?: number; // legacy alias for sweepEndFrequency (Hz)
  chirpDuration?: number; // sweep duration in seconds (default: 0.1)
  detectionTimeout?: number; // per-round timeout in seconds (default: 5)
  calibrationRounds?: number; // default: 3
  noiseGateThreshold?: number; // legacy alias for minCorrelation
  sweepStartFrequency?: number; // Hz (default: 500)
  sweepEndFrequency?: number; // Hz (default: chirpFrequency ?? 8000)
  sweepRepeats?: number; // sweeps per round, played as a chirp train and correlated as a whole (default: 3)
  maxLatency?: number; // max expected round-trip in seconds (default: 2.0 — Bluetooth round trips commonly exceed 1 s)
  minCorrelation?: number; // min normalized correlation to accept a round, 0-1 (default: 0.2)
  preRoll?: number; // seconds between recording start and sweep start (default: 0.05)
}

export interface DriftCorrectionOptions {
  enabled?: boolean; // default: true
  predictionWindow?: number; // in seconds (default: 10)
  correctionStrength?: number; // 0-1 (default: 0.5)
  maxCorrection?: number; // in seconds (default: 0.1)
  historySize?: number; // number of samples to keep (default: 100)
}

export interface SyncOptions {
  audioContext?: AudioContext;
  pulseCheck?: PulseCheckOptions;
  acousticLoopback?: AcousticLoopbackOptions;
  driftCorrection?: DriftCorrectionOptions;
  onSyncChange?: (status: SyncStatus) => void;
  onLatencyUpdate?: (measurement: LatencyMeasurement) => void;
  onError?: (error: Error) => void;
}

export interface SyncManagerOptions extends SyncOptions {
  config?: WebAudioSyncConfig;
}

export interface TapEvent {
  timestamp: number; // DOMHighResTimeStamp
  type: 'tap' | 'pulse' | 'chirp';
  expectedTime?: number; // expected timestamp for sync check
}

export interface CalibrationResult {
  success: boolean;
  latency: number; // in seconds
  measurements: LatencyMeasurement[];
  averageLatency: number;
  stdDeviation: number;
}

export interface LicenseStatus {
  isValid: boolean;
  tier: 'oss' | 'pro';
  expiresAt?: number; // timestamp
  features: string[];
}

export interface WebAudioSyncConfig {
  licenseKey?: string;
  enableAnalytics?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

// Event types
export type SyncEventType =
| 'sync:start'
| 'sync:stop'
| 'sync:change'
| 'latency:update'
| 'calibration:start'
| 'calibration:complete'
| 'calibration:fail'
| 'drift:correction'
| 'error';

export interface SyncEvent {
  type: SyncEventType;
  data?: unknown;
  timestamp: number;
}

export interface SyncEventListener {
  (event: SyncEvent): void;
}

export interface ManualTapSyncOptions {
  pulseCount?: number;
  pulseInterval?: number;
  onTap?: (timestamp: number, expectedTime?: number) => void;
}

export interface PulseCheckResult {
  success: boolean;
  latency: number;
  confidence: number;
  measurements: number[];
  timestamp: number;
}

// WebAudioSync class types (forward declarations)
export interface WebAudioSyncOSS {
  initialize(): Promise<boolean>;
  getAudioContext(): AudioContext | null;
  startManualTapSync(options?: ManualTapSyncOptions): void;
  detectLatency(): Promise<LatencyMeasurement>;
  performPulseCheck(): Promise<PulseCheckResult>;
  getSyncStatus(): SyncStatus;
  getCurrentLatency(): number;
  startSync(): Promise<boolean>;
  stopSync(): Promise<void>;
  calibrate(): Promise<CalibrationResult>;
  addEventListener(listener: SyncEventListener): void;
  removeEventListener(listener: SyncEventListener): void;
  destroy(): Promise<void>;
  getVersion(): string;
  getTier(): 'oss';
  playTestTone(frequency?: number, duration?: number): Promise<void>;
}

export interface WebAudioSyncPro {
  initialize(): Promise<boolean>;
  setLicenseKey(key: string): Promise<boolean>;
  getLicenseStatus(): LicenseStatus;
  getAudioContext(): AudioContext | null;
  startManualTapSync(options?: ManualTapSyncOptions): void;
  measureLatencyWithAcousticLoopback(): Promise<{ success: boolean; latency: number; confidence: number }>;
  detectLatency(): Promise<LatencyMeasurement>;
  performPulseCheck(): Promise<PulseCheckResult>;
  startDriftCorrection(): void;
  stopDriftCorrection(): void;
  getDriftTrend(): number;
  getSyncStatus(): SyncStatus;
  getCurrentLatency(): number;
  getCurrentDrift(): number;
  startSync(): Promise<boolean>;
  stopSync(): Promise<void>;
  calibrate(): Promise<CalibrationResult>;
  addEventListener(listener: SyncEventListener): void;
  removeEventListener(listener: SyncEventListener): void;
  destroy(): Promise<void>;
  getVersion(): string;
  getTier(): 'pro';
  playTestTone(frequency?: number, duration?: number): Promise<void>;
}

// Browser compatibility types
export interface BrowserAudioContext {
  outputLatency?: number;
  inputLatency?: number;
}

export interface WindowWithWebAudio extends Window {
  AudioContext?: new (options?: AudioContextOptions) => AudioContext;
  webkitAudioContext?: new (options?: AudioContextOptions) => AudioContext;
}
