/**
 * ChaosHelper - Fault injection utility for chaos testing
 */
import { sleep } from 'k6';
import { DataHelper } from './DataHelper.js';
import { DebugHelper } from './DebugHelper.js';

export interface ChaosConfig {
  enabled: boolean;
  rate: number; // 0.0 to 1.0 (probability of chaos)
  latency?: {
    min: number; // ms
    max: number; // ms
  };
  error?: {
    code: number; // HTTP status code to simulate
  };
}

export class ChaosHelper {
  private static config: ChaosConfig = {
    enabled: __ENV.K6_CHAOS_ENABLED === 'true',
    rate: parseFloat(__ENV.K6_CHAOS_RATE || '0.1'),
    latency: {
      min: parseInt(__ENV.K6_CHAOS_LATENCY_MIN || '100'),
      max: parseInt(__ENV.K6_CHAOS_LATENCY_MAX || '2000')
    },
    error: {
      code: parseInt(__ENV.K6_CHAOS_ERROR_CODE || '500')
    }
  };

  /**
   * Apply chaos based on configuration
   * Returns true if an error should be thrown/returned
   */
  public static apply(): boolean {
    if (!this.config.enabled) return false;

    // Determine if we should inject a fault based on rate
    if (Math.random() > this.config.rate) return false;

    const faultType = Math.random() > 0.5 ? 'latency' : 'error';

    if (faultType === 'latency' && this.config.latency) {
      const delay = DataHelper.randomInt(this.config.latency.min, this.config.latency.max);
      DebugHelper.debug(`💥 Chaos: Injecting ${delay}ms latency`);
      sleep(delay / 1000); // k6 sleep is in seconds
      return false; // Continue with request
    }

    if (faultType === 'error' && this.config.error) {
      DebugHelper.debug(`💥 Chaos: Injecting ${this.config.error.code} error`);
      return true; // Signal to return error response
    }

    return false;
  }

  /**
   * Get the configured error response
   */
  public static getErrorResponse() {
    return {
      status: this.config.error?.code || 500,
      status_text: 'Chaos Injection Error',
      body: JSON.stringify({ error: 'Chaos injected failure' }),
      headers: { 'Content-Type': 'application/json' },
      timings: { duration: 0, blocked: 0, connecting: 0, tls_handshaking: 0, sending: 0, waiting: 0, receiving: 0 },
    };
  }
}
