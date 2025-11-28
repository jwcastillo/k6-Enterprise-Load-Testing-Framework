#!/usr/bin/env node

/**
 * Parallel Test Runner for k6 Framework
 * 
 * Usage: node bin/run-parallel.js --tests="clients/local/scenarios/*.ts" --concurrency=2
 */

const { spawn } = require('child_process');
const glob = require('glob');
const minimist = require('minimist');
const path = require('path');
const os = require('os');

// Parse arguments
const args = minimist(process.argv.slice(2));
const PATTERN = args.tests || args.test;
const CONCURRENCY = args.concurrency || os.cpus().length;
const CLIENT = args.client || 'local';
const ENV = args.env || 'default';

if (!PATTERN) {
  console.error('❌ Error: --tests pattern is required');
  console.error('Usage: node bin/run-parallel.js --tests="clients/local/scenarios/*.ts"');
  process.exit(1);
}

// Find test files
const testFiles = glob.sync(PATTERN);

if (testFiles.length === 0) {
  console.error(`❌ No test files found matching pattern: ${PATTERN}`);
  process.exit(1);
}

console.log(`🚀 Found ${testFiles.length} tests. Running with concurrency: ${CONCURRENCY}`);

// Queue management
let activeWorkers = 0;
let fileIndex = 0;
const results = [];
const startTime = Date.now();

function runNext() {
  if (fileIndex >= testFiles.length) {
    if (activeWorkers === 0) {
      printSummary();
    }
    return;
  }

  const testFile = testFiles[fileIndex++];
  const testName = path.basename(testFile);
  activeWorkers++;

  console.log(`▶️  Starting: ${testName}`);

  const k6 = spawn('node', [
    'dist/core/cli.js',
    `--client=${CLIENT}`,
    `--env=${ENV}`,
    `--test=${testName}`,
    '--k6-arg=--quiet' // Reduce noise
  ]);

  let output = '';

  k6.stdout.on('data', (data) => {
    output += data.toString();
  });

  k6.stderr.on('data', (data) => {
    output += data.toString();
  });

  k6.on('close', (code) => {
    activeWorkers--;
    const duration = Date.now() - startTime; // This is total time, not test time
    
    const result = {
      file: testName,
      status: code === 0 ? 'PASS' : 'FAIL',
      output: output
    };
    results.push(result);

    console.log(`${code === 0 ? '✅' : '❌'} Finished: ${testName} (${code === 0 ? 'PASS' : 'FAIL'})`);
    
    if (code !== 0) {
      console.error(`   Error output for ${testName}:\n${output.slice(-500)}`); // Show last 500 chars
    }

    runNext();
  });
}

function printSummary() {
  const totalDuration = (Date.now() - startTime) / 1000;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 PARALLEL EXECUTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log(`Duration:    ${totalDuration.toFixed(2)}s`);
  console.log('='.repeat(50));

  results.forEach(r => {
    console.log(`${r.status === 'PASS' ? '✅' : '❌'} ${r.file}`);
  });

  process.exit(failed > 0 ? 1 : 0);
}

// Start initial workers
for (let i = 0; i < Math.min(CONCURRENCY, testFiles.length); i++) {
  runNext();
}
