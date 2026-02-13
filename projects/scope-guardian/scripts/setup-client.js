/**
 * Setup Client
 *
 * Interactive script to create a new client folder from template.
 * Run with: npm run setup
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function setupClient() {
  console.log("Scope Guardian - Client Setup\n");

  // Get client name
  const clientName = await ask("Client name (will be folder name): ");

  if (!clientName) {
    console.log("Client name is required");
    rl.close();
    return;
  }

  // Sanitize for folder name
  const sanitizedName = clientName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const clientDir = path.join(__dirname, "..", "clients", sanitizedName);

  // Check if exists
  if (fs.existsSync(clientDir)) {
    console.log(`\n⚠️  Client folder already exists: ${clientDir}`);
    const overwrite = await ask("Overwrite config? (y/N): ");
    if (overwrite.toLowerCase() !== "y") {
      console.log("Cancelled");
      rl.close();
      return;
    }
  }

  // Create directory
  fs.mkdirSync(clientDir, { recursive: true });

  // Gather info
  console.log("\n--- Atlassian Setup ---");
  const atlassianInstance = await ask(
    "Atlassian instance URL (e.g., company.atlassian.net): ",
  );
  const jiraProject = await ask("Default Jira project key (optional): ");
  const confluenceSpace = await ask(
    "Default Confluence space key (optional): ",
  );

  console.log("\n--- Azure DevOps Setup (optional) ---");
  const adoOrg = await ask("Azure DevOps organization (optional): ");
  const adoProject = await ask("Azure DevOps project (optional): ");

  console.log("\n--- Azure Setup (optional) ---");
  const azureSubscription = await ask(
    "Default Azure subscription ID (optional): ",
  );
  const azureResourceGroup = await ask("Default resource group (optional): ");

  // Build config
  const config = {
    name: clientName,
    description: "",
    credentials: {
      atlassian: {
        method: "ask",
        instance: atlassianInstance || "",
      },
      azure: {
        method: "ask",
        subscriptionId: azureSubscription || "",
        resourceGroup: azureResourceGroup || "",
      },
      azureDevOps: {
        method: "ask",
        organization: adoOrg || "",
        project: adoProject || "",
      },
      github: {
        method: "ask",
      },
    },
    defaults: {
      jiraProject: jiraProject || "",
      confluenceSpace: confluenceSpace || "",
    },
    output: {
      saveReports: true,
      reportFormat: "markdown",
    },
  };

  // Write config
  const configPath = path.join(clientDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Copy notes template
  const notesTemplatePath = path.join(
    __dirname,
    "..",
    "clients",
    "_template",
    "notes.md",
  );
  const notesPath = path.join(clientDir, "notes.md");

  if (fs.existsSync(notesTemplatePath)) {
    let notesContent = fs.readFileSync(notesTemplatePath, "utf8");
    notesContent = notesContent.replace("[Client Name]", clientName);
    fs.writeFileSync(notesPath, notesContent);
  }

  // Create output directory
  const outputDir = path.join(__dirname, "..", "output", sanitizedName);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n✓ Client created successfully!");
  console.log(`  Config: ${configPath}`);
  console.log(`  Notes: ${notesPath}`);
  console.log(`  Output: ${outputDir}`);
  console.log("\nOpen VS Code and start classifying!");

  rl.close();
}

setupClient().catch(console.error);
