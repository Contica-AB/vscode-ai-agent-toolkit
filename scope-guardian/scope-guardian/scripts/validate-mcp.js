/**
 * Validate MCP Configuration
 *
 * Checks that the required MCP servers are configured and accessible.
 * Run with: npm run validate
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// MCP config location for VS Code
const getMcpConfigPath = () => {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA, "Code", "User", "mcp.json");
  } else if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Code",
      "User",
      "mcp.json",
    );
  } else {
    return path.join(os.homedir(), ".config", "Code", "User", "mcp.json");
  }
};

const requiredServers = [
  {
    name: "atlassian",
    description: "Jira/Confluence access",
    critical: true,
  },
  {
    name: "azure",
    altNames: ["azure-mcp"],
    description: "Azure resource inspection",
    critical: false,
  },
  {
    name: "azure-devops-mcp",
    altNames: ["azdo", "azure-devops"],
    description: "Azure DevOps work items and repos",
    critical: false,
  },
];

const optionalServers = [
  {
    name: "logicapps",
    altNames: ["logicapps-mcp"],
    description: "Logic Apps deep inspection",
  },
  {
    name: "microsoftdocs",
    description: "Microsoft documentation search",
  },
];

function checkMcpConfig() {
  const configPath = getMcpConfigPath();

  console.log("Scope Guardian - MCP Configuration Validator\n");
  console.log(`Checking: ${configPath}\n`);

  if (!fs.existsSync(configPath)) {
    console.log("❌ MCP config file not found!");
    console.log("\nTo set up MCP servers:");
    console.log("1. Open VS Code Settings (Cmd/Ctrl + ,)");
    console.log('2. Search for "MCP"');
    console.log("3. Configure the required servers");
    return false;
  }

  let config;
  try {
    const content = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(content);
  } catch (err) {
    console.log("❌ Error reading MCP config:", err.message);
    return false;
  }

  const servers = config.servers || config.mcpServers || {};
  const serverNames = Object.keys(servers);

  console.log("Found MCP servers:", serverNames.join(", ") || "(none)");
  console.log("\n--- Required Servers ---\n");

  let allCriticalPresent = true;

  for (const server of requiredServers) {
    const found = serverNames.some(
      (name) =>
        name === server.name ||
        (server.altNames && server.altNames.includes(name)),
    );

    if (found) {
      console.log(`✓ ${server.name}: ${server.description}`);
    } else if (server.critical) {
      console.log(`✗ ${server.name}: MISSING (${server.description})`);
      allCriticalPresent = false;
    } else {
      console.log(`○ ${server.name}: not configured (${server.description})`);
    }
  }

  console.log("\n--- Optional Servers ---\n");

  for (const server of optionalServers) {
    const found = serverNames.some(
      (name) =>
        name === server.name ||
        (server.altNames && server.altNames.includes(name)),
    );

    if (found) {
      console.log(`✓ ${server.name}: ${server.description}`);
    } else {
      console.log(`○ ${server.name}: not configured (${server.description})`);
    }
  }

  console.log("\n--- Summary ---\n");

  if (allCriticalPresent) {
    console.log("✓ All critical servers configured");
    console.log("  Ready to use Scope Guardian!");
    return true;
  } else {
    console.log("✗ Missing critical servers");
    console.log("  Please configure Atlassian MCP server");
    return false;
  }
}

// Run validation
const success = checkMcpConfig();
process.exit(success ? 0 : 1);
