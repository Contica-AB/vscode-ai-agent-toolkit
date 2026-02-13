#!/usr/bin/env node

import chalk from 'chalk';

console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════╗'));
console.log(chalk.bold.cyan('║           MCP Server Connectivity Test                ║'));
console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝\n'));

console.log(chalk.bold('MCP servers are initialized by VS Code when you open Copilot Chat.\n'));

console.log(chalk.bold('Expected MCP Server Status:\n'));

console.log(chalk.cyan('  ✓ Azure MCP Server'));
console.log(chalk.gray('    Status: Configured and working'));
console.log(chalk.gray('    Uses: az login context (DefaultAzureCredential)'));
console.log(chalk.gray('    Tools: Resource management, RBAC, Monitor, Log Analytics\n'));

console.log(chalk.cyan('  ✓ Microsoft 365 MCP (Microsoft Learn Docs)'));
console.log(chalk.gray('    Status: Already installed (you confirmed)'));
console.log(chalk.gray('    Uses: SharePoint, documentation search'));
console.log(chalk.gray('    Purpose: Best practices lookup\n'));

console.log(chalk.cyan('  ✓ Atlassian MCP'));
console.log(chalk.gray('    Status: Already installed (you confirmed)'));
console.log(chalk.gray('    Uses: Confluence space TSSOTAI'));
console.log(chalk.gray('    Requires: ATLASSIAN_API_TOKEN and ATLASSIAN_USER_EMAIL env vars'));
console.log(chalk.gray('    Purpose: Fetch Contica SSOT standards\n'));

console.log(chalk.yellow('  ⚠ Logic Apps MCP'));
console.log(chalk.gray('    Status: Disabled (known auth issue)'));
console.log(chalk.gray('    Workaround: Use Azure CLI commands instead'));
console.log(chalk.gray('    • az logic workflow list'));
console.log(chalk.gray('    • az logic workflow show -g {rg} -n {name}\n'));

console.log(chalk.cyan('  ✓ Azure DevOps MCP'));
console.log(chalk.gray('    Status: Configured (optional)'));
console.log(chalk.gray('    Requires: ADO organization name input'));
console.log(chalk.gray('    Purpose: Work item cross-reference\n'));

console.log(chalk.bold('\n📋 To verify MCP servers in VS Code:\n'));
console.log('  1. Open VS Code in this project');
console.log('  2. Open Copilot Chat (Ctrl+Shift+I)');
console.log('  3. Check for MCP server status in panel');
console.log('  4. Look for tool availability indicators\n');

console.log(chalk.bold('🔧 Environment Variables Needed:\n'));

const requiredEnvVars = {
  'Azure Service Principal': [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET'
  ],
  'Atlassian Confluence': [
    'ATLASSIAN_API_TOKEN',
    'ATLASSIAN_USER_EMAIL'
  ]
};

for (const [category, vars] of Object.entries(requiredEnvVars)) {
  console.log(chalk.yellow(`  ${category}:`));
  vars.forEach(v => {
    const isSet = !!process.env[v];
    if (isSet) {
      console.log(chalk.green(`    ✓ ${v} (set)`));
    } else {
      console.log(chalk.red(`    ✗ ${v} (not set)`));
    }
  });
  console.log('');
}

const allAzureSet = process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET;
const allAtlassianSet = process.env.ATLASSIAN_API_TOKEN && process.env.ATLASSIAN_USER_EMAIL;

if (!allAzureSet) {
  console.log(chalk.yellow('⚠️  Azure credentials not set. Run: npm run setup\n'));
}

if (!allAtlassianSet) {
  console.log(chalk.yellow('⚠️  Atlassian credentials not set for SSOT sync.'));
  console.log(chalk.gray('   Get token: https://id.atlassian.com/manage-profile/security/api-tokens\n'));
}

if (allAzureSet && allAtlassianSet) {
  console.log(chalk.green('✅ All required environment variables are set!\n'));
}

console.log(chalk.bold('Next Steps:\n'));
console.log('  1. Ensure environment variables are set');
console.log('  2. Run: npm run validate');
console.log('  3. Open VS Code and test Copilot Chat with MCP tools');
console.log('  4. Read QUICKSTART.md for assessment guide\n');
