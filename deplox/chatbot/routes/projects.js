import { Router } from 'express';
import {
  listProjects, createProject, loadProject, updateProject, deleteProject,
  addDeployment, getDeployments, saveProjectSession, loadProjectSession
} from '../lib/projects.js';
import { getAzureDeploymentStatus } from '../lib/azure-status.js';

const router = Router();

/* ── List all projects ──────────────────────────────────────────────────────── */
router.get('/', (_req, res) => {
  try {
    res.json(listProjects());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── Create project ─────────────────────────────────────────────────────────── */
router.post('/', (req, res) => {
  const { name, defaults } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Project name is required' });
  try {
    const project = createProject(name.trim(), defaults || {});
    res.status(201).json(project);
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

/* ── Get full project detail ────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const project = loadProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

/* ── Update project defaults ────────────────────────────────────────────────── */
router.put('/:id', (req, res) => {
  try {
    const updated = updateProject(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/* ── Delete project ─────────────────────────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Project not found' });
  res.json({ ok: true });
});

/* ── Save session state to project ──────────────────────────────────────────── */
router.put('/:id/session', (req, res) => {
  const saved = saveProjectSession(req.params.id, req.body);
  if (!saved) return res.status(404).json({ error: 'Project not found' });
  res.json({ ok: true });
});

/* ── Load session state from project ────────────────────────────────────────── */
router.get('/:id/session', (req, res) => {
  const session = loadProjectSession(req.params.id);
  res.json(session || { empty: true });
});

/* ── List deployments for project ───────────────────────────────────────────── */
router.get('/:id/deployments', (req, res) => {
  res.json(getDeployments(req.params.id));
});

/* ── Compare local version vs Azure deployment status ───────────────────────── */
router.get('/:id/azure-status', async (req, res) => {
  const project = loadProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    const status = await getAzureDeploymentStatus(project);
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
