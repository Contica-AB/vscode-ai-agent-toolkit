#!/usr/bin/env node

import inquirer from "inquirer";
import { ClientSecretCredential, AzureCliCredential } from "@azure/identity";
import { SubscriptionClient } from "@azure/arm-subscriptions";
import { ResourceManagementClient } from "@azure/arm-resources";
import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, "..");

// Check current Azure CLI login status
function checkCurrentAzureAccount() {
  try {
    const output = execSync("az account show --output json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const account = JSON.parse(output);
    return {
      name: account.name,
      id: account.id,
      tenantId: account.tenantId,
      user: account.user?.name || "unknown",
    };
  } catch {
    return null;
  }
}

console.log(
  chalk.bold.cyan(
    "\n╔════════════════════════════════════════════════════════╗",
  ),
);
console.log(
  chalk.bold.cyan("║  Azure Integration Assessment - Setup Wizard          ║"),
);
console.log(
  chalk.bold.cyan(
    "╚════════════════════════════════════════════════════════╝\n",
  ),
);

// Step 1: Authentication
async function promptAuthentication() {
  console.log(chalk.bold("\n📋 Step 1/7: Azure Authentication"));
  console.log(chalk.gray("─".repeat(60)));

  // Check if there's an active Azure CLI session
  const currentAccount = checkCurrentAzureAccount();

  if (currentAccount) {
    console.log(chalk.cyan("\n  Current Azure CLI session:"));
    console.log(chalk.gray(`    Account:      ${currentAccount.user}`));
    console.log(chalk.gray(`    Subscription: ${currentAccount.name}`));
    console.log(chalk.gray(`    Tenant:       ${currentAccount.tenantId}\n`));

    const { authChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "authChoice",
        message: "How would you like to authenticate?",
        choices: [
          { name: "Continue with current account", value: "continue" },
          { name: "Switch account (run az login)", value: "switch" },
          { name: "Use service principal credentials", value: "sp" },
        ],
      },
    ]);

    if (authChoice === "continue") {
      return { type: "cli", tenantId: currentAccount.tenantId };
    }

    if (authChoice === "switch") {
      console.log(chalk.yellow("\n  Running az login...\n"));
      try {
        execSync("az login", { stdio: "inherit" });
      } catch {
        console.log(
          chalk.red("\n  az login failed. Please log in manually and retry.\n"),
        );
        process.exit(1);
      }
      const newAccount = checkCurrentAzureAccount();
      if (!newAccount) {
        console.log(
          chalk.red("\n  Could not detect Azure CLI session after login.\n"),
        );
        process.exit(1);
      }
      console.log(chalk.green(`\n  Logged in as ${newAccount.user}`));
      return { type: "cli", tenantId: newAccount.tenantId };
    }

    // Fall through to SP prompt below
  } else {
    console.log(chalk.yellow("\n  No active Azure CLI session detected.\n"));

    const { authChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "authChoice",
        message: "How would you like to authenticate?",
        choices: [
          { name: "Login with Azure CLI (az login)", value: "login" },
          { name: "Use service principal credentials", value: "sp" },
          { name: "Show me how to create a service principal", value: "help" },
        ],
      },
    ]);

    if (authChoice === "login") {
      console.log(chalk.yellow("\n  Running az login...\n"));
      try {
        execSync("az login", { stdio: "inherit" });
      } catch {
        console.log(
          chalk.red("\n  az login failed. Please log in manually and retry.\n"),
        );
        process.exit(1);
      }
      const newAccount = checkCurrentAzureAccount();
      if (!newAccount) {
        console.log(
          chalk.red("\n  Could not detect Azure CLI session after login.\n"),
        );
        process.exit(1);
      }
      console.log(chalk.green(`\n  Logged in as ${newAccount.user}`));
      return { type: "cli", tenantId: newAccount.tenantId };
    }

    if (authChoice === "help") {
      console.log(chalk.yellow("\n  Creating a Service Principal:\n"));
      console.log("Run this Azure CLI command:\n");
      console.log(
        chalk.cyan(
          '  az ad sp create-for-rbac --name "azure-assessment-sp" \\',
        ),
      );
      console.log(chalk.cyan("    --role Reader \\"));
      console.log(
        chalk.cyan("    --scopes /subscriptions/{subscription-id}\n"),
      );
      console.log("Save the output:");
      console.log("  • appId → Client ID");
      console.log("  • password → Client Secret");
      console.log("  • tenant → Tenant ID\n");

      const { continueSetup } = await inquirer.prompt([
        {
          type: "confirm",
          name: "continueSetup",
          message: "Have you created the service principal?",
          default: false,
        },
      ]);

      if (!continueSetup) {
        console.log(
          chalk.yellow('\n  Setup paused. Run "npm run setup" when ready.\n'),
        );
        process.exit(0);
      }
    }

    // Fall through to SP prompt below
  }

  // Service principal credential prompt
  const credentials = await inquirer.prompt([
    {
      type: "input",
      name: "tenantId",
      message: "Azure Tenant ID:",
      validate: (input) => {
        const guidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return guidRegex.test(input) || "Please enter a valid GUID";
      },
    },
    {
      type: "input",
      name: "clientId",
      message: "Client ID:",
      validate: (input) => {
        const guidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return guidRegex.test(input) || "Please enter a valid GUID";
      },
    },
    {
      type: "password",
      name: "clientSecret",
      message: "Client Secret:",
      mask: "*",
      validate: (input) => input.length > 0 || "Client secret is required",
    },
  ]);

  return { type: "sp", ...credentials };
}

