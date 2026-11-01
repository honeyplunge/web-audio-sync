// Logger utility for WebAudio Sync

import { WebAudioSyncConfig } from '../types';

export class Logger {
  private config: WebAudioSyncConfig;
  private prefix: string;

  constructor (config: WebAudioSyncConfig = {}, prefix: string = 'WebAudioSync') {
    this.config = config;
    this.prefix = prefix;
  }

  private shouldLog (level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const logLevel = this.config.logLevel ?? 'info';

    const levels: Record<string, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4,
    };

    return levels[level] >= levels[logLevel];
  }

  private formatMessage (level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();

    let formatted = `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}`;

    if (data !== undefined) {
      formatted += ` ${JSON.stringify(data)}`;
    }

    return formatted;
  }

  debug (message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info (message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn (message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error (message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  // Static instance for convenience
  private static instance: Logger | null = null;

  static getInstance (config: WebAudioSyncConfig = {}, prefix: string = 'WebAudioSync'): Logger {
    if (Logger.instance?.config !== config) {
      Logger.instance = new Logger(config, prefix);
    }

    return Logger.instance;
  }

  static debug (message: string, data?: unknown): void {
    Logger.getInstance().debug(message, data);
  }

  static info (message: string, data?: unknown): void {
    Logger.getInstance().info(message, data);
  }

  static warn (message: string, data?: unknown): void {
    Logger.getInstance().warn(message, data);
  }

  static error (message: string, data?: unknown): void {
    Logger.getInstance().error(message, data);
  }

  static configure (config: WebAudioSyncConfig): void {
    Logger.instance = new Logger(config, 'WebAudioSync');
  }
}

export default Logger;
