// WebAudio Sync - Open Source Version
// Basic audio synchronization with manual tap sync

import {
  LatencyMeasurement,
  SyncOptions,
  SyncStatus,
  WebAudioSyncConfig,
  PulseCheckResult,
  SyncEventListener,
  ManualTapSyncOptions,
  TapEvent,
} from '../types';
import { SyncManager, SyncCalibrationResult } from '../core/syncManager';
import { BrowserUtils } from '../utils/browser';
import { Logger } from '../utils/logger';

export interface WebAudioSyncOSSOptions extends SyncOptions {
  config?: WebAudioSyncConfig;
}

export interface WebAudioSyncOSS {
  // Initialization
  initialize(): Promise<boolean>;

  // Audio context access
  getAudioContext(): AudioContext | null;

  // Manual tap sync (main OSS feature)
  startManualTapSync(options?: ManualTapSyncOptions): void;

  // Latency detection
  detectLatency(): Promise<LatencyMeasurement>;
  performPulseCheck(): Promise<PulseCheckResult>;

  // Sync status
  getSyncStatus(): SyncStatus;
  getCurrentLatency(): number;

  // Sync control
  startSync(): Promise<boolean>;
  stopSync(): Promise<void>;

  // Calibration
  calibrate(): Promise<SyncCalibrationResult>;

  // Event handling
  addEventListener(listener: SyncEventListener): void;
  removeEventListener(listener: SyncEventListener): void;

  // Cleanup
  destroy(): Promise<void>;

  // Version info
  getVersion(): string;
  getTier(): 'oss';

  // Utility
  playTestTone(frequency?: number, duration?: number): Promise<void>;
}

export class WebAudioSyncOSSClass implements WebAudioSyncOSS {
  private syncManager: SyncManager;
  private options: WebAudioSyncOSSOptions;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor (options: WebAudioSyncOSSOptions = {}) {
    this.options = {
      ...options,
      config: {
        logLevel: 'info',
        ...options.config,
      },
    };

    this.logger = new Logger(this.options.config, 'WebAudioSync-OSS');
    this.syncManager = new SyncManager({
      ...this.options,
      driftCorrection: {
        enabled: false, // Drift correction is Pro feature
        ...this.options.driftCorrection,
      },
    });
  }

  async initialize (): Promise<boolean> {
    if (this.isInitialized) {return true;}

    this.logger.info('Initializing WebAudio Sync OSS...');

    try {
      const success = await this.syncManager.initialize();

      if (success) {
        this.isInitialized = true;
        this.logger.info('WebAudio Sync OSS initialized successfully');
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to initialize WebAudio Sync OSS', error);

      return false;
    }
  }

  getAudioContext (): AudioContext | null {
    return this.syncManager.getAudioContext();
  }

  // Manual tap sync - Main OSS feature
  startManualTapSync (options: ManualTapSyncOptions = {}): void {
    if (!this.isInitialized) {
      this.logger.warn('WebAudio Sync not initialized. Call initialize() first.');

      return;
    }

    this.logger.info('Starting manual tap sync (OSS feature)');

    const onTap = options.onTap;

    this.syncManager.startManualTapSync({
      pulseCount: options.pulseCount,
      pulseInterval: options.pulseInterval,
      onTap: onTap ? (tap: TapEvent): void => {
        onTap(tap.timestamp, tap.expectedTime);
      } : undefined,
    });
  }

  // Latency detection
  async detectLatency (): Promise<LatencyMeasurement> {
    if (!this.isInitialized) {
      throw new Error('WebAudio Sync not initialized. Call initialize() first.');
    }

    try {
      return await this.syncManager.detectLatency();
    } catch {
      // Return a proper LatencyMeasurement object
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
    if (!this.isInitialized) {
      throw new Error('WebAudio Sync not initialized. Call initialize() first.');
    }

    return this.syncManager.performPulseCheck();
  }

  // Sync status
  getSyncStatus (): SyncStatus {
    if (!this.isInitialized) {
      return {
        isSynced: false,
        currentLatency: 0,
        drift: 0,
        timestamp: Date.now(),
        lastCheck: Date.now(),
        quality: 'poor',
      };
    }

    return this.syncManager.getSyncStatus();
  }

  getCurrentLatency (): number {
    if (!this.isInitialized) {
      return 0;
    }

    return this.syncManager.getCurrentLatency();
  }

  // Sync control
  async startSync (): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.syncManager.startSync();
  }

  async stopSync (): Promise<void> {
    return this.syncManager.stopSync();
  }

  // Calibration
  async calibrate (): Promise<SyncCalibrationResult> {
    if (!this.isInitialized) {
      throw new Error('WebAudio Sync not initialized. Call initialize() first.');
    }

    return this.syncManager.calibrate();
  }

  // Event handling
  addEventListener (listener: SyncEventListener): void {
    this.syncManager.addEventListener(listener);
  }

  removeEventListener (listener: SyncEventListener): void {
    this.syncManager.removeEventListener(listener);
  }

  // Cleanup
  async destroy (): Promise<void> {
    this.isInitialized = false;

    return this.syncManager.destroy();
  }

  // Version info
  getVersion (): string {
    return '1.0.0';
  }

  getTier (): 'oss' {
    return 'oss';
  }

  // Utility methods
  async playTestTone (frequency: number = 1000, duration: number = 0.5): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const engine = this.syncManager.getAudioEngine();

    engine.playTestTone(frequency, duration);
  }

  // Static methods
  static async isSupported (): Promise<boolean> {
    return BrowserUtils.isAudioContextSupported();
  }

  static async hasMicrophoneAccess (): Promise<boolean> {
    return BrowserUtils.hasMicrophoneAccess();
  }
}

// Create singleton instance
const instance: WebAudioSyncOSSClass | null = null;

export function createWebAudioSyncOSS (options: WebAudioSyncOSSOptions = {}): WebAudioSyncOSS {
  return new WebAudioSyncOSSClass(options);
}

export function getWebAudioSyncOSS (): WebAudioSyncOSS | null {
  return instance;
}

export default WebAudioSyncOSSClass;
