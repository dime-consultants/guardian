#!/usr/bin/env node

/**
 * K+N Finance Automation Platform - Local Setup Script
 * 
 * This script helps set up the project locally by:
 * 1. Checking Node.js version
 * 2. Installing dependencies
 * 3. Creating .env.local from .env.example
 * 4. Providing setup instructions
 * 
 * Run with: npx ts-node scripts/setup.ts
 * Or: pnpm setup
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const log = {
  info: (msg: string) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m✗\x1b[0m ${msg}`),
  step: (msg: string) => console.log(`\n\x1b[1m${msg}\x1b[0m`),
};

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║   K+N Finance Automation Platform - Setup                 ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Check Node.js version
  log.step('Step 1: Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    log.error(`Node.js ${nodeVersion} detected. Please upgrade to Node.js 18 or higher.`);
    process.exit(1);
  }
  log.success(`Node.js ${nodeVersion} detected (OK)`);

  // Check package manager
  log.step('Step 2: Checking package manager...');
  let packageManager = 'pnpm';
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    log.success('pnpm detected');
  } catch {
    log.warn('pnpm not found, falling back to npm');
    packageManager = 'npm';
  }

  // Install dependencies
  log.step('Step 3: Installing dependencies...');
  try {
    log.info(`Running ${packageManager} install...`);
    execSync(`${packageManager} install`, { stdio: 'inherit' });
    log.success('Dependencies installed');
  } catch (error) {
    log.error('Failed to install dependencies');
    process.exit(1);
  }

  // Setup environment file
  log.step('Step 4: Setting up environment variables...');
  const envExamplePath = join(process.cwd(), '.env.example');
  const envLocalPath = join(process.cwd(), '.env.local');

  if (!existsSync(envExamplePath)) {
    log.error('.env.example not found');
    process.exit(1);
  }

  if (existsSync(envLocalPath)) {
    const overwrite = await prompt('.env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Keeping existing .env.local');
    } else {
      copyFileSync(envExamplePath, envLocalPath);
      log.success('.env.local created from .env.example');
    }
  } else {
    copyFileSync(envExamplePath, envLocalPath);
    log.success('.env.local created from .env.example');
  }

  // Configure environment variables
  log.step('Step 5: Configure environment variables...');
  
  const grokKey = await prompt('Enter your Grok API key (or press Enter to skip): ');
  const backendUrl = await prompt('Enter your backend URL (or press Enter for demo mode): ');

  if (grokKey || backendUrl) {
    let envContent = readFileSync(envLocalPath, 'utf-8');
    
    if (grokKey) {
      envContent = envContent.replace(
        'XAI_API_KEY=your_grok_api_key_here',
        `XAI_API_KEY=${grokKey}`
      );
      log.success('Grok API key configured');
    }
    
    if (backendUrl) {
      envContent = envContent.replace(
        'NEXT_PUBLIC_BACKEND_URL=',
        `NEXT_PUBLIC_BACKEND_URL=${backendUrl}`
      );
      log.success('Backend URL configured');
    }
    
    writeFileSync(envLocalPath, envContent);
  }

  // Final instructions
  log.step('Setup Complete!');
  console.log('\n');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                                                             │');
  console.log('│  Next steps:                                                │');
  console.log('│                                                             │');
  console.log(`│  1. Start the development server:                           │`);
  console.log(`│     ${packageManager === 'pnpm' ? 'pnpm dev' : 'npm run dev'}                                            │`);
  console.log('│                                                             │');
  console.log('│  2. Open http://localhost:3000 in your browser              │');
  console.log('│                                                             │');
  console.log('│  3. Toggle Demo Mode to see sample data                     │');
  console.log('│                                                             │');
  console.log('│  Documentation:                                             │');
  console.log('│  - README: docs/README.md                                   │');
  console.log('│  - Backend API: docs/BACKEND_API.md                         │');
  console.log('│                                                             │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n');

  rl.close();
}

main().catch((error) => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
