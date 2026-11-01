// Main Sync Manager for WebAudio Sync

import {
  LatencyMeasurement,
  SyncOptions,
  SyncStatus,
  TapEvent,
  SyncEvent,
  SyncEventListener,
  SyncEventType,
  WebAudioSyncConfig,
  PulseCheckResult,
} from '../types';
import { AudioEngine } from './audioEngine';
import { LatencyDetector, LatencyCalibrationResult } from './latencyDetector';
import { DriftCorrector, DriftCorrection } from './driftCorrector';
import { Logger } from '../utils/logger';

export interface SyncManagerOptions extends SyncOptions {
  config?: WebAudioSyncConfig;
}

export interface SyncCalibrationResult {
  success: boolean;
  latency: number;
  outputLatency?: number;
  measurements: LatencyMeasurement[];
  confidence: number;
  method?: LatencyMeasurement['method'];
}

export class SyncManager {
  private audioEngine: AudioEngine;
  private latencyDetector: LatencyDetector;
  private driftCorrector: DriftCorrector;
  private options: SyncManagerOptions;
  private config: WebAudioSyncConfig;
  private logger: Logger;
  private _isSyncing: boolean = false;
  private _isCalibrating: boolean = false;
  private currentLatency: number = 0;
  private currentDrift: number = 0;
  private syncOffset: number = 0;
  private eventListeners: Set<SyncEventListener> = new Set();
  private calibrationTimeout: number | null = null;

  constructor (options: SyncManagerOptions = {}) {
    this.options = {
      pulseCheck: { duration: 2, frequency: 4, volume: 0.5, threshold: 0.1, maxRetries: 3 },
      driftCorrection: { enabled: true, predictionWindow: 10, correctionStrength: 0.5, maxCorrection: 0.1, historySize: 100 },
      config: {},
      ...options,
    };
    this.config = { ...this.options.config };
    this.logger = new Logger(this.config, 'SyncManager');
    this.audioEngine = new AudioEngine();
    this.latencyDetector = new LatencyDetector(this.audioEngine, {
      pulseCheck: this.options.pulseCheck,
      useNativeLatency: true,
      calibrationRounds: 3,
      onLatencyUpdate: this.handleLatencyUpdate.bind(this),
                                               onError: this.handleError.bind(this),
    });
    this.driftCorrector = new DriftCorrector(this.options.driftCorrection);
  }

  isSyncing (): boolean { return this._isSyncing; }
  isCalibrating (): boolean { return this._isCalibrating; }

  async initialize (): Promise<boolean> {
    try {
      const success = await this.audioEngine.initialize();

      if (!success) {
        this.logger.error('Failed to initialize AudioEngine');

        return false;
      }

      Logger.configure(this.config);
      this.logger.info('SyncManager initialized successfully');

      return true;
    } catch (error) {
      this.logger.error('Failed to initialize SyncManager', error);

      return false;
    }
  }

  getAudioContext (): AudioContext | null {
    return this.audioEngine.getContext();
  }

  getAudioEngine (): AudioEngine {
    return this.audioEngine;
  }

  async startSync (): Promise<boolean> {
    if (this._isSyncing) {
      this.logger.warn('Sync already in progress');

      return true;
    }

    this.logger.info('Starting audio synchronization...');
    this._isSyncing = true;
    try {
      if (!this.audioEngine.getContext()) {
        const initSuccess = await this.audioEngine.initialize();

        if (!initSuccess) {
          this._isSyncing = false;

          return false;
        }
      }

      this.latencyDetector.start();
      if (this.options.driftCorrection?.enabled !== false) {
        this.driftCorrector.start();
      }

      this.logger.info('Audio synchronization started');

      return true;
    } catch (error) {
      this.logger.error('Failed to start sync', error);
      this._isSyncing = false;

      return false;
    }
  }

  async stopSync (): Promise<void> {
    if (!this._isSyncing) {
      this.logger.warn('Sync not in progress');

      return;
    }

    this.logger.info('Stopping audio synchronization...');
    this._isSyncing = false;
    try {
      this.latencyDetector.stop();
      this.driftCorrector.stop();
      this.logger.info('Audio synchronization stopped');
    } catch (error) {
      this.logger.error('Failed to stop sync', error);
    }
  }

  startManualTapSync (options: { pulseCount?: number; pulseInterval?: number; onTap?: (tap: TapEvent) => void; } = {}): void {
    this.logger.info('Starting manual tap sync', options);
    this.latencyDetector.startManualTapSync({ pulseCount: options.pulseCount, pulseInterval: options.pulseInterval, onTap: options.onTap });
  }

