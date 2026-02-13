#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PROMPTS = {
  'Assessment Phases': {
    'Phase 0: Preflight Validation': 'Read /prompts/00-preflight.md and execute Phase 0: Preflight Validation for client "CLIENT_NAME"',
    'Phase 1: Resource Discovery': 'Read /prompts/01-inventory.md and execute Phase 1: Discovery for client "CLIENT_NAME"',
    'Phase 2: Logic Apps Deep Dive': 'Read /prompts/02-logic-apps-deep-dive.md and execute Phase 2 for client "CLIENT_NAME"',
    'Phase 3: Failure Analysis': 'Read /prompts/03-failure-analysis.md and execute Phase 3 for client "CLIENT_NAME"',
    'Phase 4: Security Audit': 'Read /prompts/04-security-audit.md and execute Phase 4 for client "CLIENT_NAME"',
    'Phase 5: Dead Flow Detection': 'Read /prompts/05-dead-flow-detection.md and execute Phase 5 for client "CLIENT_NAME"',
    'Phase 6: Monitoring Gaps': 'Read /prompts/06-monitoring-gaps.md and execute Phase 6 for client "CLIENT_NAME"',
    'Phase 7: Naming & Tagging': 'Read /prompts/07-naming-tagging-compliance.md and execute Phase 7 for client "CLIENT_NAME"',
    'Phase 8: Report Generation': 'Read /prompts/08-generate-report.md and execute Phase 8 for client "CLIENT_NAME"',
    'Run All Phases (2-8)': 'Execute Phases 2 through 8 for client "CLIENT_NAME" following the 10-phase methodology'
  },

  'Azure MCP': {
    'List All Logic Apps': 'Use Azure MCP to list all Logic Apps (both Consumption and Standard) across all subscriptions in my client configuration.',
    'List Service Bus Namespaces': 'Use Azure MCP to list all Service Bus namespaces with their queues, topics, and subscriptions.',
    'List Function Apps': 'Use Azure MCP to list all Function Apps with their runtime versions and hosting plans.',
    'List Key Vaults': 'Use Azure MCP to list all Key Vaults and check their network access configurations.',
    'Check RBAC Permissions': 'Use Azure MCP to list all role assignments for the current service principal across all subscriptions.',
    'List Storage Accounts': 'Use Azure MCP to list all Storage Accounts and check for public blob access settings.',
    'Check Diagnostic Settings': 'Use Azure MCP to check which resources have diagnostic settings enabled and which don\'t.',
    'List API Management': 'Use Azure MCP to list all API Management instances with their SKUs and public/private configuration.'
  },

  'Atlassian MCP (Confluence)': {
    'Sync All SSOT Standards': `Use Atlassian MCP to fetch the following pages from Confluence space "TSSOTAI" and save them as markdown files in /standards/contica-ssot/:

- Baseline Levels → baseline-levels.md
- Authentication Matrix → authentication-matrix.md
- Network Security → network-security.md
- Required Tiers → required-tiers.md
- Naming Convention → naming-convention.md
- Azure Policies → azure-policies.md
- Known Exceptions → known-exceptions.md
- Opportunity Categories → opportunity-categories.md

For each page:
1. Search for the page by exact title in space TSSOTAI
2. Get the page content in storage format
3. Convert to clean markdown
4. Save to the specified file path
5. Preserve formatting, tables, and code blocks`,
    'Fetch Baseline Levels': 'Use Atlassian MCP to fetch the "Baseline Levels" page from Confluence space "TSSOTAI" and save it to /standards/contica-ssot/baseline-levels.md',
    'Search SSOT for Topic': 'Use Atlassian MCP to search Confluence space "TSSOTAI" for pages containing "SEARCH_TERM" and return the top 5 results with summaries.'
  },

  'Microsoft Docs MCP': {
    'Logic Apps Best Practices': 'Use Microsoft Docs MCP to search for "Azure Logic Apps security best practices" and summarize the top 5 recommendations.',
    'Service Bus Production Guide': 'Use Microsoft Docs MCP to find production readiness recommendations for Azure Service Bus.',
    'Storage Security Baseline': 'Use Microsoft Docs MCP to fetch the Azure Security Baseline for Storage Accounts and list the critical security controls.',
    'API Management Throttling': 'Use Microsoft Docs MCP to find Azure API Management throttling limits and best practices.',
    'Key Vault Network Security': 'Use Microsoft Docs MCP to find Microsoft\'s recommendations for Azure Key Vault network security configuration.',
    'Function Apps Monitoring': 'Use Microsoft Docs MCP to search for Azure Functions monitoring and observability best practices.',
    'Managed Identity Setup': 'Use Microsoft Docs MCP to find step-by-step instructions for setting up Managed Identity for Logic Apps.'
  },

  'Complete Workflows': {
    'Full Assessment': `Execute the complete Azure Integration Services assessment for client "CLIENT_NAME":

Pre-Assessment:
1. Run MCP connectivity check
2. Use Atlassian MCP to sync latest SSOT standards from Confluence space "TSSOTAI"
3. Validate client configuration

Phases 0-8:
4. Execute Phase 0: Preflight Validation
5. Execute Phase 1: Resource Discovery using Azure MCP
6. Execute Phase 2: Logic Apps Deep Dive using Azure MCP and Azure CLI
7. Execute Phase 3: Failure Analysis
8. Execute Phase 4: Security Audit (use Microsoft Docs MCP for best practices references)
9. Execute Phase 5: Dead Flow Detection
10. Execute Phase 6: Monitoring Gaps
11. Execute Phase 7: Naming & Tagging Compliance
12. Execute Phase 8: Generate Final Report

Post-Assessment:
13. Validate all output files were created
14. Generate summary of findings
15. Create list of HIGH priority items for immediate action`,

    'Security Audit with Best Practices': `For client "CLIENT_NAME":

1. Use Azure MCP to list all Logic Apps, Storage Accounts, and Key Vaults

2. For each resource type, use Microsoft Docs MCP to fetch the latest security best practices

3. Compare actual configuration against Microsoft recommendations

4. Use Atlassian MCP to fetch Contica SSOT security standards

5. Generate a security findings report with:
   - Resource name
   - Issue found
   - Microsoft best practice reference
   - SSOT compliance status
   - Severity (HIGH/MEDIUM/LOW)
   - Remediation steps`,

    'SSOT Sync + Validation': `1. Use Atlassian MCP to fetch all SSOT standards from Confluence space "TSSOTAI" and save to /standards/contica-ssot/

2. After sync completes, validate that all 8 standard files exist and are not empty:
   - baseline-levels.md
   - authentication-matrix.md
   - network-security.md
   - required-tiers.md
   - naming-convention.md
   - azure-policies.md
   - known-exceptions.md
   - opportunity-categories.md

3. Compare file sizes with previous versions to detect significant changes

4. Report any missing or failed syncs`
  }
};

