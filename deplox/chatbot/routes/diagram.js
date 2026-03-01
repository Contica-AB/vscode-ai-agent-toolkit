import { Router } from 'express';
import { generateMermaid } from '../lib/diagram.js';

const router = Router();

/** Generate a Mermaid diagram from a deployment plan */
router.post('/', (req, res) => {
  const { plan, mode, deployResults } = req.body;
  if (!plan || !Array.isArray(plan) || !plan.length) {
    return res.status(400).json({ error: 'plan array required' });
  }
  const mermaid = generateMermaid(plan, mode || 'preview', deployResults || null);
  res.json({ mermaid });
});

export default router;
