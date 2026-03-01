import fs from 'fs';
import path from 'path';
import { PROJECTS_DIR } from './config.js';

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

/** Slugify a project name → safe filename (lowercase, dashes, no spaces) */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ensure the projects directory exists */
function ensureDir() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }
}

/** Get the file path for a project ID */
function projectFile(id) {
  return path.join(PROJECTS_DIR, `${id}.json`);
}

/** Read a project file, or null if not found */
function readProject(id) {
  const file = projectFile(id);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Write a project object to disk */
function writeProject(project) {
  ensureDir();
  fs.writeFileSync(projectFile(project.id), JSON.stringify(project, null, 2), 'utf8');
}

/* ── CRUD ────────────────────────────────────────────────────────────────────── */

/** List all projects (summary: id, name, created, last deployed, version count, status) */
export function listProjects() {
  ensureDir();
  const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const proj = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf8'));
      const lastDeploy = proj.deployments?.[0] || null;
      return {
        id: proj.id,
        name: proj.name,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
        deploymentCount: proj.deployments?.length || 0,
        currentVersion: proj.deployments?.length || 0,
        lastDeployedAt: lastDeploy?.timestamp || null,
        lastDeployStatus: lastDeploy?.status || null,
        hasPlan: (proj.currentPlan?.length || 0) > 0,
        defaults: proj.defaults || {},
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/** Create a new project */
export function createProject(name, defaults = {}) {
  ensureDir();
  const id = slugify(name);
  if (!id) throw new Error('Invalid project name');
  if (fs.existsSync(projectFile(id))) throw new Error(`Project "${name}" already exists`);

  const project = {
    id,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    defaults: {
      subscription: defaults.subscription || null,
      resourceGroup: defaults.resourceGroup || '',
      location: defaults.location || '',
      environment: defaults.environment || '',
      tags: { Project: name, CreatedBy: 'DeploX', ...(defaults.tags || {}) },
    },
    deployments: [],
    currentPlan: [],
    session: null,
  };

  writeProject(project);
  return project;
}

/** Load full project by ID */
export function loadProject(id) {
  return readProject(id);
}

/** Update project (partial patch — merges top-level keys) */
export function updateProject(id, patch) {
  const project = readProject(id);
  if (!project) throw new Error(`Project "${id}" not found`);

  // Merge defaults deeply if provided
  if (patch.defaults) {
    project.defaults = { ...project.defaults, ...patch.defaults };
    if (patch.defaults.tags) {
      project.defaults.tags = { ...project.defaults.tags, ...patch.defaults.tags };
    }
  }

  // Merge other top-level keys
  for (const key of ['name', 'currentPlan', 'session']) {
    if (patch[key] !== undefined) project[key] = patch[key];
  }

  project.updatedAt = new Date().toISOString();
  writeProject(project);
  return project;
}

/** Delete a project */
export function deleteProject(id) {
  const file = projectFile(id);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return true;
  }
  return false;
}

/* ── Deployments ─────────────────────────────────────────────────────────────── */

/** Get the next version number for a project */
export function getNextVersion(id) {
  const project = readProject(id);
  if (!project) return 1;
  return (project.deployments?.length || 0) + 1;
}

/** Add a deployment record to a project (prepends — newest first) */
export function addDeployment(id, deploymentRecord) {
  const project = readProject(id);
  if (!project) throw new Error(`Project "${id}" not found`);

  const version = getNextVersion(id);
  const record = {
    version,
    ...deploymentRecord,
    timestamp: deploymentRecord.timestamp || new Date().toISOString(),
  };

  project.deployments.unshift(record);
  project.updatedAt = new Date().toISOString();
  writeProject(project);
  return record;
}

/** Get deployments for a project */
export function getDeployments(id) {
  const project = readProject(id);
  if (!project) return [];
  return project.deployments || [];
}

/* ── Session persistence ─────────────────────────────────────────────────────── */

/** Save session state to a project */
export function saveProjectSession(id, sessionData) {
  const project = readProject(id);
  if (!project) return false;

  // Only persist the serialisable parts of the session
  project.session = {
    state: sessionData.state,
    service: sessionData.service,
    schemaIdx: sessionData.schemaIdx,
    collected: sessionData.collected,
    plan: sessionData.plan,
    model: sessionData.model,
    messages: (sessionData.messages || []).slice(-50), // Keep last 50 messages
  };

  project.currentPlan = sessionData.plan || [];
  project.updatedAt = new Date().toISOString();
  writeProject(project);
  return true;
}

/** Load session state from a project */
export function loadProjectSession(id) {
  const project = readProject(id);
  if (!project?.session) return null;
  return project.session;
}
