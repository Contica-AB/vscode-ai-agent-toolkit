#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import os from 'os';

const USER_MCP_CONFIG_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'mcp.json');
const USER_MCP_CONFIG_PATH_MAC = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'mcp.json');

const REQUIRED_MCPS = {
  'Azure MCP': {
    patterns: ['azure/azure-mcp', '@azure/mcp', 'azure-mcp'],
    description: 'Azure resource management',
    required: true
  },
  'Atlassian MCP': {
    patterns: ['atlassian/atlassian-mcp-server', 'atlassian-mcp', 'com.atlassian/atlassian-mcp-server'],
    description: 'Confluence SSOT standards access',
    required: true
  },
  'Microsoft Docs MCP': {
    patterns: ['microsoftdocs/mcp', 'microsoft-docs', 'ms-docs'],
    description: 'Microsoft best practices documentation',
    required: false
  },
  'Azure DevOps MCP': {
    patterns: ['microsoft/azure-devops-mcp', 'azure-devops-mcp', '@azure-devops/mcp'],
    description: 'Azure DevOps work items',
    required: false
  }
};

async function findMCPConfig() {
  // Try Windows path first
  try {
    await fs.access(USER_MCP_CONFIG_PATH);
    return USER_MCP_CONFIG_PATH;
  } catch (error) {
    // Try Mac path
    try {
      await fs.access(USER_MCP_CONFIG_PATH_MAC);
      return USER_MCP_CONFIG_PATH_MAC;
    } catch (error2) {
      return null;
    }
  }
}

async function checkMCPConfiguration() {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║           MCP Configuration Check                      ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝\n'));

  const spinner = ora('Looking for VS Code MCP configuration...').start();

  // Find MCP config file
  const configPath = await findMCPConfig();

  if (!configPath) {
    spinner.fail('MCP configuration not found');
    console.log(chalk.yellow('\n⚠️  Could not find VS Code MCP configuration.\n'));
    console.log('Expected location:');
    console.log(chalk.gray(`  Windows: ${USER_MCP_CONFIG_PATH}`));
    console.log(chalk.gray(`  Mac: ${USER_MCP_CONFIG_PATH_MAC}\n`));
    console.log(chalk.yellow('If you haven\'t set up MCP servers yet, install them in VS Code first.\n'));
    return false;
  }

  spinner.succeed(`Found MCP config: ${chalk.gray(configPath)}`);

  // Read and parse config
  const spinner2 = ora('Reading MCP configuration...').start();

  let mcpConfig;
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    mcpConfig = JSON.parse(configContent);
    spinner2.succeed('MCP configuration loaded');
  } catch (error) {
    spinner2.fail('Failed to read MCP configuration');
    console.error(chalk.red(`\nError: ${error.message}\n`));
    return false;
  }

  // Check for required MCPs
  console.log(chalk.bold('\n📋 Checking installed MCP servers:\n'));

  const results = {
    found: [],
    missing: [],
    optional: []
  };

  for (const [mcpName, config] of Object.entries(REQUIRED_MCPS)) {
    const installed = checkMCPInstalled(mcpConfig, config.patterns);

    if (installed) {
      results.found.push({ name: mcpName, server: installed, description: config.description });
      console.log(chalk.green(`  ✓ ${mcpName}`));
      console.log(chalk.gray(`    Server: ${installed}`));
      console.log(chalk.gray(`    ${config.description}\n`));
    } else {
      if (config.required) {
        results.missing.push({ name: mcpName, description: config.description });
        console.log(chalk.red(`  ✗ ${mcpName} (REQUIRED)`));
        console.log(chalk.gray(`    ${config.description}\n`));
      } else {
        results.optional.push({ name: mcpName, description: config.description });
        console.log(chalk.yellow(`  ⚠ ${mcpName} (optional)`));
        console.log(chalk.gray(`    ${config.description}\n`));
      }
    }
  }

  // Summary
  console.log(chalk.bold('Summary:\n'));
  console.log(chalk.green(`  ✓ ${results.found.length} MCP servers installed`));

  if (results.missing.length > 0) {
    console.log(chalk.red(`  ✗ ${results.missing.length} required MCP servers missing`));
  }

  if (results.optional.length > 0) {
    console.log(chalk.yellow(`  ⚠ ${results.optional.length} optional MCP servers not found`));
  }

  // Instructions for missing MCPs
  if (results.missing.length > 0) {
    console.log(chalk.bold.red('\n⚠️  Missing Required MCP Servers\n'));

    results.missing.forEach(mcp => {
      console.log(chalk.yellow(`  • ${mcp.name}`));
    });

    console.log(chalk.bold('\n📦 How to Install:\n'));
    console.log('1. Open VS Code');
    console.log('2. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)');
    console.log('3. Type: "MCP: Install Server"');
    console.log('4. Search for and install the missing servers\n');

    console.log(chalk.gray('Or install via VS Code Marketplace:\n'));
    console.log(chalk.cyan('  https://marketplace.visualstudio.com/search?term=mcp&target=VSCode\n'));

    return false;
  }

  // Success!
  console.log(chalk.green('\n✅ All required MCP servers are installed!\n'));

  console.log(chalk.bold('💡 How to Use in VS Code:\n'));
  console.log('Simply prompt the AI agent naturally:');
  console.log(chalk.cyan('  "Use Atlassian MCP to fetch SSOT standards from Confluence"'));
  console.log(chalk.cyan('  "Use Microsoft Docs MCP to find Azure Logic Apps best practices"'));
  console.log(chalk.cyan('  "Use Azure MCP to list all Logic Apps in the subscription"\n'));

  console.log(chalk.gray('The AI agent will automatically use the appropriate MCP server.\n'));

  return true;
}

function checkMCPInstalled(mcpConfig, patterns) {
  if (!mcpConfig.servers) {
    return null;
  }

  // Check each pattern against server names
  for (const [serverName, serverConfig] of Object.entries(mcpConfig.servers)) {
    const lowerServerName = serverName.toLowerCase();

    for (const pattern of patterns) {
      if (lowerServerName.includes(pattern.toLowerCase())) {
        return serverName;
      }
    }
  }

  return null;
}

async function showInstalledServers() {
  const configPath = await findMCPConfig();

  if (!configPath) {
    console.log(chalk.yellow('\nMCP configuration not found.\n'));
    return;
  }

  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    const mcpConfig = JSON.parse(configContent);

    console.log(chalk.bold('\n📋 All Installed MCP Servers:\n'));

    if (!mcpConfig.servers || Object.keys(mcpConfig.servers).length === 0) {
      console.log(chalk.yellow('  No MCP servers installed.\n'));
      return;
    }

    for (const [serverName, serverConfig] of Object.entries(mcpConfig.servers)) {
      console.log(chalk.cyan(`  • ${serverName}`));

      if (serverConfig.type) {
        console.log(chalk.gray(`    Type: ${serverConfig.type}`));
      }

      if (serverConfig.command) {
        console.log(chalk.gray(`    Command: ${serverConfig.command}`));
      }

      if (serverConfig.url) {
        console.log(chalk.gray(`    URL: ${serverConfig.url}`));
      }

      console.log('');
    }

  } catch (error) {
    console.error(chalk.red(`\nError reading configuration: ${error.message}\n`));
  }
}

// Main CLI
async function main() {
  const command = process.argv[2];

  try {
    if (command === 'list') {
      await showInstalledServers();
    } else {
      const success = await checkMCPConfiguration();
      process.exit(success ? 0 : 1);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

main();