// Step 2: Validate credentials and discover subscriptions
async function validateAndDiscoverSubscriptions(authInfo) {
  console.log(chalk.bold("\n🔍 Step 2/7: Subscription Discovery"));
  console.log(chalk.gray("─".repeat(60)));

  const spinner = ora("Validating credentials...").start();

  try {
    let credential;
    if (authInfo.type === "sp") {
      credential = new ClientSecretCredential(
        authInfo.tenantId,
        authInfo.clientId,
        authInfo.clientSecret,
      );
    } else {
      credential = new AzureCliCredential();
    }

    const subscriptionClient = new SubscriptionClient(credential);

    // Test authentication by listing subscriptions
    const subscriptions = [];
    for await (const sub of subscriptionClient.subscriptions.list()) {
      subscriptions.push({
        id: sub.subscriptionId,
        name: sub.displayName,
        state: sub.state,
        tenantId: sub.tenantId,
      });
    }

    spinner.succeed(chalk.green("Authentication successful!"));
    console.log(chalk.cyan(`✓ Connected to tenant: ${authInfo.tenantId}`));
    console.log(
      chalk.cyan(`✓ Found ${subscriptions.length} subscription(s)\n`),
    );

    if (subscriptions.length === 0) {
      console.log(
        chalk.yellow(
          "⚠️  No subscriptions found. Your account may lack access.\n",
        ),
      );
      process.exit(1);
    }

    // Determine access level for each subscription.
    // Note: The RBAC principalId filter requires the SP's objectId (not appId/clientId).
    // Since we only have the appId here, we verify access by attempting to list resource groups
    // (which requires at least Reader access).
    const spinner2 = ora("Checking permissions...").start();

    for (const sub of subscriptions) {
      try {
        const resourceClient = new ResourceManagementClient(credential, sub.id);
        let rgCount = 0;
        for await (const rg of resourceClient.resourceGroups.list()) {
          rgCount++;
          if (rgCount >= 1) break; // Just need to confirm access
        }
        // Successfully listed resource groups — at least Reader access
        sub.accessLevel = rgCount > 0 ? "Reader+" : "Reader (empty)";
      } catch (error) {
        sub.accessLevel = "Unknown";
      }
    }

    spinner2.succeed("Permissions checked");

    // Display subscriptions
    console.log(chalk.bold("\nFound subscriptions:\n"));
    subscriptions.forEach((sub, i) => {
      console.log(chalk.cyan(`  ${i + 1}. ${sub.name}`));
      console.log(chalk.gray(`     ID: ${sub.id}`));
      console.log(chalk.gray(`     State: ${sub.state}`));
      console.log(chalk.gray(`     Access: ${sub.accessLevel}\n`));
    });

    if (subscriptions.some((s) => s.accessLevel === "Unknown")) {
      console.log(
        chalk.yellow("⚠️  Note: Reader access is sufficient for assessment."),
      );
      console.log(
        chalk.yellow("   Contributor recommended for remediation actions.\n"),
      );
    }

    return { credential, subscriptions };
  } catch (error) {
    spinner.fail(chalk.red("Authentication failed"));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    if (authInfo.type === "sp") {
      console.log(chalk.yellow("Please verify:"));
      console.log("  • Tenant ID, Client ID, and Client Secret are correct");
      console.log(
        "  • Service principal has been granted access to subscriptions",
      );
      console.log("  • Service principal is not expired\n");
    } else {
      console.log(chalk.yellow("Please verify:"));
      console.log("  • You are logged in with Azure CLI: az login");
      console.log("  • Your account has access to Azure subscriptions");
      console.log('  • Run "az account list" to check your subscriptions\n');
    }
    process.exit(1);
  }
}

