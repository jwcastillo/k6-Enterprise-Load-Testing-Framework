import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

interface RunnerOptions {
  client: string;
  env: string;
  scenario?: string;
  test?: string;
  config?: string; // Path to custom config file
}

export class Runner {
  private options: RunnerOptions;
  private rootDir: string;

  constructor(options: RunnerOptions) {
    this.options = options;
    this.rootDir = process.cwd();
  }

  public async run() {
    console.log(`Starting Runner for client: ${this.options.client} on env: ${this.options.env}`);

    // 1. Resolve paths
    const clientDir = path.join(this.rootDir, 'clients', this.options.client);
    if (!fs.existsSync(clientDir)) {
      throw new Error(`Client directory not found: ${clientDir}`);
    }

    // 2. Load Configuration
    const config = await this.loadConfig(clientDir);
    console.log('Loaded Configuration:', config);

    // 3. Determine Test Script
    let scriptPath = '';
    if (this.options.test) {
        const possiblePaths = [
            path.join(this.rootDir, 'dist', 'clients', this.options.client, 'scenarios', this.options.test.replace('.ts', '.js')),
            path.join(clientDir, 'scenarios', this.options.test)
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                scriptPath = p;
                break;
            }
        }
    } else if (this.options.scenario) {
        const scenarioPath = path.join(clientDir, 'scenarios', this.options.scenario);
        if (fs.existsSync(scenarioPath)) {
            scriptPath = scenarioPath;
        }
    }

    if (!scriptPath) {
        throw new Error(`Test script not found. Searched in: ${clientDir}/scenarios and dist/`);
    }

    // 4. Setup report directories and paths
    const testName = this.options.test?.replace('.ts', '').replace('.js', '') || 'test';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const reportDir = path.join(this.rootDir, 'reports', this.options.client, testName);
    await fs.ensureDir(reportDir);

    const jsonOutputPath = path.join(reportDir, `k6-output-${timestamp}.json`);
    const webDashboardPath = path.join(reportDir, `k6-dashboard-${timestamp}.html`);
    const logFilePath = path.join(reportDir, `k6-execution-${timestamp}.log`);
    const summaryFilePath = path.join(reportDir, `k6-summary-${timestamp}.txt`);

    // 5. Build k6 command arguments with options
    const k6Args = ['run', scriptPath];
    
    // Add k6 options from config
    const k6Options = config.k6Options || {};
    
    // Summary mode (default: full)
    const summaryMode = k6Options.summaryMode || process.env.K6_SUMMARY_MODE || 'full';
    k6Args.push('--summary-mode', summaryMode);
    
    if (k6Options.summaryTrendStats) {
      k6Args.push('--summary-trend-stats', k6Options.summaryTrendStats.join(','));
    }
    if (k6Options.summaryTimeUnit) {
      k6Args.push('--summary-time-unit', k6Options.summaryTimeUnit);
    }
    if (k6Options.noColor) {
      k6Args.push('--no-color');
    }
    if (k6Options.quiet) {
      k6Args.push('--quiet');
    }

    // Add output formats
    k6Args.push('--out', `json=${jsonOutputPath}`);
    k6Args.push('--out', `web-dashboard=export=${webDashboardPath}`);

    // Add metrics backends if configured
    if (k6Options.metricsBackends && Array.isArray(k6Options.metricsBackends)) {
      for (const backend of k6Options.metricsBackends) {
        const outArg = this.buildMetricsBackendArg(backend);
        if (outArg) {
          k6Args.push('--out', outArg);
        }
      }
    }

    // Inject the merged configuration as an environment variable
    const env = {
      ...process.env,
      CLIENT: this.options.client,
      ENV: this.options.env,
      CONFIG: JSON.stringify(config),
    };

    console.log(`\nExecuting k6: k6 ${k6Args.join(' ')}`);
    console.log(`Report directory: ${reportDir}`);
    console.log(`JSON output: ${jsonOutputPath}`);
    console.log(`Web dashboard: ${webDashboardPath}`);
    console.log(`Log file: ${logFilePath}`);
    console.log(`Summary file: ${summaryFilePath}\n`);

    // 6. Execute k6 and capture output to log file
    let logOutput = '';
    let summaryOutput = '';
    let capturingSummary = false;

