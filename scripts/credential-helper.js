#!/usr/bin/env node

import { ClientSecretCredential } from '@azure/identity';
import { SubscriptionClient } from '@azure/arm-subscriptions';
import { ResourceManagementClient } from '@azure/arm-resources';
import chalk from 'chalk';
import ora from 'ora';

function getCredentialFromEnv() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.error(chalk.red('\n❌ Missing environment variables\n'));
    console.log('Required environment variables:');
    console.log('  • AZURE_TENANT_ID');
    console.log('  • AZURE_CLIENT_ID');
    console.log('  • AZURE_CLIENT_SECRET\n');
    console.log(chalk.yellow('Set these variables before running validation:\n'));

    console.log(chalk.cyan('# Windows (PowerShell)'));
    console.log(chalk.gray('$env:AZURE_TENANT_ID = "your-tenant-id"'));
    console.log(chalk.gray('$env:AZURE_CLIENT_ID = "your-client-id"'));
    console.log(chalk.gray('$env:AZURE_CLIENT_SECRET = "your-client-secret"'));

    console.log(chalk.cyan('\n# Linux/macOS (bash/zsh)'));
    console.log(chalk.gray('export AZURE_TENANT_ID="your-tenant-id"'));
    console.log(chalk.gray('export AZURE_CLIENT_ID="your-client-id"'));
    console.log(chalk.gray('export AZURE_CLIENT_SECRET="your-client-secret"\n'));

    process.exit(1);
  }

  return new ClientSecretCredential(tenantId, clientId, clientSecret);
}

