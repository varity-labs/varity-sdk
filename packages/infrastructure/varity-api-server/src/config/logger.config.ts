import { envConfig } from './env.config';

/**
 * Logger Configuration
 * Simple console-based logger with levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = logLevelMap[envConfig.monitoring.logLevel] || LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const logMessage = `[${timestamp}] [${levelName}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, meta || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, meta || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, meta || '');
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage, meta || '');
        break;
    }
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
}

export const logger = new Logger();
export default logger;
