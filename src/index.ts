// WebAudio Sync - Open Source Edition
// Public entry point: OSS features only (no Pro code in this package)

import {
  SyncOptions,
  WebAudioSyncConfig,
} from './types';
import { WebAudioSyncOSSClass, createWebAudioSyncOSS } from './oss';
import type { WebAudioSyncOSS } from './oss';

// Export types
export * from './types';

// Export OSS version
export {
  WebAudioSyncOSSClass,
  createWebAudioSyncOSS,
  getWebAudioSyncOSS,
} from './oss';
export type { WebAudioSyncOSS } from './oss';

// Export core components
export { AudioEngine } from './core/audioEngine';
export { LatencyDetector } from './core/latencyDetector';
export { DriftCorrector } from './core/driftCorrector';
export { SyncManager } from './core/syncManager';
export type { SyncCalibrationResult } from './core/syncManager';

// Export utilities
export { BrowserUtils } from './utils/browser';
export { MathUtils } from './utils/math';
export { Logger } from './utils/logger';

// Factory
export interface WebAudioSyncFactoryOptions extends SyncOptions {
  config?: WebAudioSyncConfig;
}

/**
 * Factory function to create a WebAudio Sync OSS instance
 */
export function createWebAudioSync (options: WebAudioSyncFactoryOptions = {}): WebAudioSyncOSS {
  return createWebAudioSyncOSS(options);
}

/**
 * Check if WebAudio is supported in the current browser
 */
export async function isSupported (): Promise<boolean> {
  return (window as unknown as Record<string, unknown>).AudioContext !== undefined ||
         (window as unknown as Record<string, unknown>).webkitAudioContext !== undefined;
}

/**
 * Check if microphone access is available
 */
export async function hasMicrophoneAccess (): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    stream.getTracks().forEach(track => track.stop());

    return true;
  } catch {
    return false;
  }
}

/**
 * Get library version
 */
export function getVersion (): string {
  return '1.0.1';
}

/**
 * Get available tier features
 */
export function getTierFeatures (): Record<string, string[]> {
  return {
    oss: [
      'Manual tap sync',
      'Pulse check latency measurement',
      'Native browser latency detection',
      'Basic audio synchronization',
    ],
  };
}

// Default export
export default {
  createWebAudioSync,
  isSupported,
  hasMicrophoneAccess,
  getVersion,
  getTierFeatures,
  WebAudioSyncOSS: WebAudioSyncOSSClass,
  createWebAudioSyncOSS,
};
