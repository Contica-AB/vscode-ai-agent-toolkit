import { SERVICE_LABELS } from './schemas.js';

/**
 * Cross-service relationship graph.
 * Each entry: { from, to, label, direction }
 *   direction: 'forward' = left→right flow (from fronts/triggers to)
 */
export const SERVICE_EDGES = [
  // APIM fronts compute services
  { from: 'apim',               to: 'functionapp',          label: 'fronts',              direction: 'forward' },
  { from: 'apim',               to: 'logicapp-standard',    label: 'fronts',              direction: 'forward' },
  { from: 'apim',               to: 'logicapp-consumption', label: 'fronts',              direction: 'forward' },

  // Compute triggers from / sends to messaging
  { from: 'functionapp',          to: 'servicebus',           label: 'triggers / sends',    direction: 'forward' },
  { from: 'functionapp',          to: 'eventhub',             label: 'triggers / sends',    direction: 'forward' },
  { from: 'functionapp',          to: 'eventgrid',            label: 'subscribes',          direction: 'forward' },
  { from: 'logicapp-standard',    to: 'servicebus',           label: 'triggers / sends',    direction: 'forward' },
  { from: 'logicapp-standard',    to: 'eventhub',             label: 'triggers / sends',    direction: 'forward' },
  { from: 'logicapp-standard',    to: 'eventgrid',            label: 'subscribes',          direction: 'forward' },
  { from: 'logicapp-consumption', to: 'servicebus',           label: 'triggers / sends',    direction: 'forward' },
  { from: 'logicapp-consumption', to: 'eventhub',             label: 'triggers / sends',    direction: 'forward' },
  { from: 'logicapp-consumption', to: 'eventgrid',            label: 'subscribes',          direction: 'forward' },

  // Logic App Consumption uses Integration Account
  { from: 'logicapp-consumption', to: 'integrationaccount',   label: 'uses',                direction: 'forward' },

  // Secrets storage
  { from: 'functionapp',          to: 'keyvault',             label: 'stores secrets in',   direction: 'forward' },
  { from: 'logicapp-standard',    to: 'keyvault',             label: 'stores secrets in',   direction: 'forward' },
  { from: 'apim',                 to: 'keyvault',             label: 'stores secrets in',   direction: 'forward' },

  // Event Grid routes to various targets
  { from: 'eventgrid',            to: 'functionapp',          label: 'routes to',           direction: 'forward' },
  { from: 'eventgrid',            to: 'logicapp-standard',    label: 'routes to',           direction: 'forward' },
  { from: 'eventgrid',            to: 'logicapp-consumption', label: 'routes to',           direction: 'forward' },
  { from: 'eventgrid',            to: 'eventhub',             label: 'routes to',           direction: 'forward' },
  { from: 'eventgrid',            to: 'servicebus',           label: 'routes to',           direction: 'forward' },
];

/**
 * Intra-service resources — what each Bicep module creates internally.
 * Used to show sub-resources inside a service's subgraph.
 */
