import { Router } from 'express';
import { OLLAMA_URL, OLLAMA_MODEL } from '../lib/config.js';

const router = Router();

/** Ollama status — running models, active model */
router.get('/status', async (_req, res) => {
  try {
    const r    = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    const models = (data.models || []).map(m => m.name);
    res.json({ running: true, models, activeModel: OLLAMA_MODEL, hasModel: models.some(m => m.startsWith(OLLAMA_MODEL)) });
  } catch {
    res.json({ running: false, models: [], hasModel: false });
  }
});

export default router;