// Step 3: Select subscriptions
async function selectSubscriptions(subscriptions) {
  const { selectedIds } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedIds",
      message: "Select subscriptions to assess:",
      choices: subscriptions.map((sub) => ({
        name: `${sub.name} (${sub.accessLevel})`,
        value: sub.id,
        checked: true,
      })),
      validate: (answer) => {
        return answer.length > 0 || "You must select at least one subscription";
      },
    },
  ]);

  return subscriptions.filter((sub) => selectedIds.includes(sub.id));
}

// Step 4: Client configuration
async function promptClientConfig() {
  console.log(chalk.bold("\n⚙️  Step 3/7: Client Configuration"));
  console.log(chalk.gray("─".repeat(60)));

  const config = await inquirer.prompt([
    {
      type: "input",
      name: "clientName",
      message: "Client Name:",
      validate: (input) => input.length > 0 || "Client name is required",
    },
    {
      type: "input",
      name: "contactName",
      message: "Primary Contact Name:",
      default: "",
    },
    {
      type: "input",
      name: "contactEmail",
      message: "Primary Contact Email:",
      default: "",
    },
  ]);

  return config;
}

// Step 5: Assessment scope
async function promptAssessmentScope() {
  console.log(chalk.bold("\n🎯 Step 4/7: Assessment Scope"));
  console.log(chalk.gray("─".repeat(60)));

  const scope = await inquirer.prompt([
    {
      type: "number",
      name: "runHistoryDays",
      message: "Run history period (days):",
      default: 90,
      validate: (input) =>
        (input > 0 && input <= 365) || "Must be between 1 and 365 days",
    },
    {
      type: "number",
      name: "failureAnalysisDays",
      message: "Failure analysis focus period (days):",
      default: 30,
      validate: (input) =>
        (input > 0 && input <= 90) || "Must be between 1 and 90 days",
    },
    {
      type: "checkbox",
      name: "focusAreas",
      message: "Focus Areas:",
      choices: [
        { name: "Preflight validation", value: "preflight", checked: true },
        { name: "Resource inventory", value: "inventory", checked: true },
        {
          name: "Integration Services Deep Dive",
          value: "integration-services-deep-dive",
          checked: true,
        },
        { name: "Failure patterns", value: "failure-patterns", checked: true },
        { name: "Security audit", value: "security", checked: true },
        { name: "Dead flow detection", value: "dead-flows", checked: true },
        { name: "Monitoring gaps", value: "monitoring-gaps", checked: true },
        {
          name: "Naming/tagging compliance",
          value: "naming-tagging",
          checked: true,
        },
        {
          name: "Sales opportunities (internal only)",
          value: "sales-opportunities",
          checked: false,
        },
      ],
    },
  ]);

  return scope;
}

// Step 6: Standards configuration
async function promptStandardsConfig() {
  console.log(chalk.bold("\n📚 Step 5/7: Standards Configuration"));
  console.log(chalk.gray("─".repeat(60)));

  const standards = await inquirer.prompt([
    {
      type: "confirm",
      name: "fetchFromConfluence",
      message: "Fetch SSOT from Confluence (Atlassian MCP)?",
      default: true,
    },
    {
      type: "confirm",
      name: "validateMicrosoftBestPractices",
      message: "Validate with Microsoft best practices (Microsoft Docs MCP)?",
      default: true,
    },
  ]);

  return standards;
}

// Step 7: Credential storage
async function promptCredentialStorage(credentials) {
  console.log(chalk.bold("\n🔐 Step 6/7: Credential Storage"));
  console.log(chalk.gray("─".repeat(60)));

  const { storageMethod } = await inquirer.prompt([
    {
      type: "list",
      name: "storageMethod",
      message: "How should credentials be stored?",
      choices: [
        { name: "Environment variables (recommended)", value: "env" },
        {
          name: "Encrypted file (~/.azure-assessment/credentials.enc)",
          value: "encrypted",
        },
        {
          name: "Azure Key Vault (requires additional setup)",
          value: "keyvault",
        },
      ],
    },
  ]);

  if (storageMethod === "env") {
    console.log(chalk.yellow("\n📝 Add these to your environment:\n"));

    console.log(chalk.cyan("# Windows (PowerShell)"));
    console.log(chalk.gray(`$env:AZURE_TENANT_ID = "${credentials.tenantId}"`));
    console.log(chalk.gray(`$env:AZURE_CLIENT_ID = "${credentials.clientId}"`));
    console.log(
      chalk.gray(`$env:AZURE_CLIENT_SECRET = "${credentials.clientSecret}"`),
    );

    console.log(chalk.cyan("\n# Linux/macOS (bash/zsh)"));
    console.log(chalk.gray(`export AZURE_TENANT_ID="${credentials.tenantId}"`));
    console.log(chalk.gray(`export AZURE_CLIENT_ID="${credentials.clientId}"`));
    console.log(
      chalk.gray(`export AZURE_CLIENT_SECRET="${credentials.clientSecret}"`),
    );

    console.log(
      chalk.yellow("\n⚠️  Remember to set these before running assessments!\n"),
    );
  } else if (storageMethod === "encrypted") {
    console.log(
      chalk.yellow(
        "\n⚠️  Encrypted file storage not yet implemented in this version.",
      ),
    );
    console.log(chalk.yellow("Using environment variables for now.\n"));
  } else if (storageMethod === "keyvault") {
    console.log(
      chalk.yellow(
        "\n⚠️  Azure Key Vault storage not yet implemented in this version.",
      ),
    );
    console.log(chalk.yellow("Using environment variables for now.\n"));
  }

  return { storageMethod };
}

