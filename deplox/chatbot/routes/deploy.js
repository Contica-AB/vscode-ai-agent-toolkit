import { Router } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { MODULES_DIR } from '../lib/config.js';
import { SERVICE_SCHEMAS } from '../lib/schemas.js';
import { sse } from '../lib/sse.js';
import { appendHistory, buildPortalLink } from '../lib/history.js';

const router = Router();

/** Deploy — runs az CLI, streams logs via SSE. Supports single or multi-config. */
router.post('/', (req, res) => {
  const { config, configs } = req.body;
  const configList = configs || (config ? [config] : []);
  if (!configList.length) return res.status(400).json({ error: 'config or configs required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Guard: ensure user is logged in before deploying
  try {
    execSync('az account show --output none 2>/dev/null', { timeout: 8000 });
  } catch {
    sse(res, 'error', { message: 'Not logged in to Azure. Please sign in via the top-right login button first.' });
    return res.end();
  }

  const SERVICE_BICEP_MAP = {
    'servicebus':           'servicebus.bicep',
    'eventhub':             'eventhub.bicep',
    'logicapp-consumption': 'logicapp-consumption.bicep',
    'logicapp-standard':    'logicapp-standard.bicep',
    'apim':                 'apim.bicep',
    'integrationaccount':   'integrationaccount.bicep',
    'functionapp':          'functionapp.bicep',
    'keyvault':             'keyvault.bicep',
    'eventgrid':            'eventgrid.bicep',
  };

  const runStep = (label, args) => new Promise((resolve, reject) => {
    sse(res, 'log', { message: label });
    const proc = spawn('az', args, { shell: true });
    proc.stdout.on('data', d => sse(res, 'log', { message: d.toString().trimEnd() }));
    proc.stderr.on('data', d => {
      const m = d.toString().trimEnd();
      if (m.includes('A new Bicep release is available')) return;
      sse(res, m.startsWith('WARNING:') ? 'warn' : 'log', { message: m });
    });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Step failed (exit ${code})`)));
  });

  const makeHistoryRecord = (cfg, result, error = null) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    service: cfg.service,
    serviceLabel: cfg.serviceLabel,
    resourceGroup: cfg.resourceGroup,
    location: cfg.location,
    subscriptionId: cfg.subscriptionId,
    subscriptionName: cfg.subscriptionName,
    params: cfg.params,
    result,
    portalLink: result === 'success' ? buildPortalLink(cfg) : null,
    error,
    batchId: configList.length > 1 ? batchId : undefined,
  });

  const batchId = configList.length > 1 ? `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` : null;
  const total = configList.length;
  const deployResults = {};
  let successCount = 0;

  async function deploySingleConfig(cfg, idx) {
    const svcLabel = cfg.serviceLabel || cfg.service;
    if (total > 1) {
      sse(res, 'deploy_service_start', { service: cfg.service, serviceLabel: svcLabel, index: idx, total });
      sse(res, 'log', { message: `\n═══ [${idx + 1}/${total}] Deploying ${svcLabel} ═══` });
    }

    const bicepFileName = SERVICE_BICEP_MAP[cfg.service];
    if (!bicepFileName) {
      sse(res, 'deploy_service_error', { service: cfg.service, message: `Unknown service: ${cfg.service}`, index: idx });
      appendHistory(makeHistoryRecord(cfg, 'failed', `Unknown service: ${cfg.service}`));
      return false;
    }

    const bicepFile = path.join(MODULES_DIR, bicepFileName);
    if (!fs.existsSync(bicepFile)) {
      sse(res, 'deploy_service_error', { service: cfg.service, message: `Bicep file not found: ${bicepFile}`, index: idx });
      appendHistory(makeHistoryRecord(cfg, 'failed', `Bicep file not found`));
      return false;
    }

    // Key Vault: auto-inject current user's object ID if not supplied
    if (cfg.service === 'keyvault' && !cfg.params.adminObjectId) {
      try {
        const objId = execSync('az ad signed-in-user show --query id -o tsv 2>/dev/null', { timeout: 8000 }).toString().trim();
        if (objId) cfg.params.adminObjectId = objId;
      } catch { /* leave empty */ }
    }

    // Build ARM parameters JSON
    const svcSchema = SERVICE_SCHEMAS[cfg.service] || [];
    const allParams = { ...cfg.params, location: cfg.location, tags: cfg.tags };
    const armParams = {};
    for (const [k, v] of Object.entries(allParams)) {
      const def = svcSchema.find(p => p.key === k);
      armParams[k] = { value: def?.paramType === 'int' ? parseInt(v, 10) : v };
    }

    const tmpFile = path.join(os.tmpdir(), `il-deploy-${Date.now()}-${idx}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(armParams, null, 2));
    const cleanup = () => { try { fs.unlinkSync(tmpFile); } catch {} };

    try {
      const steps = [];

      steps.push(() => runStep(
        `[~] Setting subscription: ${cfg.subscriptionName || cfg.subscriptionId}`,
        ['account', 'set', '--subscription', cfg.subscriptionId]
      ));

      if (cfg.createResourceGroup) {
        steps.push(() => runStep(
          `[+] Creating resource group: ${cfg.resourceGroup} in ${cfg.location}`,
          ['group', 'create', '--name', cfg.resourceGroup, '--location', cfg.location, '--output', 'none']
        ));
      }

      steps.push(() => runStep(
        `[>] Deploying ${cfg.serviceLabel} → ${cfg.resourceGroup} ...`,
        ['deployment', 'group', 'create',
          '--resource-group', cfg.resourceGroup,
          '--name', cfg.deploymentName,
          '--template-file', bicepFile,
          '--parameters', `@${tmpFile}`,
          '--output', 'table']
      ));

      // Zip deploy for Function App / Logic App Standard
      if (['functionapp', 'logicapp-standard'].includes(cfg.service) && cfg.codePath) {
        const zipFile    = path.join(os.tmpdir(), `il-code-${Date.now()}-${idx}.zip`);
        const appName    = cfg.params.functionAppName || cfg.params.logicAppName;
        const deployCmd  = cfg.service === 'logicapp-standard' ? 'logicapp' : 'functionapp';
        steps.push(() => new Promise((resolve, reject) => {
          sse(res, 'log', { message: `[~] Packaging code from: ${cfg.codePath}` });
          const isWin = process.platform === 'win32';
          let proc;
          if (isWin) {
            proc = spawn('powershell', [
              '-NoProfile', '-Command',
              `Compress-Archive -Path '${cfg.codePath}\\*' -DestinationPath '${zipFile}' -Force`
            ], { shell: false });
          } else {
            proc = spawn('zip', ['-r', zipFile, '.'], { cwd: cfg.codePath, shell: false });
          }
          proc.on('error', err => reject(new Error(`Failed to start zip process: ${err.message}`)));
          proc.stderr.on('data', d => sse(res, 'log', { message: d.toString().trimEnd() }));
          proc.on('close', code => code === 0 ? resolve() : reject(new Error('Failed to zip code folder')));
        }));
        steps.push(() => runStep(
          `[>] Deploying code to ${appName} ...`,
          [deployCmd, 'deployment', 'source', 'config-zip',
            '--resource-group', cfg.resourceGroup,
            '--name', appName,
            '--src', zipFile]
        ));
      }

      await steps.reduce((p, fn) => p.then(fn), Promise.resolve());

      // Fetch outputs
      try {
        const raw = execSync(
          `az deployment group show --resource-group "${cfg.resourceGroup}" --name "${cfg.deploymentName}" --query properties.outputs -o json 2>/dev/null`,
          { timeout: 15000 }
        ).toString().trim();
        const outputs = JSON.parse(raw);
        const keys = Object.keys(outputs);
        if (keys.length) {
          sse(res, 'log', { message: '[+] Deployment outputs:' });
          for (const k of keys) {
            sse(res, 'log', { message: `    ${k}: ${outputs[k].value}` });
          }
        }
      } catch { /* outputs unavailable */ }

      cleanup();
      appendHistory(makeHistoryRecord(cfg, 'success'));
      deployResults[cfg.service] = { success: true };
      sse(res, 'deploy_service_complete', { service: cfg.service, serviceLabel: svcLabel, index: idx, result: 'success' });
      return true;
    } catch (err) {
      cleanup();
      appendHistory(makeHistoryRecord(cfg, 'failed', err.message));
      deployResults[cfg.service] = { success: false, error: err.message };
      sse(res, 'deploy_service_error', { service: cfg.service, serviceLabel: svcLabel, message: err.message, index: idx });
      return false;
    }
  }

  // Run deployments sequentially
  (async () => {
    for (let i = 0; i < configList.length; i++) {
      const ok = await deploySingleConfig(configList[i], i);
      if (ok) successCount++;
    }
    // Final summary
    if (total > 1) {
      const msg = successCount === total
        ? `All ${total} services deployed successfully.`
        : `${successCount}/${total} services deployed successfully.`;
      sse(res, successCount === total ? 'success' : 'warn', { message: msg });
    } else {
      sse(res, successCount === 1 ? 'success' : 'error', {
        message: successCount === 1 ? 'Deployment completed successfully.' : 'Deployment failed.'
      });
    }
    // Send post-deploy diagram data
    sse(res, 'deploy_complete', { deployResults, total, successCount });
    res.end();
  })();
});

export default router;
