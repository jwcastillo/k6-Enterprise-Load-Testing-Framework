import { SharedArray } from 'k6/data';

export interface Config {
  baseUrl: string;
  vus?: number;
  duration?: string;
  scenarios?: Record<string, any>;
  thresholds?: Record<string, any[]>;
  [key: string]: any;
}

export class ConfigLoader {
  private client: string;
  private env: string;

  constructor() {
    this.client = __ENV.CLIENT || 'default';
    this.env = __ENV.ENV || 'local';
  }

  public load(): Config {
    // In k6, we can't use 'fs' freely in the main thread in the same way as Node.
    // We rely on SharedArray to load JSONs if needed, or just pure imports if we bundle.
    // For this design, we will assume the runner injects the merged config as env vars 
    // OR we load specific JSONs based on the env vars.
    
    // Simulating hierarchical load:
    // 1. Core defaults (hardcoded or base file)
    const coreDefaults = {
      baseUrl: 'http://localhost:3000',
      vus: 1,
      duration: '10s',
    };

    // 2. Client config would ideally be loaded here. 
    // Since k6 is restrictive with dynamic imports, we might need the runner to 
    // pre-process the config and pass it as a single JSON env var or file.
    
    // For now, let's assume the runner does the heavy lifting of merging 
    // and passes a final configuration object via __ENV.CONFIG
    
    const runtimeConfig = __ENV.CONFIG ? JSON.parse(__ENV.CONFIG) : {};

    return {
      ...coreDefaults,
      ...runtimeConfig,
    };
  }
}
