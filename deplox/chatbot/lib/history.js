import fs from 'fs';
import { HISTORY_FILE, PORTAL_PATHS_SRV } from './config.js';

/** Append a deployment record to the history file (newest first, max 200) */
export function appendHistory(record) {
  try {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch {}
    }
    history.unshift(record);
    if (history.length > 200) history = history.slice(0, 200);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (e) { console.error('[history] write failed:', e.message); }
}

/** Build an Azure Portal deep-link for a deployed resource */
export function buildPortalLink(config) {
  const sub  = config.subscriptionId;
  const rg   = config.resourceGroup;
  const pp   = PORTAL_PATHS_SRV[config.service];
  const name = config.params?.namespaceName || config.params?.logicAppName
             || config.params?.functionAppName || config.params?.serviceName
             || config.params?.vaultName || config.params?.topicName
             || config.params?.accountName || config.params?.eventHubNamespaceName || '';
  return (sub && rg && pp && name)
    ? `https://portal.azure.com/#resource/subscriptions/${sub}/resourceGroups/${rg}/providers/${pp}/${name}/overview`
    : `https://portal.azure.com/#browse/resourcegroups`;
}
