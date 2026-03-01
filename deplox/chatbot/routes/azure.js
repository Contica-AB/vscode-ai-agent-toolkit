import { Router } from 'express';
import { spawn, execSync } from 'child_process';
import { azJson } from '../lib/azure-cli.js';
import { sse } from '../lib/sse.js';

const router = Router();

/** Azure context: subscriptions + common locations */
router.get('/context', (_req, res) => {
  const subs = azJson(['account', 'list']) || [];
  res.json({
    subscriptions: subs.map(s => ({ id: s.id, name: s.name, isDefault: s.isDefault })),
    locations: [
      'swedencentral','westeurope','northeurope','eastus','eastus2','westus','westus2',
      'uksouth','ukwest','australiaeast','southeastasia','japaneast','centralus'
    ]
  });
});

/** Current logged-in account + active subscription */
router.get('/account', (_req, res) => {
  const account = azJson(['account', 'show']);
  if (!account) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    user:         account.user?.name || 'unknown',
    userType:     account.user?.type || 'user',
    subscription: { id: account.id, name: account.name },
    tenant:       account.tenantId
  });
});

/** Login — opens browser, streams progress via SSE */
router.post('/login', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const args = ['login'];
  if (req.body?.tenant) args.push('--tenant', req.body.tenant);

  sse(res, 'log', { message: 'Opening browser for Azure login...' });
  const proc = spawn('az', args, { shell: true });
  proc.stdout.on('data', d => sse(res, 'log',  { message: d.toString().trimEnd() }));
  proc.stderr.on('data', d => sse(res, 'log',  { message: d.toString().trimEnd() }));
  proc.on('close', code => {
    if (code === 0) {
      const account = azJson(['account', 'show']);
      sse(res, 'success', {
        message: `Logged in as ${account?.user?.name || 'unknown'}`,
        account: account ? {
          user: account.user?.name,
          subscription: { id: account.id, name: account.name }
        } : null
      });
    } else {
      sse(res, 'error', { message: 'Login failed or was cancelled.' });
    }
    res.end();
  });
});

/** Logout */
router.post('/logout', (_req, res) => {
  try {
    execSync('az logout', { timeout: 10000 });
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

/** Set active subscription */
router.post('/subscription', (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });
  try {
    execSync(`az account set --subscription ${subscriptionId}`, { timeout: 10000 });
    const account = azJson(['account', 'show']);
    res.json({ ok: true, subscription: { id: account.id, name: account.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