async function copyToClipboard(text) {
  try {
    // Try Windows
    if (process.platform === 'win32') {
      await execAsync(`echo ${text.replace(/"/g, '""')} | clip`);
      return true;
    }
    // Try macOS
    if (process.platform === 'darwin') {
      await execAsync(`echo "${text}" | pbcopy`);
      return true;
    }
    // Try Linux
    if (process.platform === 'linux') {
      await execAsync(`echo "${text}" | xclip -selection clipboard`);
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function showPromptLibrary() {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║        MCP Prompt Library - Interactive Browser        ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝\n'));

  let clientName = null;

  while (true) {
    // Select category
    const { category } = await inquirer.prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Select a category:',
        choices: [
          ...Object.keys(PROMPTS),
          new inquirer.Separator(),
          'Exit'
        ]
      }
    ]);

    if (category === 'Exit') {
      console.log(chalk.green('\nGoodbye! 👋\n'));
      break;
    }

    // Show prompts in category
    const { promptName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'promptName',
        message: `${category} - Select a prompt:`,
        choices: [
          ...Object.keys(PROMPTS[category]),
          new inquirer.Separator(),
          '← Back to categories'
        ]
      }
    ]);

    if (promptName === '← Back to categories') {
      continue;
    }

    let prompt = PROMPTS[category][promptName];

    // Ask for client name if needed
    if (prompt.includes('CLIENT_NAME')) {
      if (!clientName) {
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter your client name:',
            validate: (input) => input.length > 0 || 'Client name is required'
          }
        ]);
        clientName = name;
      }

      prompt = prompt.replace(/CLIENT_NAME/g, clientName);
    }

    // Ask for search term if needed
    if (prompt.includes('SEARCH_TERM')) {
      const { searchTerm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'searchTerm',
          message: 'Enter search term:',
          default: 'Logic Apps'
        }
      ]);
      prompt = prompt.replace(/SEARCH_TERM/g, searchTerm);
    }

    // Display prompt
    console.log(chalk.bold('\n📋 Prompt:\n'));
    console.log(chalk.cyan(prompt));
    console.log('');

    // Action menu
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Copy to clipboard',
          'Show instructions',
          'Change client name',
          '← Back to prompts',
          'Exit'
        ]
      }
    ]);

    if (action === 'Copy to clipboard') {
      const copied = await copyToClipboard(prompt);
      if (copied) {
        console.log(chalk.green('\n✅ Prompt copied to clipboard!'));
        console.log(chalk.yellow('\nNext steps:'));
        console.log('  1. Open VS Code in this project');
        console.log('  2. Open Copilot Chat (Ctrl+Shift+I or Cmd+Shift+I)');
        console.log('  3. Make sure @workspace is enabled');
        console.log('  4. Paste the prompt (Ctrl+V or Cmd+V)');
        console.log('  5. Press Enter\n');
      } else {
        console.log(chalk.yellow('\n⚠️  Could not auto-copy to clipboard.'));
        console.log(chalk.gray('Please manually copy the prompt shown above.\n'));
      }
    } else if (action === 'Show instructions') {
      console.log(chalk.bold('\n📖 How to Use This Prompt:\n'));
      console.log('1. Copy the prompt (shown above)');
      console.log('2. Open VS Code in this project:');
      console.log(chalk.gray('   cd /path/to/azure-environment-analysis'));
      console.log(chalk.gray('   code .'));
      console.log('3. Open Copilot Chat:');
      console.log(chalk.gray('   Press Ctrl+Shift+I (Windows/Linux) or Cmd+Shift+I (Mac)'));
      console.log('4. Enable @workspace mode:');
      console.log(chalk.gray('   Click @workspace at the bottom of the chat input'));
      console.log('5. Paste the prompt and press Enter');
      console.log('6. Wait for the AI agent to complete the task');
      console.log('7. Review the results in chat or output files\n');
    } else if (action === 'Change client name') {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter new client name:',
          default: clientName,
          validate: (input) => input.length > 0 || 'Client name is required'
        }
      ]);
      clientName = name;
      console.log(chalk.green(`\n✓ Client name updated to: ${clientName}\n`));
    } else if (action === 'Exit') {
      console.log(chalk.green('\nGoodbye! 👋\n'));
      break;
    }
  }
}

async function listAllPrompts() {
  console.log(chalk.bold.cyan('\n📋 All Available MCP Prompts\n'));

  for (const [category, prompts] of Object.entries(PROMPTS)) {
    console.log(chalk.bold.yellow(`\n${category}:`));
    console.log(chalk.gray('─'.repeat(60)));

    for (const promptName of Object.keys(prompts)) {
      console.log(chalk.cyan(`  • ${promptName}`));
    }
  }

  console.log(chalk.gray('\n\nRun "npm run prompts" to browse and copy these prompts interactively.\n'));
}

// Main CLI
async function main() {
  const command = process.argv[2];

  try {
    if (command === 'list') {
      await listAllPrompts();
    } else {
      await showPromptLibrary();
    }
  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('\n❌ Interactive mode not supported in this terminal\n'));
      console.log('Run with "list" argument to see all prompts:');
      console.log(chalk.gray('  npm run prompts list\n'));
    } else {
      console.error(chalk.red('\n❌ Error:'), error.message);
    }
    process.exit(1);
  }
}

main();
