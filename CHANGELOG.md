# WebAudio Sync Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- Core WebAudio engine
- Latency detection system
- Manual tap sync (Guitar Hero style)
- Pulse check measurement
- Predictive drift correction
- Automated acoustic loopback (Pro feature)
- License management with Keygen.sh

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A

## [1.0.0] - 2024-01-01

### Added
- **Open Source Version**
  - Manual tap sync functionality
  - 2-second interactive pulse check
  - Native browser latency detection
  - Cross-browser support (Chrome, Firefox, Safari, Edge)
  - TypeScript support with full type definitions
  - React integration example

- **Professional Version**
  - Automated acoustic loopback measurement
  - Predictive drift correction system
  - License key management with Keygen.sh
  - Technical support

- **Build System**
  - TypeScript configuration
  - Multiple build targets (CommonJS, ESM)
  - Separate builds for OSS and Pro versions

- **Documentation**
  - Comprehensive README
  - API reference
  - Usage examples
  - Browser compatibility table

### Technical Details

#### Core Components
- `AudioEngine`: WebAudio context management and audio generation
- `LatencyDetector`: Multiple latency measurement methods
- `DriftCorrector`: Predictive drift correction algorithm
- `SyncManager`: Main synchronization coordinator

#### OSS Features
- `WebAudioSyncOSS`: Open source version with manual tap sync
- Manual pulse-based latency measurement
- Native browser latency detection
- Event-based architecture

#### Pro Features
- `WebAudioSyncPro`: Professional version with advanced features
- `AcousticLoopback`: Automated microphone-based latency measurement
- `LicenseManager`: Keygen.sh integration for license validation

#### Distribution Setup
- Polar.sh integration ready
- Keygen.sh license management

## [0.1.0] - 2023-12-01

### Added
- Project concept and planning
- Initial architecture design
- Feature specifications
- Business model planning

---

## Versioning Policy

We follow Semantic Versioning (SemVer) for all releases:

- **PATCH** (x.x.1) - Backwards-compatible bug fixes
- **MINOR** (x.1.x) - Backwards-compatible new features
- **MAJOR** (1.x.x) - Breaking changes

## Release Schedule

- **OSS Version**: Regular releases, approximately monthly
- **Pro Version**: Quarterly major updates, monthly minor updates
- **Enterprise**: Custom release schedules based on client needs

## Migration Guides

### From v0.x to v1.0

The v1.0 release introduces a new API structure. If you're migrating from a pre-release version:

1. **Import Changes**:
   ```typescript
   // Old (pre-release)
   import WebAudioSync from 'web-audio-sync';

   // New (v1.0+)
   import { createWebAudioSync } from 'web-audio-sync';
   const sync = createWebAudioSync({ tier: 'oss' });
   ```

2. **Method Changes**:
      `new WebAudioSync()` → `createWebAudioSync()`
      `sync.init()` → `sync.initialize()`
      `sync.measureLatency()` → `sync.detectLatency()`

3. **Pro Features**:
      `Acoustic loopback now requires Pro license`
      `Drift correction now requires Pro license`


### Deprecation Policy

- Deprecated features will be marked in the documentation
- Deprecated features will continue to work for at least one major version
- Deprecation warnings will be logged to the console