    await new Promise<void>((resolve, reject) => {
        const child = spawn('k6', k6Args, { 
            env,
            cwd: this.rootDir
        });

        // Create write stream for log file
        const logStream = fs.createWriteStream(logFilePath);

        child.stdout?.on('data', (data) => {
          const output = data.toString();
          process.stdout.write(output);
          logOutput += output;
          logStream.write(output);

          // Detect summary section (starts with THRESHOLDS header)
          if (output.includes('█ THRESHOLDS') || output.includes('THRESHOLDS') || capturingSummary) {
            capturingSummary = true;
            summaryOutput += output;
          }
        });

        child.stderr?.on('data', (data) => {
          const output = data.toString();
          process.stderr.write(output);
          logOutput += output;
          logStream.write(output);
        });

        child.on('exit', (code) => {
            logStream.end();
            
            // Save summary to separate file (only if we captured summary content)
            if (summaryOutput && summaryOutput.length > 50) {
              fs.writeFileSync(summaryFilePath, summaryOutput);
            }

            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`k6 exited with code ${code}`));
            }
        });

        child.on('error', (error) => {
            logStream.end();
            reject(new Error(`Failed to start k6: ${error.message}`));
        });
    });

    // 7. Generate custom HTML report
    console.log('\n📊 Generating custom HTML report...');
    try {
      const { exec } = await import('child_process');
      const customReportPath = path.join(reportDir, `custom-report-${timestamp}.html`);
      const reportCommand = `node bin/report.js --input="${jsonOutputPath}" --output="${customReportPath}" --client="${this.options.client}" --test="${testName}" --k6-dashboard="${path.basename(webDashboardPath)}"`;
      await new Promise<void>((resolve, reject) => {
        exec(reportCommand, { cwd: this.rootDir }, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            console.error('Error generating custom report:', error);
            reject(error);
          } else {
            console.log(stdout);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Failed to generate custom HTML report:', error);
    }
  }

  private buildMetricsBackendArg(backend: any): string | null {
    switch (backend.type) {
      case 'prometheus':
        return 'experimental-prometheus-rw';
      case 'datadog':
        return 'datadog';
      case 'newrelic':
        return 'newrelic';
      case 'dynatrace':
        return 'dynatrace';
      case 'influxdb':
        if (backend.url && backend.db) {
          return `influxdb=${backend.url}/${backend.db}`;
        }
        return 'influxdb';
      default:
        console.warn(`Unknown metrics backend type: ${backend.type}`);
        return null;
    }
  }

  private async loadConfig(clientDir: string) {
    // Load Core Defaults with k6 options
    const coreDefaults = { 
      baseUrl: 'http://localhost',
      k6Options: {
        summaryMode: 'full',
        summaryTrendStats: ['min', 'avg', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)'],
        summaryTimeUnit: 'ms',
        noColor: false,
        quiet: false,
        metricsBackends: []
      }
    };

    // Load Client Defaults
    const clientDefaultsPath = path.join(clientDir, 'config', 'default.json');
    const clientDefaults = fs.existsSync(clientDefaultsPath) ? await fs.readJson(clientDefaultsPath) : {};

    // Load Client Env Config
    const clientEnvPath = path.join(clientDir, 'config', `${this.options.env}.json`);
    const clientEnv = fs.existsSync(clientEnvPath) ? await fs.readJson(clientEnvPath) : {};

    // Load Custom Config if provided
    let customConfig = {};
    if (this.options.config) {
      const customConfigPath = path.resolve(this.options.config);
      if (fs.existsSync(customConfigPath)) {
        console.log(`Loading custom config from: ${customConfigPath}`);
        customConfig = await fs.readJson(customConfigPath);
      } else {
        console.warn(`Custom config file not found: ${customConfigPath}`);
      }
    }

    // Merge: Core < Client Default < Client Env < Custom Config
    const mergedConfig = {
      ...coreDefaults,
      ...clientDefaults,
      ...clientEnv,
      ...customConfig,
    };

    // Override k6Options from environment variables if present
    if (process.env.K6_SUMMARY_TREND_STATS) {
      mergedConfig.k6Options = mergedConfig.k6Options || {};
      mergedConfig.k6Options.summaryTrendStats = process.env.K6_SUMMARY_TREND_STATS.split(',');
    }
    if (process.env.K6_SUMMARY_TIME_UNIT) {
      mergedConfig.k6Options = mergedConfig.k6Options || {};
      mergedConfig.k6Options.summaryTimeUnit = process.env.K6_SUMMARY_TIME_UNIT;
    }
    if (process.env.K6_METRICS_BACKENDS) {
      mergedConfig.k6Options = mergedConfig.k6Options || {};
      const backends = process.env.K6_METRICS_BACKENDS.split(',').map(type => ({ type: type.trim() }));
      mergedConfig.k6Options.metricsBackends = backends;
    }

    return mergedConfig;
  }
}
