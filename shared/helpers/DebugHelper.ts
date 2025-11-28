/**
 * DebugHelper - Centralized debugging utility
 */
import { check } from 'k6';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export class DebugHelper {
  private static level: LogLevel = this.parseLevel(__ENV.K6_DEBUG_LEVEL || 'INFO');
  private static filterVu: number | null = __ENV.K6_DEBUG_VU ? parseInt(__ENV.K6_DEBUG_VU) : null;
  private static filterIter: number | null = __ENV.K6_DEBUG_ITER ? parseInt(__ENV.K6_DEBUG_ITER) : null;

  private static parseLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private static shouldLog(): boolean {
    if (this.filterVu !== null && __VU !== this.filterVu) return false;
    if (this.filterIter !== null && __ITER !== this.filterIter) return false;
    return true;
  }

  public static log(message: string, level: LogLevel = LogLevel.INFO): void {
    if (level <= this.level && this.shouldLog()) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [VU:${__VU}] [ITER:${__ITER}]`;
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(`❌ ${prefix} ${message}`);
          break;
        case LogLevel.WARN:
          console.warn(`⚠️  ${prefix} ${message}`);
          break;
        case LogLevel.INFO:
          console.log(`ℹ️  ${prefix} ${message}`);
          break;
        case LogLevel.DEBUG:
          console.log(`🐛 ${prefix} ${message}`);
          break;
        case LogLevel.TRACE:
          console.log(`🔍 ${prefix} ${message}`);
          break;
      }
    }
  }

  public static error(message: string): void {
    this.log(message, LogLevel.ERROR);
  }

  public static warn(message: string): void {
    this.log(message, LogLevel.WARN);
  }

  public static info(message: string): void {
    this.log(message, LogLevel.INFO);
  }

  public static debug(message: string): void {
    this.log(message, LogLevel.DEBUG);
  }

  public static trace(message: string): void {
    this.log(message, LogLevel.TRACE);
  }

  public static dump(obj: any, label: string = 'Dump'): void {
    if (this.level >= LogLevel.DEBUG && this.shouldLog()) {
      console.log(`📦 ${label}:`, JSON.stringify(obj, null, 2));
    }
  }

  public static curl(method: string, url: string, headers: any, body: any): string {
    let cmd = `curl -X ${method.toUpperCase()} "${url}"`;
    
    for (const key in headers) {
      cmd += ` -H "${key}: ${headers[key]}"`;
    }

    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      cmd += ` -d '${bodyStr}'`;
    }

    return cmd;
  }
}
