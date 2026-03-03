import { buildDiagramData, SERVICE_STYLES } from './relationships.js';
import { PORTAL_PATHS_SRV } from './config.js';

/**
 * Generate Mermaid syntax from a deployment plan.
 *
 * @param {Array<{service: string, config: object}>} plan
 * @param {'preview'|'deployed'} mode
 * @param {object} [deployResults] — per-service deployment results with resource IDs
 * @returns {string} — Mermaid flowchart definition
 */
export function generateMermaid(plan, mode = 'preview', deployResults = null) {
  const data = buildDiagramData(plan);
  if (!data.nodes.length) return '';

  const lines = [];
  lines.push('flowchart TD');
  lines.push('');

  // Top-level resource group subgraph
  const rgLabel = data.resourceGroup || 'Resource Group';
  const meta = [data.subscription, data.location].filter(Boolean).join(' · ');
  lines.push(`  subgraph RG["☁️ ${rgLabel}${meta ? ' (' + meta + ')' : ''}"]
    direction TB`);

  // Render each service as a subgraph with its internal resources
  for (const node of data.nodes) {
    const subId = node.id;
    const subLabel = `${node.label}`;
    const resName = node.resourceName || node.label;

    lines.push(`    subgraph ${subId}["${subLabel}<br/><i>${resName}</i>"]`);
    lines.push(`      direction TB`);

    // Internal resources
    const internals = node.internalResources;
    if (internals.length <= 1) {
      // Single resource — just show the main node
      const mainId = `${subId}_main`;
      if (mode === 'deployed' && deployResults?.[node.service]) {
        const portalUrl = buildPortalUrl(node, deployResults[node.service]);
        lines.push(`      ${mainId}["<a href='${portalUrl}' target='_blank'>${resName}</a>"]`);
      } else {
        lines.push(`      ${mainId}["${resName}"]`);
      }
    } else {
      // Multiple internal resources
      for (const res of internals) {
        const resId = `${subId}_${res.id}`;
        const resLabel = res.label;
        if (mode === 'deployed' && deployResults?.[node.service] && !res.parentId) {
          const portalUrl = buildPortalUrl(node, deployResults[node.service]);
          lines.push(`      ${resId}["<a href='${portalUrl}' target='_blank'>${resLabel}</a>"]`);
        } else {
          lines.push(`      ${resId}["${resLabel}"]`);
        }
      }
      // Internal edges (parent → child)
      for (const res of internals) {
        if (res.parentId) {
          lines.push(`      ${subId}_${res.parentId} --> ${subId}_${res.id}`);
        }
      }
    }

    lines.push(`    end`);
  }

  lines.push('  end');
  lines.push('');

  // Cross-service edges
  for (const edge of data.edges) {
    lines.push(`  ${edge.from} -. "${edge.label}" .-> ${edge.to}`);
  }

  lines.push('');

  // Style definitions
  lines.push('  classDef apiStyle fill:#7c3aed,stroke:#a78bfa,color:#fff');
  lines.push('  classDef computeStyle fill:#2563eb,stroke:#60a5fa,color:#fff');
  lines.push('  classDef messagingStyle fill:#059669,stroke:#34d399,color:#fff');
  lines.push('  classDef securityStyle fill:#d97706,stroke:#fbbf24,color:#fff');
  lines.push('  classDef integrationStyle fill:#0891b2,stroke:#22d3ee,color:#fff');
  lines.push('  classDef defaultStyle fill:#475569,stroke:#94a3b8,color:#fff');

  // Apply styles to subgraphs via class assignment
  for (const node of data.nodes) {
    lines.push(`  class ${node.id} ${node.style}`);
  }

  return lines.join('\n');
}

/**
 * Build a portal URL for a deployed resource.
 */
function buildPortalUrl(node, result) {
  const config = node.config;
  if (!config) return 'https://portal.azure.com';

  const sub = config.subscriptionId;
  const rg  = config.resourceGroup;
  const pp  = PORTAL_PATHS_SRV[node.service];
  const name = getMainResourceName(node.service, config.params || {});

  if (sub && rg && pp && name) {
    return `https://portal.azure.com/#resource/subscriptions/${sub}/resourceGroups/${rg}/providers/${pp}/${name}/overview`;
  }
  return 'https://portal.azure.com/#browse/resourcegroups';
}

function getMainResourceName(service, params) {
  switch (service) {
    case 'servicebus':           return params.namespaceName;
    case 'eventhub':             return params.namespaceName;
    case 'logicapp-standard':    return params.logicAppName;
    case 'logicapp-consumption': return params.logicAppName;
    case 'functionapp':          return params.functionAppName;
    case 'apim':                 return params.apimName;
    case 'keyvault':             return params.keyVaultName;
    case 'eventgrid':            return params.topicName;
    case 'integrationaccount':   return params.integrationAccountName;
    default:                     return null;
  }
}