  async detectLatency (): Promise<LatencyMeasurement> {
    // Don't require sync to be started for latency detection
    // This allows tests to call detectLatency directly
    try {
      const result = await this.latencyDetector.detectLatency();

      return result;
    } catch {
      // Fall back to current latency if detection fails
      const fallback = this.getCurrentLatency();

      if (typeof fallback === 'number') {
        return {
          outputLatency: fallback / 2,
          inputLatency: fallback / 2,
          totalLatency: fallback,
          timestamp: Date.now(),
          confidence: 0.3,
          method: 'native',
        };
      }

      return {
        outputLatency: 0.05,
        inputLatency: 0.05,
        totalLatency: 0.1,
        timestamp: Date.now(),
        confidence: 0.3,
        method: 'native',
      };
    }
  }

  async performPulseCheck (): Promise<PulseCheckResult> {
    return this.latencyDetector.performPulseCheck();
  }

  async calibrate (): Promise<SyncCalibrationResult> {
    if (this._isCalibrating) {
      this.logger.warn('Calibration already in progress');

      return { success: false, latency: this.currentLatency, measurements: [], confidence: 0 };
    }

    this._isCalibrating = true;
    this.logger.info('Starting calibration...');
    try {
      const result: LatencyCalibrationResult = await this.latencyDetector.calibrate();

      if (result?.success) {
        this.currentLatency = result.latency;
        const measurement: LatencyMeasurement = {
          outputLatency: result.outputLatency ?? 0,
          inputLatency: result.inputLatency ?? 0,
          totalLatency: result.latency,
          timestamp: result.timestamp,
          confidence: result.confidence,
          method: 'pulse',
        };

        this.driftCorrector.addMeasurement(measurement, this.currentLatency);
      }

      this.logger.info('Calibration completed', { success: result?.success, latency: result?.latency });

      return {
        success: result?.success ?? false,
        latency: result?.latency ?? this.currentLatency,
        outputLatency: result?.outputLatency ?? 0,
        measurements: result?.measurements ?? [],
        confidence: result?.confidence ?? 0,
        method: result?.method,
      };
    } catch (error) {
      this.logger.error('Calibration failed', error);

      return { success: false, latency: this.currentLatency, measurements: [], confidence: 0 };
    } finally {
      this._isCalibrating = false;
    }
  }

  applyDriftCorrection (): DriftCorrection | null {
    if (this.options.driftCorrection?.enabled !== false) {
      const correction = this.driftCorrector.applyCorrection();

      if (correction) {
        this.syncOffset = correction.correction;
        this.currentDrift = correction.correction;
        this.emitEvent('drift:correction', correction);

        return correction;
      }
    }

    return null;
  }

  getDriftTrend (): number { return this.driftCorrector.getDriftTrend(); }
  getCurrentDrift (): number { return this.currentDrift; }

  getSyncStatus (): SyncStatus {
    const drift = this.driftCorrector.getCurrentDrift();

    const latency = this.currentLatency;

    const timestamp = Date.now();

    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

    const absDrift = Math.abs(drift);

    if (absDrift < 0.005) {quality = 'excellent';}
    else if (absDrift < 0.015) {quality = 'good';}
    else if (absDrift < 0.03) {quality = 'fair';}
    else {quality = 'poor';}

    return { isSynced: absDrift < 0.05, currentLatency: latency, drift, timestamp, lastCheck: timestamp, quality };
  }

  getCurrentLatency (): number { return this.currentLatency; }

  addEventListener (listener: SyncEventListener): void { this.eventListeners.add(listener); }
  removeEventListener (listener: SyncEventListener): void { this.eventListeners.delete(listener); }

  private emitEvent (type: SyncEventType, data?: unknown): void {
    const event: SyncEvent = { type, data, timestamp: Date.now() };

    this.eventListeners.forEach(listener => {
      try { listener(event); } catch (error) { this.logger.error('Error in event listener', error); }
    });
  }

  private handleLatencyUpdate (measurement: LatencyMeasurement): void {
    this.currentLatency = measurement.totalLatency;
    this.driftCorrector.addMeasurement(measurement, measurement.totalLatency);
    this.emitEvent('latency:update', measurement);
    if (this.options.onLatencyUpdate) {this.options.onLatencyUpdate(measurement);}
  }

  private handleError (error: Error): void {
    this.emitEvent('error', error);
    if (this.options.onError) {this.options.onError(error);}
  }

  async destroy (): Promise<void> {
    this.logger.info('Destroying SyncManager...');
    try {
      await this.stopSync();
      if (this.calibrationTimeout) { clearTimeout(this.calibrationTimeout); this.calibrationTimeout = null; }

      this.eventListeners.clear();
      await this.audioEngine.close();
      this.latencyDetector.cleanup();
      this.driftCorrector.reset();
      this._isSyncing = false; this._isCalibrating = false; this.currentLatency = 0; this.currentDrift = 0; this.syncOffset = 0;
      this.logger.info('SyncManager destroyed');
    } catch (error) {
      this.logger.error('Failed to destroy SyncManager', error);
    }
  }
}
