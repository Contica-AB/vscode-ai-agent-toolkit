// ── Shared mutable state ──────────────────────────────────────────────────────
export let sessionId   = Math.random().toString(36).slice(2);
sessionStorage.setItem('il_session', sessionId);

export let activeModel = localStorage.getItem('deplox_model') || '';
export let isStreaming  = false;
export let pendingConfig = null;
export let activeProjectId = localStorage.getItem('deplox_active_project') || null;

// Setters (ES module exports are live bindings — changes are visible everywhere)
export function setSessionId(id)     { sessionId = id; sessionStorage.setItem('il_session', id); }
export function setActiveModel(model) { activeModel = model; }
export function setStreaming(val)     { isStreaming = val; }
export function setPendingConfig(cfg) { pendingConfig = cfg; }
export function setActiveProjectId(id) {
  activeProjectId = id;
  if (id) localStorage.setItem('deplox_active_project', id);
  else localStorage.removeItem('deplox_active_project');
}

// ── DOM refs ─────────────────────────────────────────────────────────────────
export const chatWrap = document.getElementById('chat-wrap');
export const input    = document.getElementById('msg-input');
export const sendBtn  = document.getElementById('send-btn');
export const typing   = document.getElementById('typing');
export const terminal = document.getElementById('terminal');
export const termLog  = document.getElementById('term-log');
export const welcome  = document.getElementById('welcome');
