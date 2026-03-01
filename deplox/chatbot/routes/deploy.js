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

/** Deploy — runs az CLI, streams logs via SSE */
router.post('/', (req, res) => {
  const { config } = req.body;
  if (!config) return res.status(400).json({ error: 'config required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Guard: ensure user is logged in before deploying
  try {
    execSync('az account show --output none 2>nul', { timeout: 8000 });
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

  const bicepFileName = SERVICE_BICEP_MAP[config.service];
  if (!bicepFileName) {
    sse(res, 'error', { message: `Unknown service: ${config.service}` });
    return res.end();
  }

  const bicepFile = path.join(MODULES_DIR, bicepFileName);
  if (!fs.existsSync(bicepFile)) {
    sse(res, 'error', { message: `Bicep file not found: ${bicepFile}` });
    return res.end();
  }

  // Key Vault: auto-inject current user's object ID if not supplied
  if (config.service === 'keyvault' && !config.params.adminObjectId) {
    try {
      const objId = execSync('az ad signed-in-user show --query id -o tsv 2>nul', { timeout: 8000 }).toString().trim();
      if (objId) config.params.adminObjectId = objId;
    } catch { /* leave empty — vault deploys without access policy */ }
  }

  // Build ARM parameters JSON — coerce typed params (e.g. int)
  const svcSchema = SERVICE_SCHEMAS[config.service] || [];
  const allParams = { ...config.params, location: config.location, tags: config.tags };
  const armParams = {};
  for (const [k, v] of Object.entries(allParams)) {
    const def = svcSchema.find(p => p.key === k);
    armParams[k] = { value: def?.paramType === 'int' ? parseInt(v, 10) : v };
  }

  const tmpFile = path.join(os.tmpdir(), `il-deploy-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(armParams, null, 2));

  const cleanup = () => { try { fs.unlinkSync(tmpFile); } catch {} };

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

  const steps = [
    () => runStep(
      `[~] Setting subscription: ${config.subscriptionName || config.subscriptionId}`,
      ['account', 'set', '--subscription', config.subscriptionId]
    )
  ];

  if (config.createResourceGroup) {
    steps.push(() => runStep(
      `[+] Creating resource group: ${config.resourceGroup} in ${config.location}`,
      ['group', 'create', '--name', config.resourceGroup, '--location', config.location, '--output', 'none']
    ));
  }

  steps.push(() => runStep(
    `[>] Deploying ${config.serviceLabel} → ${config.resourceGroup} ...`,
    ['deployment', 'group', 'create',
      '--resource-group', config.resourceGroup,
      '--name', config.deploymentName,
      '--template-file', bicepFile,
      '--parameters', `@${tmpFile}`,
      '--output', 'table']
  ));

  // Fetch and surface Bicep deployment outputs
  const emitOutputs = () => {
    try {
      const raw = execSync(
        `az deployment group show --resource-group "${config.resourceGroup}" --name "${config.deploymentName}" --query properties.outputs -o json 2>nul`,
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
    } catch { /* outputs unavailable — not fatal */ }
  };

  const makeHistoryRecord = (result, error = null) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    service: config.service,
    serviceLabel: config.serviceLabel,
    resourceGroup: config.resourceGroup,
    location: config.location,
    subscriptionId: config.subscriptionId,
    subscriptionName: config.subscriptionName,
    params: config.params,
    result,
    portalLink: result === 'success' ? buildPortalLink(config) : null,
    error
  });

  // Function App / Logic App Standard: zip-deploy local code after infrastructure is ready
  if (['functionapp', 'logicapp-standard'].includes(config.service) && config.codePath) {
    const zipFile    = path.join(os.tmpdir(), `il-code-${Date.now()}.zip`);
    const appName    = config.params.functionAppName || config.params.logicAppName;
    const deployCmd  = config.service === 'logicapp-standard' ? 'logicapp' : 'functionapp';
    steps.push(() => new Promise((resolve, reject) => {
      sse(res, 'log', { message: `[~] Packaging code from: ${config.codePath}` });
      const proc = spawn('powershell', [
        '-NoProfile', '-Command',
        `Compress-Archive -Path '${config.codePath}\\*' -DestinationPath '${zipFile}' -Force`
      ], { shell: false });
      proc.stderr.on('data', d => sse(res, 'log', { message: d.toString().trimEnd() }));
      proc.on('close', code => code === 0 ? resolve() : reject(new Error('Failed to zip code folder')));
    }));
    steps.push(() => runStep(
      `[>] Deploying code to ${appName} ...`,
      [deployCmd, 'deployment', 'source', 'config-zip',
        '--resource-group', config.resourceGroup,
        '--name', appName,
        '--src', zipFile]
    ));
    const cleanupAll = () => { cleanup(); try { fs.unlinkSync(zipFile); } catch {} };
    steps.reduce((p, fn) => p.then(fn), Promise.resolve())
      .then(() => {
        emitOutputs(); cleanupAll();
        appendHistory(makeHistoryRecord('success'));
        sse(res, 'success', { message: 'Deployment completed successfully.' }); res.end();
      })
      .catch(err => {
        cleanupAll();
        appendHistory(makeHistoryRecord('failed', err.message));
        sse(res, 'error', { message: err.message }); res.end();
      });
    return;
  }

  steps.reduce((p, fn) => p.then(fn), Promise.resolve())
    .then(() => {
      emitOutputs(); cleanup();
      appendHistory(makeHistoryRecord('success'));
      sse(res, 'success', { message: 'Deployment completed successfully.' }); res.end();
    })
    .catch(err => {
      cleanup();
      appendHistory(makeHistoryRecord('failed', err.message));
      sse(res, 'error', { message: err.message }); res.end();
    });
});

export default router;
