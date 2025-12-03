#!/usr/bin/env node

/**
 * Config Validator CLI
 * Validates configuration files against JSON Schema
 * Supports both JSON and YAML formats
 */

import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  string: ['file', 'client', 'env', 'format'],
  boolean: ['help', 'example', 'convert'],
  alias: {
    f: 'file',
    c: 'client',
    e: 'env',
    h: 'help',
    x: 'example'
  }
});

// Help text
const HELP_TEXT = `
Config Validator CLI - Validate k6 Enterprise Framework configuration files

Usage:
  node bin/cli/validate-config.js [options]

Options:
  -f, --file <path>      Path to config file to validate
  -c, --client <name>    Client name (validates clients/<name>/config/<env>.json)
  -e, --env <name>       Environment name (default: default)
  -x, --example          Generate example config
  --format <type>        Output format for example (json|yaml, default: json)
  --convert              Convert between JSON and YAML
  -h, --help             Show this help message

Examples:
  # Validate a specific config file
  node bin/cli/validate-config.js --file clients/examples/config/default.json

  # Validate client config
  node bin/cli/validate-config.js --client examples --env default

  # Generate example JSON config
  node bin/cli/validate-config.js --example

  # Generate example YAML config
  node bin/cli/validate-config.js --example --format yaml

  # Convert JSON to YAML
  node bin/cli/validate-config.js --file config.json --convert --format yaml

  # Convert YAML to JSON
  node bin/cli/validate-config.js --file config.yaml --convert --format json
`;

// Show help
if (argv.help) {
  console.log(HELP_TEXT);
  process.exit(0);
}

// Load ConfigValidator (after build)
let ConfigValidator;
try {
  const module = await import('../../dist/shared/validators/ConfigValidator.js');
  ConfigValidator = module.ConfigValidator;
} catch (error) {
  console.error('❌ Error: ConfigValidator not found. Please run "npm run build" first.');
  console.error(error);
  process.exit(1);
}

// Generate example
if (argv.example) {
  const format = argv.format || 'json';
  
  if (format === 'yaml') {
    console.log('# Example k6 Enterprise Framework Configuration (YAML)');
    console.log(ConfigValidator.generateExampleYAML());
  } else {
    console.log('// Example k6 Enterprise Framework Configuration (JSON)');
    console.log(JSON.stringify(ConfigValidator.generateExampleJSON(), null, 2));
  }
  
  process.exit(0);
}

// Determine config file path
let configPath;

if (argv.file) {
  configPath = path.resolve(argv.file);
} else if (argv.client) {
  const env = argv.env || 'default';
  const jsonPath = path.join(process.cwd(), 'clients', argv.client, 'config', `${env}.json`);
  const yamlPath = path.join(process.cwd(), 'clients', argv.client, 'config', `${env}.yaml`);
  const ymlPath = path.join(process.cwd(), 'clients', argv.client, 'config', `${env}.yml`);
  
  if (fs.existsSync(jsonPath)) {
    configPath = jsonPath;
  } else if (fs.existsSync(yamlPath)) {
    configPath = yamlPath;
  } else if (fs.existsSync(ymlPath)) {
    configPath = ymlPath;
  } else {
    console.error(`❌ Error: Config file not found for client "${argv.client}" and environment "${env}"`);
    console.error(`   Tried: ${jsonPath}, ${yamlPath}, ${ymlPath}`);
    process.exit(1);
  }
} else {
  console.error('❌ Error: Please specify --file or --client');
  console.log(HELP_TEXT);
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(configPath)) {
  console.error(`❌ Error: File not found: ${configPath}`);
  process.exit(1);
}

// Convert format if requested
if (argv.convert) {
  const targetFormat = argv.format || 'yaml';
  const result = ConfigValidator.validateFile(configPath);
  
  if (!result.valid) {
    console.error('❌ Configuration validation failed:');
    result.errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
  
  if (targetFormat === 'yaml') {
    console.log(ConfigValidator.toYAML(result.config));
  } else {
    console.log(JSON.stringify(result.config, null, 2));
  }
  
  process.exit(0);
}

// Validate config file
console.log(`🔍 Validating config: ${configPath}`);
console.log('');

const result = ConfigValidator.validateFile(configPath);

if (result.valid) {
  console.log('✅ Configuration is valid!');
  console.log('');
  console.log('📋 Configuration summary:');
  console.log(`   Base URL: ${result.config.baseUrl || 'Not specified'}`);
  
  if (result.config.scenarios) {
    const scenarioNames = Object.keys(result.config.scenarios);
    console.log(`   Scenarios: ${scenarioNames.length}`);
    scenarioNames.forEach(name => {
      const scenario = result.config.scenarios[name];
      console.log(`     - ${name}: ${scenario.executor} (${scenario.vus || '?'} VUs, ${scenario.duration || '?'})`);
    });
  }
  
  if (result.config.thresholds) {
    const thresholdCount = Object.keys(result.config.thresholds).length;
    console.log(`   Thresholds: ${thresholdCount}`);
  }
  
  process.exit(0);
} else {
  console.error('❌ Configuration validation failed:');
  console.error('');
  result.errors.forEach(err => console.error(`   - ${err}`));
  console.error('');
  console.error('💡 Tip: Run with --example to see a valid configuration example');
  process.exit(1);
}
