# WebAudio Sync

[![npm version](https://img.shields.io/npm/v/web-audio-sync.svg)](https://www.npmjs.com/package/web-audio-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![WebAudio API](https://img.shields.io/badge/WebAudio-API-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

**Precise Bluetooth audio synchronization for the web.**

WebAudio Sync is a powerful library that helps you achieve perfect audio synchronization in web applications, especially when dealing with Bluetooth devices that introduce variable latency. It also compensates delay from TVs/soundbars (A/V sync), car head units, USB DACs and audio interfaces, and helps keep multiple devices playing in sync. Ideal for rhythm games and music apps where player taps must be judged against a beat the user actually hears — on Bluetooth headphones that beat arrives late, and WebAudio Sync measures the real delay so your game can compensate.

## Features

### Open Source (Free)
- ✅ **Manual Tap Sync**: Guitar Hero-style pulse checking for latency measurement
- ✅ **Native Browser Latency Detection**: Uses browser's built-in output latency estimation (falls back gracefully when the browser reports 0 or omits it, e.g. Firefox with Bluetooth)
- ✅ **Interactive Pulse Check**: Plays short clicks (~20 ms) at a tappable rate (default 4 Hz) and measures your tap timing against them to estimate real output latency — including Bluetooth stack delay that `outputLatency` misses. This is exactly the measurement rhythm games need to judge taps against Bluetooth-delayed beats (try `test-tap-bounce.html`)
- ✅ **Cross-browser Support**: Works with Chrome, Firefox, Safari, Edge
- ✅ **TypeScript Support**: Full TypeScript definitions included

### Professional (Paid)
- ✅ **All OSS Features**
- ✅ **Automated Acoustic Loopback**: Sample-accurate latency measurement via swept-sine cross-correlation (microphone round-trip)
- ✅ **Predictive Drift Correction**: Continuously adjusts for Bluetooth signal fluctuations
- ✅ **Technical Support**: Priority email support
- ✅ **Priority Updates**: Early access to new features

## Installation

```bash
# Open Source version (MIT) — public npm registry
npm install web-audio-sync
```

### Professional version

The Pro edition is a **separate private package, `web-audio-sync-pro`** — not on the public npm registry. It depends on `web-audio-sync`, which npm installs automatically. After purchasing on Polar.sh you receive a download link for the tarball plus a Keygen.sh license key:

```bash
# From your purchase download:
npm install ./web-audio-sync-pro-<version>.tgz

# 1. Imports come from the pro package (it re-exports the full OSS API too):
#    import { createWebAudioSyncPro } from 'web-audio-sync-pro';
# 2. Pass your Keygen.sh license key:
#    const sync = createWebAudioSyncPro({ licenseKey: 'YOUR_KEYGEN_LICENSE_KEY' });
```

Pro methods validate the license key against Keygen.sh at runtime and refuse to run without a valid Pro license.

## Usage

> **Tip:** In this OSS package, `createWebAudioSync()` returns `WebAudioSyncOSS`. The Pro package `web-audio-sync-pro` adds `createWebAudioSyncPro()` (and re-exports everything from `web-audio-sync`, so Pro users can import from a single package).

### Basic Setup (Open Source)

```typescript
import { createWebAudioSync, isSupported } from 'web-audio-sync';

async function initialize() {
  if (!(await isSupported())) {
    console.error('WebAudio is not supported in this browser');
    return;
  }

  // Create OSS instance (default tier is 'pro', so pass tier explicitly)
  const sync = createWebAudioSync({ tier: 'oss' });

  // Initialize the library (must be called from a user gesture)
  const initialized = await sync.initialize();
  if (!initialized) {
    console.error('Failed to initialize WebAudio Sync');
    return;
  }

  // Start manual tap sync — plays pulses, call this when the user taps along
  sync.startManualTapSync({
    pulseCount: 10,           // Number of pulses to play
    pulseInterval: 1.0,       // Time between pulses (seconds)
    onTap: (timestamp, expectedTime) => {
      console.log('Tap recorded:', timestamp, 'Expected:', expectedTime);
    },
  });

  // Detect latency — returns LatencyMeasurement with times in SECONDS
  const latency = await sync.detectLatency();
  console.log('Output latency:', latency.outputLatency, 's, method:', latency.method);

  // Interactive pulse check — plays clicks, user taps along, returns measured latency
  const pulse = await sync.performPulseCheck();
  if (pulse.success) {
    console.log('Measured latency:', pulse.latency, 's, confidence:', pulse.confidence);
  }

  // Full calibration — combines native + pulse check, returns the best estimate
  const calibration = await sync.calibrate();
  console.log('Calibrated latency:', calibration.latency, 's, method:', calibration.method);

  // Get sync status
  const status = sync.getSyncStatus();
  console.log('Sync status:', status);
}

initialize();
```



### Pro Features Setup


```typescript
import { createWebAudioSyncPro } from 'web-audio-sync-pro';

// Create Pro instance with license key — returns WebAudioSyncPro directly
const sync = createWebAudioSyncPro({
  licenseKey: 'YOUR_LICENSE_KEY_HERE',
});

async function initializePro() {
  const initialized = await sync.initialize();
  if (!initialized) return;

  // Use automated acoustic loopback — latency in SECONDS
  const result = await sync.measureLatencyWithAcousticLoopback();
  if (result.success) {
    console.log('Measured latency:', result.latency, 's');
    console.log('Confidence:', result.confidence);
  }

  // Start drift correction
  sync.startDriftCorrection();

  // Get drift trend (seconds per second)
  const trend = sync.getDriftTrend();
  console.log('Drift trend:', trend);
}

initializePro();
```

### React Example

```typescript
import React, { useEffect, useState } from 'react';
import { createWebAudioSync, SyncStatus, LatencyMeasurement } from 'web-audio-sync';

function AudioSyncComponent() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [latency, setLatency] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const sync = createWebAudioSync({ tier: 'oss' });

    async function init() {
      await sync.initialize();

      // Set up event listeners
      sync.addEventListener((event) => {
        if (event.type === 'sync:change') {
          const status = event.data as SyncStatus;
          setSyncStatus(status);
          setIsSynced(status.isSynced);
        } else if (event.type === 'latency:update') {
          const measurement = event.data as LatencyMeasurement;
          setLatency(measurement.totalLatency); // seconds
        }
      });

      // Start sync
      await sync.startSync();

      // Perform initial calibration
      await sync.calibrate();
    }

    init();

    return () => {
      sync.destroy();
    };
  }, []);

  return (
    <div>
      <h2>Audio Sync Status</h2>
      <p>Status: {isSynced ? 'Synced' : 'Not Synced'}</p>
      <p>Latency: {latency.toFixed(3)} s</p>
      <p>Quality: {syncStatus?.quality ?? 'Unknown'}</p>
      <button onClick={() => sync.startManualTapSync()}>
        Manual Tap Sync
      </button>
    </div>
  );
}

export default AudioSyncComponent;
```



## Local Test Pages

The repo includes ready-to-run HTML pages (no build step needed — they import from `./dist/esm/index.js`):

```bash
npx serve .        # or: python3 -m http.server 8000
```

| Page | What it does |
| --- | --- |
| `test-audio.html` | OSS workflow: initialize, detect latency (native + pulse check), calibrate, manual tap sync, sync status |
| `test-bluetooth-latency.html` | Flash + click alignment test. A flash and a click fire simultaneously; adjust the slider until they feel aligned. The result is saved to `localStorage.btAudioDelayMs` — this measures the **real** Bluetooth delay that `outputLatency` underreports |
| `test-av-sync.html` | Local video A/V sync: plays a video file through a canvas with a configurable frame delay so the picture matches Bluetooth-delayed audio. Use the delay from `test-bluetooth-latency.html` |
| `test-tap-bounce.html` | Tap-to-bounce demo: tap the screen (or Space) and the ball bounces with a click. With compensation ON, the visual bounce is delayed by the measured delay from `localStorage.btAudioDelayMs` so it coincides with the Bluetooth-delayed click you actually hear — toggle OFF to feel the desync |

> Note: `test-av-sync.html` works with **local video files**, not YouTube embeds. The YouTube IFrame API does not expose separate control over video rendering vs. audio output, so internal A/V sync of an embedded video cannot be compensated from outside the player.

## API Reference

### Core Classes

`WebAudioSyncOSS`

The open-source version of the library.

Methods:

   - `initialize(): Promise<boolean>` - Initialize the library (call from a user gesture)
   - `getAudioContext(): AudioContext | null` - Get the WebAudio context
   - `startManualTapSync(options?: ManualTapSyncOptions): void` - Start manual tap sync (plays pulses, fires `onTap` per tap)
   - `detectLatency(): Promise<LatencyMeasurement>` - Detect current latency (times in seconds)
   - `performPulseCheck(): Promise<PulseCheckResult>` - Play clicks and measure tap timing for real output latency
   - `calibrate(): Promise<SyncCalibrationResult>` - Full calibration combining native + pulse check
   - `startSync(): Promise<boolean>` - Start synchronization
   - `stopSync(): Promise<void>` - Stop synchronization
   - `getSyncStatus(): SyncStatus` - Get current sync status
   - `getCurrentLatency(): number` - Get current latency in seconds
   - `playTestTone(frequency?: number, duration?: number): Promise<void>` - Play a test tone (defaults: 1000 Hz, 0.5 s)
   - `addEventListener(listener: SyncEventListener): void` - Add event listener
   - `removeEventListener(listener: SyncEventListener): void` - Remove event listener
   - `destroy(): Promise<void>` - Clean up resources
   - `getVersion(): string` - Library version
   - `getTier(): 'oss'` - Tier identifier



`WebAudioSyncPro`

The professional version with additional features. Includes all OSS methods plus:

   - `setLicenseKey(key: string): Promise<boolean>` - Set license key
   - `getLicenseStatus(): LicenseStatus` - Get license status
   - `measureLatencyWithAcousticLoopback(): Promise<{ success: boolean; latency: number; confidence: number }>` - Automated latency measurement via mic round-trip + cross-correlation (sample-accurate, latency in seconds)
   - `startDriftCorrection(): void` - Start predictive drift correction
   - `stopDriftCorrection(): void` - Stop drift correction
   - `getDriftTrend(): number` - Current drift trend (seconds per second)
   - `getCurrentDrift(): number` - Current drift in seconds
   - `getTier(): 'pro'` - Tier identifier


### Types


`LatencyMeasurement`

```typescript

{
  outputLatency: number;    // Output latency in seconds
  inputLatency: number;     // Input latency in seconds
  totalLatency: number;     // Total latency in seconds
  timestamp: number;        // DOMHighResTimeStamp
  confidence: number;       // 0-1 confidence score
  method: 'native' | 'pulse' | 'acoustic' | 'manual';
}

```

`SyncStatus`

```typescript
{
  isSynced: boolean;        // Whether audio is currently synced
  currentLatency: number;  // Current latency in seconds
  drift: number;            // Current drift in seconds (positive = audio is ahead)
  timestamp: number;        // DOMHighResTimeStamp
  lastCheck: number;        // Last check timestamp
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}
```

`SyncCalibrationResult` — returned by `calibrate()`

```typescript
{
  success: boolean;
  latency: number;              // Best latency estimate in seconds
  outputLatency?: number;       // Output-only latency in seconds
  measurements: LatencyMeasurement[];
  confidence: number;           // 0-1 confidence score
  method?: 'native' | 'pulse' | 'acoustic' | 'manual';
}
```

`PulseCheckResult` — returned by `performPulseCheck()`

```typescript
{
  success: boolean;
  latency: number;        // Measured round-trip latency in seconds
  confidence: number;     // 0-1 confidence score
  measurements: number[]; // Individual tap offset measurements
  timestamp: number;      // DOMHighResTimeStamp
}
```

`ManualTapSyncOptions` — options for `startManualTapSync()`

```typescript
{
  pulseCount?: number;                                              // Number of pulses (default: 10)
  pulseInterval?: number;                                           // Seconds between pulses (default: 1.0)
  onTap?: (timestamp: number, expectedTime?: number) => void;       // Called on each user tap
}
```

`SyncEvent` — delivered to event listeners

```typescript
{
  type: 'sync:start' | 'sync:stop' | 'sync:change' | 'latency:update'
      | 'calibration:start' | 'calibration:complete' | 'calibration:fail'
      | 'drift:correction' | 'error';
  data?: unknown;       // Cast to SyncStatus / LatencyMeasurement depending on type
  timestamp: number;
}
```

`LicenseStatus`

```typescript
{
  isValid: boolean;         // Whether license is valid
  tier: 'oss' | 'pro';
  expiresAt?: number;       // Expiration timestamp
  features: string[];       // Available features
}
```

`AcousticLoopbackOptions` — options for Pro acoustic loopback

```typescript
{
  chirpFrequency?: number;       // legacy alias for sweepEndFrequency (Hz)
  chirpDuration?: number;        // sweep duration in seconds (default: 0.05)
  detectionTimeout?: number;     // per-round timeout in seconds (default: 5)
  calibrationRounds?: number;    // default: 3
  noiseGateThreshold?: number;   // legacy alias for minCorrelation
  sweepStartFrequency?: number;  // Hz (default: 500)
  sweepEndFrequency?: number;    // Hz (default: 8000)
  maxLatency?: number;           // max expected round-trip in seconds (default: 0.5)
  minCorrelation?: number;       // min correlation peak to accept a round (default: 0.2)
  preRoll?: number;              // seconds between recording start and sweep (default: 0.05)
}
```


## How It Works
### Latency Detection Methods

   - Native Browser Latency - Uses the browser's built-in `outputLatency` property. Note: Firefox reports ~50 ms even with Bluetooth audio, and some browsers report 0 — the library treats 0 as unavailable and the pulse check is the reliable way to measure real Bluetooth delay

   - Pulse Check - Plays short clicks (~20 ms) at a tappable rate (default 4 Hz); the user taps/clicks/Space in time with them and the tap offsets are used to estimate real output latency, including Bluetooth stack delay

   - Manual Tap Sync - User taps in rhythm with audio pulses to measure latency

   - Acoustic Loopback (Pro) - Plays a swept-sine chirp and detects it via microphone, then computes the delay by normalized cross-correlation (see precision notes below)

### Acoustic Loopback Precision (Pro)

The Pro loopback does not rely on wall-clock timestamps. Each round:

1. Builds a **linear swept sine** (default 500 Hz → 8 kHz over 50 ms, Hann-windowed) as an `AudioBuffer`.
2. Schedules it on the **AudioContext clock** at a known time `t0` (`source.start(t0)` — sample-accurate by design).
3. Records the microphone into a sample buffer, timestamping each capture block with `AudioContext.currentTime`.
4. Finds the delay by **normalized cross-correlation** (`MathUtils.crossCorrelate`) of the recording against the sweep, with **parabolic interpolation around the peak for sub-sample resolution** (~0.02 ms at 48 kHz).
5. Converts the peak lag to an audio time via the block timestamps: `latency = arrivalTime - t0`, then subtracts the browser-reported `inputLatency` (when available) to approximate output-only latency.

Multiple rounds (default 3) are averaged (median) and the confidence score combines the correlation peak with round-to-round consistency. A round is rejected if the correlation peak is below `minCorrelation` (default 0.2), e.g. in a noisy room.

**What the number includes:** the acoustic loopback measures the round trip — output device (incl. Bluetooth stack) + air + microphone input. Subtracting `inputLatency` leaves an estimate of the true output latency. Practical accuracy is a few milliseconds (dominated by capture-block quantization and the mic path), which is typically far better than trusting `outputLatency` on Bluetooth, where Firefox/Chrome can underreport by hundreds of ms.

### Timing Notes for DAW Developers

- **Schedule audio on the AudioContext clock, never `setTimeout`.** Anything started with `node.start(ctx.currentTime + t)` is sample-accurate; the browser already renders ahead and compensates `outputLatency` for you. Within a DAW, all internal audio sync comes for free from the audio clock — measured latency is only needed to align WebAudio with *external* events (video frames, MIDI hardware, other devices).
- To map a wall-clock/visual event at `performance.now()` onto the audio clock: `audioTime = ctx.currentTime + (eventWallClock - performance.now()) / 1000 - outputLatency`.
- **Display latency is not measurable from JS** — assume ~1 frame (16.7 ms at 60 Hz) when aligning audio to video.
- Bluetooth latency **drifts over time** — use Pro's drift correction to track it continuously rather than measuring once.
- Measurement order of preference: acoustic loopback (Pro, most accurate end-to-end) → pulse check (tap along, good fallback) → native `outputLatency` (exact when the browser reports honestly; treat 0 as unavailable).

### Drift Correction (Pro)

#### Bluetooth audio devices often experience variable latency due to:

  - Signal interference
  - Device buffering
  - Network conditions (for wireless devices)
  - Battery level

#### The predictive drift correction system:

  - Continuously monitors latency changes
  - Uses linear regression to predict future drift
  - Applies smooth corrections to maintain synchronization
  - Adapts correction strength based on measurement confidence


## Browser Support


| Browser | Native Latency | Pulse Check | Acoustic Loopback | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Chrome | ✅ Yes | ✅ Yes | ✅ Yes | Full support |
| Firefox | ✅ Yes | ✅ Yes | ✅ Yes | Full support |
| Safari | ⚠️ Partial | ✅ Yes | ✅ Yes | Native latency may not be available |
| Edge | ✅ Yes | ✅ Yes | ✅ Yes | Full support |
| Mobile Chrome | ✅ Yes | ✅ Yes | ✅ Yes | Requires user gesture |
| Mobile Safari | ❌ No | ✅ Yes | ✅ Yes | Limited microphone access |


## Licensing
### Open Source (MIT License)

   - Free to use
   - Includes manual tap sync and pulse check
   - Perfect for basic synchronization needs

### Professional License

   
  - Price: €199 one-time per developer seat (unlimited projects)
  - Perpetual license: the version you buy never expires and keeps working in shipped products
  - Includes 12 months of updates (all v1.x releases); optional renewal at 50% after year 1
     -  Includes all OSS features plus:
     -  Automated acoustic loopback
     -  Predictive drift correction
     -  Technical support
  - Distribution: Polar.sh (EU Merchant of Record — VAT handled)
  - License Management: Keygen.sh

## Distribution


### Buy on Polar.sh

[https://polar.sh/web-audio-sync](https://polar.sh/web-audio-sync)

## License Key Management

We use Keygen.sh for license key management and validation.

### Validation Flow

   - User purchases license on Polar.sh
   - Keygen.sh generates and delivers license key
   - Your application validates key with Keygen.sh API
   -  Keygen.sh confirms validity and returns license details

### Integration Example

```typescript

import { LicenseManager } from 'web-audio-sync';

const licenseManager = new LicenseManager({
  licenseKey: 'YOUR_KEY',
  productId: 'web-audio-sync-pro',
  apiUrl: 'https://api.keygen.sh/v1',
  onLicenseChange: (status) => {
    console.log('License status:', status);
  }
});

// Validate license
const isValid = await licenseManager.validate();

// Check features
if (licenseManager.hasFeature('acoustic_loopback')) {
  // Enable Pro features
}


```



```bash

# Install dependencies
npm install

# Build all versions
npm run build

# Build OSS version only
npm run build:oss

# Build Pro version only
npm run build:pro

# Run tests
npm test

# Lint source
npm run lint

# Generate documentation
npm run docs


```


## Changelog
v1.0.0 (2026-11-01)

  - Initial release
  - Open Source version with manual tap sync
  - Professional version with acoustic loopback and drift correction
  - Full TypeScript support
  - Browser compatibility improvements

## Roadmap/Dreamplan

  - v1.2.0 - WebWorker support for background processing
  - v1.3.0 - React Native support
  - v2.0.0 - Real-time multi-device synchronization


## Community Support

  - GitHub Issues: github.com/your-org/web-audio-sync/issues
 

## Professional Support

  - Email: support@honeyplunge.dev
  - Response time: < 24 hours (business days)

## Security

If you discover a security vulnerability, please email support@honeyplunge.dev instead of using the public issue tracker.

Legal

  - Privacy Policy: https://github.com/honeyplunge/web-audio-sync/blob/main/LEGAL.md
  - Terms of Service: https://github.com/honeyplunge/web-audio-sync/blob/main/LEGAL.md
  - License Agreement: https://github.com/honeyplunge/web-audio-sync/blob/main/LICENSE

## Credits

  - WebAudio API: MDN Web Docs
  - Keygen.sh: License Management
  - Polar.sh: Merchant of Record (payments, VAT, digital delivery)

## Sponsors

Thank you to our sponsors for supporting this project!

  - honeyplunge
  

# WebAudio Sync - Perfect audio synchronization for the web.

© 2026 honeyplunge. All rights reserved.

Website | Documentation | GitHub