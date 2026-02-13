#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const SSOT_DIR = path.join(PROJECT_ROOT, 'standards', 'contica-ssot');

const SSOT_FILES = [
  'baseline-levels.md',
  'authentication-matrix.md',
  'network-security.md',
  'required-tiers.md',
  'naming-convention.md',
  'azure-policies.md',
  'known-exceptions.md',
  'opportunity-categories.md'
];

async function checkSSOTFiles() {
  console.log(chalk.bold('\n📚 Checking SSOT Standards Files\n'));

  const results = {
    found: [],
    missing: []
  };

  for (const file of SSOT_FILES) {
    const filePath = path.join(SSOT_DIR, file);
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      results.found.push({
        file,
        size: stats.size,
        modified: stats.mtime
      });
    } catch (error) {
      results.missing.push(file);
    }
  }

  if (results.found.length > 0) {
    console.log(chalk.green(`✓ Found ${results.found.length} SSOT files:\n`));
    results.found.forEach(({ file, size, modified }) => {
      console.log(chalk.cyan(`  • ${file}`));
      console.log(chalk.gray(`    ${(size / 1024).toFixed(1)} KB, last modified: ${modified.toLocaleDateString()}`));
    });
  }

  if (results.missing.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Missing ${results.missing.length} SSOT files:\n`));
    results.missing.forEach(file => {
      console.log(chalk.yellow(`  • ${file}`));
    });
  }

  console.log('');
  return results;
}

async function showSyncInstructions() {
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║         SSOT Sync from Confluence (Atlassian MCP)     ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.bold('Since you have Atlassian MCP already installed, use the AI agent\n'));
  console.log(chalk.bold('to sync SSOT standards from Confluence space "TSSOTAI".\n'));

  console.log(chalk.yellow('Prerequisites:\n'));
  console.log('  1. Atlassian MCP configured in VS Code');
  console.log('  2. Environment variables set:');
  console.log(chalk.gray('     • ATLASSIAN_API_TOKEN=your_api_token'));
  console.log(chalk.gray('     • ATLASSIAN_USER_EMAIL=your_email@company.com\n'));

  console.log(chalk.cyan('Get API token: ') + chalk.underline('https://id.atlassian.com/manage-profile/security/api-tokens\n'));

  console.log(chalk.bold('To sync SSOT standards:\n'));

  console.log(chalk.yellow('1. Open VS Code in this project'));
  console.log(chalk.yellow('2. Open Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)'));
  console.log(chalk.yellow('3. Ask the AI agent:\n'));

  console.log(chalk.cyan('   "Use Atlassian MCP to fetch the following pages from'));
  console.log(chalk.cyan('   Confluence space TSSOTAI and save them as markdown files'));
  console.log(chalk.cyan('   in /standards/contica-ssot/:'));
  console.log(chalk.cyan(''));
  console.log(chalk.cyan('   - Baseline Levels → baseline-levels.md'));
  console.log(chalk.cyan('   - Authentication Matrix → authentication-matrix.md'));
  console.log(chalk.cyan('   - Network Security → network-security.md'));
  console.log(chalk.cyan('   - Required Tiers → required-tiers.md'));
  console.log(chalk.cyan('   - Naming Convention → naming-convention.md'));
  console.log(chalk.cyan('   - Azure Policies → azure-policies.md'));
  console.log(chalk.cyan('   - Known Exceptions → known-exceptions.md'));
  console.log(chalk.cyan('   - Opportunity Categories → opportunity-categories.md"'));

  console.log(chalk.yellow('\n\n4. The agent will fetch and convert pages to markdown'));
  console.log(chalk.yellow('5. Verify files were updated in /standards/contica-ssot/\n'));

  console.log(chalk.gray('Note: Local SSOT files will be used as fallback if Confluence is unavailable.\n'));
}

async function showManualFetch() {
  console.log(chalk.bold('\n📖 Manual Fetch Instructions\n'));

  console.log('If you prefer to fetch standards manually:\n');

  console.log('1. Visit Confluence space TSSOTAI:');
  console.log(chalk.cyan('   https://contica.atlassian.net/wiki/spaces/TSSOTAI/overview\n'));

  console.log('2. For each SSOT page:');
  console.log('   • Open the page');
  console.log('   • Click ••• (More actions)');
  console.log('   • Export to Markdown');
  console.log('   • Save to /standards/contica-ssot/\n');

  console.log(chalk.yellow('Pages to export:\n'));
  SSOT_FILES.forEach(file => {
    const title = file.replace('.md', '').split('-').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    console.log(chalk.gray(`  • ${title} → ${file}`));
  });

  console.log('');
}

async function main() {
  const command = process.argv[2];

  try {
    if (command === 'check') {
      await checkSSOTFiles();
      return;
    }

    if (command === 'manual') {
      await showManualFetch();
      return;
    }

    // Default: show sync instructions
    const results = await checkSSOTFiles();
    await showSyncInstructions();

    if (results.missing.length > 0) {
      console.log(chalk.yellow('⚠️  Some SSOT files are missing. Sync from Confluence recommended.\n'));
    } else {
      console.log(chalk.green('✓ All SSOT files present locally.'));
      console.log(chalk.gray('  You can still sync to get the latest versions.\n'));
    }

    console.log(chalk.bold('Quick Commands:\n'));
    console.log(chalk.gray('  npm run sync-ssot       Show sync instructions (this)'));
    console.log(chalk.gray('  npm run sync-ssot check Check SSOT file status'));
    console.log(chalk.gray('  npm run sync-ssot manual Show manual fetch instructions\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

main();