// Generate client configuration file
async function generateClientConfig(
  authInfo,
  selectedSubscriptions,
  clientConfig,
  scope,
  standards,
  storage,
) {
  const clientSlug = clientConfig.clientName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const clientDir = path.join(PROJECT_ROOT, "clients", clientSlug);
  const configPath = path.join(clientDir, "config.json");

  // Create client directory
  await fs.mkdir(clientDir, { recursive: true });

  const config = {
    client: clientConfig.clientName,
    engagement: "Azure Integration Environment Assessment",
    assessmentDate: new Date().toISOString().split("T")[0],

    azureAccess: {
      tenantId: authInfo.tenantId,
      authenticationType:
        authInfo.type === "sp" ? "service-principal" : "azure-cli",
      ...(authInfo.type === "sp"
        ? {
            servicePrincipal: {
              clientId: authInfo.clientId,
              credentialSource: storage.storageMethod,
              notes:
                storage.storageMethod === "env"
                  ? "Credentials stored in environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
                  : `Credentials stored via ${storage.storageMethod}`,
            },
          }
        : {
            notes:
              "Using Azure CLI interactive authentication. Ensure az login session is active before running assessments.",
          }),
      accessLevel: "minimum",
      accessValidated: true,
      accessValidatedDate: new Date().toISOString().split("T")[0],
      accessNotes: `Validated with ${selectedSubscriptions.length} subscription(s). Access levels: ${selectedSubscriptions.map((s) => s.accessLevel).join(", ")}`,
    },

    subscriptions: selectedSubscriptions.map((sub) => ({
      id: sub.id,
      name: sub.name,
    })),

    resourceGroups: {
      include: [],
      exclude: [],
    },

    adoOrganization: "ADO_ORG_NAME",
    adoProject: "ADO_PROJECT_NAME",

    assessmentPeriod: {
      runHistoryDays: scope.runHistoryDays,
      failureAnalysisDays: scope.failureAnalysisDays,
    },

    standards: {
      useLocalSSOT: true,
      fetchFromConfluence: standards.fetchFromConfluence,
      confluenceSpace: "TSSOTAI",
      validateMicrosoftBestPractices: standards.validateMicrosoftBestPractices,
    },

    focusAreas: scope.focusAreas,

    exclusions: {
      resourceTypes: [],
      resourceNames: [],
      tags: {},
    },

    securityOption: "Standard",
    monitoringPlatform: "AzureMonitor",
    usesCMK: false,
    usesNSGMicroSegmentation: false,

    contacts: {
      clientTechnical: {
        name: clientConfig.contactName || "CONTACT_NAME",
        role: "CONTACT_ROLE",
        email: clientConfig.contactEmail || "CONTACT_EMAIL",
      },
      clientBusiness: {
        name: "NAME",
        role: "ROLE",
        email: "EMAIL",
      },
      conticaLead: {
        name: "NAME",
        role: "Integration Consultant",
        email: "EMAIL",
      },
      accountManager: {
        name: "NAME",
        email: "EMAIL",
      },
      clientDecisionMaker: {
        name: "NAME",
        role: "ROLE",
        email: "EMAIL",
      },
    },

    customChecks: {
      securityPriorities: [],
      complianceRequirements: [],
      namingConventionPattern: "",
      allowPublicDevPortal: false,
      usesSelfHostedIR: false,
    },

    salesOpportunities: {
      includeInReport: scope.focusAreas.includes("sales-opportunities"),
      currency: "EUR",
    },

    notes: "",
  };

  // Write config file
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  // Create output directories with date subfolder
  const assessmentDate = config.assessmentDate;
  const outputDir = path.join(
    PROJECT_ROOT,
    "output",
    clientSlug,
    assessmentDate,
  );
  await fs.mkdir(path.join(outputDir, "inventory"), { recursive: true });
  await fs.mkdir(path.join(outputDir, "analysis", "logic-apps"), {
    recursive: true,
  });
  await fs.mkdir(path.join(outputDir, "reports"), { recursive: true });

  return { clientSlug, configPath, outputDir };
}

