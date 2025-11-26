import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

interface RunnerOptions {
  client: string;
  env: string;
  scenario?: string;
  test?: string;
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
    // If a specific test file is provided, use it. Otherwise, look for a default or scenario.
    let scriptPath = '';
    if (this.options.test) {
        // Try to find the script in the source directory first (if it's .js or .ts and we support it)
        // But since we compile to dist, we should look there for the .js file.
        
        // Check if we are running from source or if we should look in dist
        // Prioritize dist for execution if we are building the project
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
    } else {
        // Default behavior or error
        throw new Error('No test script specified. Use --test <filename>');
    }

    if (!scriptPath) {
        throw new Error(`Test script not found. Searched in: ${clientDir}/scenarios and dist/`);
    }

    // 4. Build k6 Command
    // We pass the merged config as an environment variable
    const k6Args = ['run', scriptPath];
    
    // Inject Environment Variables
    const env = {
      ...process.env,
      CLIENT: this.options.client,
      ENV: this.options.env,
      CONFIG: JSON.stringify(config),
    };

    console.log(`Executing k6: k6 ${k6Args.join(' ')}`);
    console.log(`CWD: ${this.rootDir}`);
    console.log(`Script exists: ${fs.existsSync(scriptPath)}`);
    console.log(`PATH: ${process.env.PATH}`);

    // 5. Execute
    // Using exec to mimic shell execution
    const command = `k6 ${k6Args.join(' ')}`;
    const { exec } = await import('child_process');
    
    return new Promise<void>((resolve, reject) => {
        const child = exec(command, { 
            env,
            cwd: this.rootDir 
        });

        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);

        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`k6 exited with code ${code}`));
            }
        });
    });
  }

  private async loadConfig(clientDir: string) {
    // Load Core Defaults (could be in core/defaults.json)
    const coreDefaults = { baseUrl: 'http://localhost' };

    // Load Client Defaults
    const clientDefaultsPath = path.join(clientDir, 'config', 'default.json');
    const clientDefaults = fs.existsSync(clientDefaultsPath) ? await fs.readJson(clientDefaultsPath) : {};

    // Load Client Env Config
    const clientEnvPath = path.join(clientDir, 'config', `${this.options.env}.json`);
    const clientEnv = fs.existsSync(clientEnvPath) ? await fs.readJson(clientEnvPath) : {};

    // Merge
    return {
      ...coreDefaults,
      ...clientDefaults,
      ...clientEnv,
    };
  }
}