export const INTERNAL_RESOURCES = {
  'servicebus': [
    { id: 'sb-ns',     label: 'Namespace',  type: 'Microsoft.ServiceBus/namespaces' },
    { id: 'sb-queues', label: 'Queues',     type: 'sub-resource', parentId: 'sb-ns' },
    { id: 'sb-topics', label: 'Topics',     type: 'sub-resource', parentId: 'sb-ns' },
  ],
  'eventhub': [
    { id: 'eh-ns',   label: 'Namespace',    type: 'Microsoft.EventHub/namespaces' },
    { id: 'eh-hubs', label: 'Event Hubs',   type: 'sub-resource', parentId: 'eh-ns' },
  ],
  'logicapp-standard': [
    { id: 'las-sa',   label: 'Storage Account', type: 'Microsoft.Storage/storageAccounts' },
    { id: 'las-plan', label: 'App Service Plan', type: 'Microsoft.Web/serverfarms' },
    { id: 'las-site', label: 'Logic App',        type: 'Microsoft.Web/sites' },
  ],
  'logicapp-consumption': [
    { id: 'lac-wf', label: 'Workflow', type: 'Microsoft.Logic/workflows' },
  ],
  'functionapp': [
    { id: 'fa-sa',   label: 'Storage Account', type: 'Microsoft.Storage/storageAccounts' },
    { id: 'fa-plan', label: 'App Service Plan', type: 'Microsoft.Web/serverfarms' },
    { id: 'fa-site', label: 'Function App',     type: 'Microsoft.Web/sites' },
  ],
  'apim': [
    { id: 'apim-svc',    label: 'APIM Service', type: 'Microsoft.ApiManagement/service' },
    { id: 'apim-policy', label: 'Global Policy', type: 'sub-resource', parentId: 'apim-svc' },
    { id: 'apim-echo',   label: 'Echo API',      type: 'sub-resource', parentId: 'apim-svc' },
  ],
  'keyvault': [
    { id: 'kv', label: 'Key Vault', type: 'Microsoft.KeyVault/vaults' },
  ],
  'eventgrid': [
    { id: 'eg-topic', label: 'Topic', type: 'Microsoft.EventGrid/topics' },
  ],
  'integrationaccount': [
    { id: 'ia', label: 'Integration Account', type: 'Microsoft.Logic/integrationAccounts' },
  ],
};

/**
 * Mermaid style classes per Azure service category — used for node coloring.
 */
export const SERVICE_STYLES = {
  'apim':                 'apiStyle',
  'functionapp':          'computeStyle',
  'logicapp-standard':    'computeStyle',
  'logicapp-consumption': 'computeStyle',
  'servicebus':           'messagingStyle',
  'eventhub':             'messagingStyle',
  'eventgrid':            'messagingStyle',
  'keyvault':             'securityStyle',
  'integrationaccount':   'integrationStyle',
};

/**
 * Build the structured diagram data from a deployment plan.
 * 
 * @param {Array<{service: string, config: object}>} plan - Array of planned services
 * @returns {{ nodes: Array, edges: Array, resourceGroup: string, location: string, subscription: string }}
 */
export function buildDiagramData(plan) {
  if (!plan || !plan.length) return { nodes: [], edges: [], resourceGroup: '', location: '', subscription: '' };

  const serviceSet = new Set(plan.map(p => p.service));
  const firstConfig = plan[0].config || {};

  // Build nodes — one per planned service, with instance-specific labels
  const nodes = plan.map((entry, idx) => {
    const { service, config } = entry;
    const label = config?.serviceLabel || SERVICE_LABELS[service] || service;
    const resourceName = getResourceName(service, config?.params || {});
    return {
      id: `svc_${idx}_${service.replace(/-/g, '_')}`,
      service,
      label,
      resourceName: resourceName || label,
      style: SERVICE_STYLES[service] || 'defaultStyle',
      internalResources: INTERNAL_RESOURCES[service] || [],
      config,
    };
  });

  // Build edges — only between services that are both in the plan
  // For duplicate services, connect edges to the first instance
  const svcToNodeId = {};
  for (const node of nodes) {
    if (!svcToNodeId[node.service]) svcToNodeId[node.service] = node.id;
  }

  const edges = [];
  const edgeSeen = new Set();
  for (const edge of SERVICE_EDGES) {
    if (serviceSet.has(edge.from) && serviceSet.has(edge.to)) {
      const fromId = svcToNodeId[edge.from];
      const toId   = svcToNodeId[edge.to];
      const key = `${fromId}->${toId}`;
      if (!edgeSeen.has(key)) {
        edgeSeen.add(key);
        edges.push({ from: fromId, to: toId, label: edge.label });
      }
    }
  }

  return {
    nodes,
    edges,
    resourceGroup: firstConfig.resourceGroup || '',
    location: firstConfig.location || '',
    subscription: firstConfig.subscriptionName || '',
  };
}

/** Extract the primary resource name from collected params */
function getResourceName(service, params) {
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