async function validateCredentials() {
  console.log(chalk.bold('\n🔐 Validating Azure Service Principal Credentials\n'));

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    getCredentialFromEnv(); // This will exit with instructions
    return;
  }

  const spinner = ora('Testing authentication...').start();

  try {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const client = new SubscriptionClient(credential);

    // Test authentication by listing subscriptions
    const subscriptions = [];
    for await (const sub of client.subscriptions.list()) {
      subscriptions.push(sub);
    }

    spinner.succeed(chalk.green('Credentials valid'));

    console.log(chalk.cyan(`  Tenant: ${tenantId}`));
    console.log(chalk.cyan(`  Client ID: ${clientId}`));
    console.log(chalk.cyan(`  Access to ${subscriptions.length} subscription(s)\n`));

    if (subscriptions.length === 0) {
      console.log(chalk.yellow('⚠️  No subscriptions found. Service principal may lack access.'));
      console.log(chalk.yellow('   Grant Reader role: az role assignment create --assignee {client-id} --role Reader --scope /subscriptions/{subscription-id}\n'));
      process.exit(1);
    }

    // List subscriptions briefly
    console.log(chalk.bold('Accessible subscriptions:\n'));
    subscriptions.forEach((sub) => {
      console.log(chalk.cyan(`  • ${sub.displayName}`));
      console.log(chalk.gray(`    ${sub.subscriptionId}`));
    });

    console.log(chalk.green('\n✅ Validation successful!\n'));

  } catch (error) {
    spinner.fail(chalk.red('Authentication failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));

    console.log(chalk.yellow('Common issues:'));
    console.log('  • Incorrect Tenant ID, Client ID, or Client Secret');
    console.log('  • Service principal expired or disabled');
    console.log('  • Service principal not granted access to any subscriptions');
    console.log('  • Network connectivity issues\n');

    console.log(chalk.yellow('To verify service principal:'));
    console.log(chalk.gray('  az ad sp show --id {client-id}'));
    console.log(chalk.yellow('\nTo grant access:'));
    console.log(chalk.gray('  az role assignment create --assignee {client-id} --role Reader --scope /subscriptions/{subscription-id}\n'));

    process.exit(1);
  }
}

async function listSubscriptions() {
  console.log(chalk.bold('\n📋 Accessible Azure Subscriptions\n'));

  const credential = getCredentialFromEnv();
  const client = new SubscriptionClient(credential);

  const spinner = ora('Fetching subscriptions...').start();

  try {
    const subscriptions = [];
    for await (const sub of client.subscriptions.list()) {
      subscriptions.push(sub);
    }

    spinner.succeed(`Found ${subscriptions.length} subscription(s)`);

    if (subscriptions.length === 0) {
      console.log(chalk.yellow('\n⚠️  No subscriptions found.\n'));
      return;
    }

    console.log('');
    for (const sub of subscriptions) {
      console.log(chalk.bold.cyan(`┌─ ${sub.displayName}`));
      console.log(chalk.gray(`│  ID: ${sub.subscriptionId}`));
      console.log(chalk.gray(`│  State: ${sub.state}`));
      console.log(chalk.gray(`│  Tenant: ${sub.tenantId}`));
      console.log(chalk.gray(`└─\n`));
    }

  } catch (error) {
    spinner.fail('Failed to list subscriptions');
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

async function testSubscriptionAccess(subscriptionId) {
  if (!subscriptionId) {
    console.error(chalk.red('\n❌ Subscription ID required\n'));
    console.log('Usage: npm run validate test-access <subscription-id>\n');
    process.exit(1);
  }

  console.log(chalk.bold(`\n🔍 Testing Access to Subscription\n`));
  console.log(chalk.gray(`Subscription ID: ${subscriptionId}\n`));

  const credential = getCredentialFromEnv();

  const spinner1 = ora('Verifying subscription access...').start();

  try {
    // Try to get subscription details
    const subscriptionClient = new SubscriptionClient(credential);
    const sub = await subscriptionClient.subscriptions.get(subscriptionId);

    spinner1.succeed(`Subscription found: ${sub.displayName}`);

    // Try to list resource groups
    const spinner2 = ora('Testing read permissions...').start();
    const resourceClient = new ResourceManagementClient(credential, subscriptionId);

    const resourceGroups = [];
    for await (const rg of resourceClient.resourceGroups.list()) {
      resourceGroups.push(rg);
    }

    spinner2.succeed(chalk.green('Reader access confirmed'));

    console.log(chalk.cyan(`\n  Subscription: ${sub.displayName}`));
    console.log(chalk.cyan(`  State: ${sub.state}`));
    console.log(chalk.cyan(`  Resource Groups: ${resourceGroups.length}`));

    if (resourceGroups.length > 0) {
      console.log(chalk.gray('\n  Sample resource groups:'));
      resourceGroups.slice(0, 5).forEach(rg => {
        console.log(chalk.gray(`    • ${rg.name} (${rg.location})`));
      });
      if (resourceGroups.length > 5) {
        console.log(chalk.gray(`    ... and ${resourceGroups.length - 5} more`));
      }
    }

    console.log(chalk.green('\n✅ Access test successful!\n'));

  } catch (error) {
    spinner1.fail('Access test failed');
    console.error(chalk.red(`\nError: ${error.message}\n`));

    if (error.message.includes('not found')) {
      console.log(chalk.yellow('The subscription may not exist or service principal lacks access.'));
    } else if (error.message.includes('Authorization')) {
      console.log(chalk.yellow('The service principal may lack Reader role on this subscription.'));
    }

    console.log(chalk.yellow('\nTo grant Reader access:'));
    console.log(chalk.gray(`  az role assignment create --assignee $AZURE_CLIENT_ID --role Reader --scope /subscriptions/${subscriptionId}\n`));

    process.exit(1);
  }
}

async function checkAzureCLI() {
  console.log(chalk.bold('\n🔧 Checking Azure CLI Status\n'));

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Check if az CLI is installed
    const spinner1 = ora('Checking Azure CLI installation...').start();
    try {
      const { stdout } = await execAsync('az version');
      const version = JSON.parse(stdout);
      spinner1.succeed(`Azure CLI v${version['azure-cli']} installed`);
    } catch (error) {
      spinner1.fail('Azure CLI not found');
      console.log(chalk.yellow('\nInstall Azure CLI:'));
      console.log(chalk.gray('  Windows: winget install Microsoft.AzureCLI'));
      console.log(chalk.gray('  macOS: brew install azure-cli'));
      console.log(chalk.gray('  Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash\n'));
      return;
    }

    // Check if logged in
    const spinner2 = ora('Checking Azure CLI login status...').start();
    try {
      const { stdout } = await execAsync('az account show');
      const account = JSON.parse(stdout);
      spinner2.succeed('Logged in to Azure CLI');

      console.log(chalk.cyan(`\n  Account: ${account.user.name}`));
      console.log(chalk.cyan(`  Subscription: ${account.name}`));
      console.log(chalk.cyan(`  Tenant: ${account.tenantId}\n`));
    } catch (error) {
      spinner2.warn('Not logged in to Azure CLI');
      console.log(chalk.yellow('\nTo login:'));
      console.log(chalk.gray('  az login\n'));
    }

  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

// Main CLI router
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'validate':
        await validateCredentials();
        break;

      case 'subscriptions':
      case 'subs':
        await listSubscriptions();
        break;

      case 'test-access':
        await testSubscriptionAccess(arg);
        break;

      case 'check-cli':
        await checkAzureCLI();
        break;

      default:
        console.log(chalk.bold('\n🔐 Azure Credential Helper\n'));
        console.log('Usage:');
        console.log(chalk.cyan('  node scripts/credential-helper.js <command> [args]'));
        console.log('');
        console.log('Commands:');
        console.log(chalk.yellow('  validate') + '              Validate service principal credentials');
        console.log(chalk.yellow('  subscriptions') + '         List accessible subscriptions');
        console.log(chalk.yellow('  test-access <sub-id>') + '  Test access to specific subscription');
        console.log(chalk.yellow('  check-cli') + '             Check Azure CLI status');
        console.log('');
        console.log('npm shortcuts:');
        console.log(chalk.gray('  npm run validate            (alias for validate command)'));
        console.log('');
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Command failed:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Run
main();