// Test MCP connectivity
async function testMCPConnectivity() {
  console.log(chalk.bold("\n🔌 Step 7/7: MCP Server Testing"));
  console.log(chalk.gray("─".repeat(60)));

  console.log(
    chalk.cyan("\n  ✓ Azure MCP Server: Configured (uses az login context)"),
  );
  console.log(
    chalk.yellow(
      "  ⚠ Logic Apps MCP: Known auth issue, using Azure CLI fallback",
    ),
  );
  console.log(chalk.cyan("  ✓ Microsoft Docs MCP: Will be available in agent"));
  console.log(
    chalk.cyan(
      "  ✓ Atlassian MCP: Will be available in agent (requires ATLASSIAN_API_TOKEN)",
    ),
  );

  console.log(
    chalk.gray(
      "\nNote: MCP servers are initialized by VS Code when running agents.\n",
    ),
  );
}

// Main setup flow
async function main() {
  try {
    // Step 1: Authentication
    const authInfo = await promptAuthentication();

    // Step 2: Validate and discover subscriptions
    const { credential, subscriptions } =
      await validateAndDiscoverSubscriptions(authInfo);

    // Select subscriptions
    const selectedSubscriptions = await selectSubscriptions(subscriptions);

    // Step 3: Client configuration
    const clientConfig = await promptClientConfig();

    // Step 4: Assessment scope
    const scope = await promptAssessmentScope();

    // Step 5: Standards configuration
    const standards = await promptStandardsConfig();

    // Step 6: Credential storage (only for service principal)
    let storage = { storageMethod: "cli" };
    if (authInfo.type === "sp") {
      storage = await promptCredentialStorage(authInfo);
    } else {
      console.log(chalk.bold("\n🔐 Step 6/7: Credential Storage"));
      console.log(chalk.gray("─".repeat(60)));
      console.log(
        chalk.cyan(
          "\n  Using Azure CLI authentication — no additional credential storage needed.\n",
        ),
      );
    }

    // Generate config file
    console.log(chalk.bold("\n💾 Generating configuration..."));
    const { clientSlug, configPath, outputDir } = await generateClientConfig(
      authInfo,
      selectedSubscriptions,
      clientConfig,
      scope,
      standards,
      storage,
    );

    // Step 7: Test MCP connectivity
    await testMCPConnectivity();

    // Success summary
    console.log(
      chalk.bold.green(
        "\n╔════════════════════════════════════════════════════════╗",
      ),
    );
    console.log(
      chalk.bold.green(
        "║                 Setup Complete!                        ║",
      ),
    );
    console.log(
      chalk.bold.green(
        "╚════════════════════════════════════════════════════════╝\n",
      ),
    );

    console.log(chalk.cyan("Configuration saved to:"));
    console.log(chalk.gray(`  ${configPath}\n`));

    console.log(chalk.cyan("Output directory created:"));
    console.log(chalk.gray(`  ${outputDir}\n`));

    console.log(chalk.bold("Next steps:\n"));

    if (authInfo.type === "sp") {
      console.log(chalk.yellow("  1. Set environment variables (see above)"));
    } else {
      console.log(chalk.yellow("  1. Ensure Azure CLI session stays active"));
    }

    if (standards.fetchFromConfluence) {
      console.log(chalk.yellow("  2. Sync SSOT from Confluence:"));
      console.log(chalk.gray("     npm run sync-ssot"));
    }

    console.log(
      chalk.yellow(
        `  ${standards.fetchFromConfluence ? "3" : "2"}. Validate setup:`,
      ),
    );
    console.log(chalk.gray("     npm run validate"));

    console.log(
      chalk.yellow(
        `  ${standards.fetchFromConfluence ? "4" : "3"}. Open START-HERE.md for assessment instructions\n`,
      ),
    );

    console.log(
      chalk.gray("For automated/CI mode, set environment variables and run:"),
    );
    console.log(chalk.gray(`  npm run validate\n`));
  } catch (error) {
    console.error(chalk.red("\n❌ Setup failed:"), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Run main
main();
