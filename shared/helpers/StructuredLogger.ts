import { RefinedResponse } from "k6/http";

/**
 * StructuredLogger - JSON-formatted logging for external ingestion
 */
export class StructuredLogger {
  /**
   * Log HTTP request/response in JSON format
   */
  public static logRequest(
    method: string,
    url: string,
    response: RefinedResponse<any>,
    metadata?: Record<string, any>
  ): void {
    // @ts-ignore
    if (__ENV.K6_STRUCTURED_LOGS !== "true") {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      // @ts-ignore
      vu: __VU,
      // @ts-ignore
      iter: __ITER,
      method,
      url,
      status: response.status,
      duration: response.timings.duration,
      ...metadata,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log custom event in JSON format
   */
  public static logEvent(eventName: string, data?: Record<string, any>): void {
    // @ts-ignore
    if (__ENV.K6_STRUCTURED_LOGS !== "true") {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      // @ts-ignore
      vu: __VU,
      // @ts-ignore
      iter: __ITER,
      event: eventName,
      ...data,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log error in JSON format
   */
  public static logError(
    error: Error | string,
    context?: Record<string, any>
  ): void {
    // @ts-ignore
    if (__ENV.K6_STRUCTURED_LOGS !== "true") {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      // @ts-ignore
      vu: __VU,
      // @ts-ignore
      iter: __ITER,
      level: "error",
      message: typeof error === "string" ? error : error.message,
      stack: typeof error === "string" ? undefined : error.stack,
      ...context,
    };

    console.log(JSON.stringify(logEntry));
  }
}
