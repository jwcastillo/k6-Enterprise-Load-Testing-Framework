#!/usr/bin/env node
import minimist from 'minimist';
import { Runner } from './runner.js';

const args = minimist(process.argv.slice(2));

if (!args.client) {
  console.error('Error: --client argument is required');
  process.exit(1);
}

const runner = new Runner({
  client: args.client,
  env: args.env || 'local',
  scenario: args.scenario,
  test: args.test,
  config: args.config, // Pass custom config path
});

runner.run().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
