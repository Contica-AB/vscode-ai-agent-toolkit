import { Router } from 'express';
import fs from 'fs';
import { HISTORY_FILE } from '../lib/config.js';
import { sessions } from '../lib/session.js';

const router = Router();

/** Clear a session */
router.delete('/session/:id', (req, res) => {
  sessions.delete(req.params.id);
  res.json({ ok: true });
});

/** Deployment history */
router.get('/history', (_req, res) => {
  try {
    const history = fs.existsSync(HISTORY_FILE)
      ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
      : [];
    res.json(history);
  } catch { res.json([]); }
});

/** Debug — list all active sessions and their chat history */
router.get('/debug/sessions', (_req, res) => {
  const out = {};
  for (const [id, s] of sessions.entries()) {
    out[id] = {
      state:     s.state,
      service:   s.service,
      collected: s.collected,
      history:   s.messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content.slice(0, 300) }))
    };
  }
  res.json(out);
});

export default router;
