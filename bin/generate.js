#!/usr/bin/env node

/**
 * Test Generator CLI
 * 
 * Usage: 
 *   node bin/generate.js scenario <name> --client=<client>
 *   node bin/generate.js service <name> --client=<client>
 *   node bin/generate.js factory <name>
 *   node bin/generate.js (interactive mode)
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = minimist(process.argv.slice(2));
const command = args._[0];
const name = args._[1];

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');
const CLIENTS_DIR = path.resolve(__dirname, '../clients');
const SHARED_DIR = path.resolve(__dirname, '../shared');

async function main() {
  console.log(chalk.bold.blue('⚡ k6 Test Generator CLI'));

  if (!command) {
    await interactiveMode();
  } else {
    await cliMode();
  }
}

async function interactiveMode() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What do you want to generate?',
      choices: [
        { name: 'Test Scenario', value: 'scenario' },
        { name: 'Service Object', value: 'service' },
        { name: 'Data Factory', value: 'factory' },
        { name: 'New Client', value: 'client' }
      ]
    },
    {
      type: 'input',
      name: 'name',
      message: 'What is the name?',
      validate: (input) => input.length > 0 || 'Name is required'
    },
    {
      type: 'list',
      name: 'client',
      message: 'Select client:',
      choices: getClients(),
      when: (answers) => ['scenario', 'service'].includes(answers.type)
    }
  ]);

  await generate(answers.type, answers.name, answers);
}

async function cliMode() {
  const options = {
    client: args.client || 'local'
  };

  await generate(command, name, options);
}

async function generate(type, name, options) {
  try {
    switch (type) {
      case 'scenario':
        await generateScenario(name, options.client);
        break;
      case 'service':
        await generateService(name, options.client);
        break;
      case 'factory':
        await generateFactory(name);
        break;
      case 'client':
        await generateClient(name);
        break;
      default:
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        process.exit(1);
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error: ${err.message}`));
    process.exit(1);
  }
}

function getClients() {
  return fs.readdirSync(CLIENTS_DIR).filter(file => {
    return fs.statSync(path.join(CLIENTS_DIR, file)).isDirectory();
  });
}

async function generateScenario(name, client) {
  const serviceName = toPascalCase(name) + 'Service';
  const fileName = toKebabCase(name) + '.ts';
  const targetDir = path.join(CLIENTS_DIR, client, 'scenarios');
  const targetFile = path.join(targetDir, fileName);

  console.log(chalk.yellow(`Creating scenario in ${client}...`));

  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'scenario.ts.template'), 'utf8');
  const content = template.replace(/{{ServiceName}}/g, serviceName);

  ensureDir(targetDir);
  fs.writeFileSync(targetFile, content);

  console.log(chalk.green(`✅ Created scenario: ${targetFile}`));
}

async function generateService(name, client) {
  const serviceName = toPascalCase(name) + 'Service';
  const resourceName = toKebabCase(name);
  const fileName = serviceName + '.ts';
  const targetDir = path.join(CLIENTS_DIR, client, 'lib/services');
  const targetFile = path.join(targetDir, fileName);

  console.log(chalk.yellow(`Creating service in ${client}...`));

  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'service.ts.template'), 'utf8');
  const content = template
    .replace(/{{ServiceName}}/g, serviceName)
    .replace(/{{resourceName}}/g, resourceName);

  ensureDir(targetDir);
  fs.writeFileSync(targetFile, content);

  console.log(chalk.green(`✅ Created service: ${targetFile}`));
}

async function generateFactory(name) {
  const modelName = toPascalCase(name);
  const factoryName = modelName + 'Factory';
  const fileName = factoryName + '.ts';
  const targetDir = path.join(SHARED_DIR, 'factories');
  const targetFile = path.join(targetDir, fileName);

  console.log(chalk.yellow(`Creating factory...`));

  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'factory.ts.template'), 'utf8');
  const content = template
    .replace(/{{ModelName}}/g, modelName)
    .replace(/{{FactoryName}}/g, factoryName);

  ensureDir(targetDir);
  fs.writeFileSync(targetFile, content);

  console.log(chalk.green(`✅ Created factory: ${targetFile}`));
}

async function generateClient(name) {
  // Use existing shell script
  const { spawn } = await import('child_process');
  
  console.log(chalk.yellow(`Running create-client.sh...`));
  
  const child = spawn('./bin/create-client.sh', [name], { stdio: 'inherit' });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green(`✅ Client created successfully`));
    } else {
      console.error(chalk.red(`❌ Client creation failed`));
    }
  });
}

// Utils
function toPascalCase(str) {
  return str.replace(/(^\w|-\w)/g, clearAndUpper);
}

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function clearAndUpper(text) {
  return text.replace(/-/, "").toUpperCase();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

main().catch(console.error);
