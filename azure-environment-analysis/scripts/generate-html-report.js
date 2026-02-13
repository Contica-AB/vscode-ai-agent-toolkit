#!/usr/bin/env node

/**
 * Generate Interactive HTML Report
 *
 * Reads all markdown/JSON output files from an assessment and compiles them
 * into a single self-contained interactive HTML report with tabbed navigation.
 *
 * Usage:
 *   node scripts/generate-html-report.js <client-name> <date>
 *   npm run report -- <client-name> <date>
 *
 * Example:
 *   node scripts/generate-html-report.js acme-corp 2026-02-12
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, basename, extname, relative } from 'path';
import { marked } from 'marked';

// ─── Color Scheme ───────────────────────────────────────────────────────────
const COLORS = {
  plum: '#401938',
  salmon: '#f58962',
  forest: '#193837',
  beige: '#e1d1c1',
  pink: '#f79299',
  tomato: '#d93b0b',
};

// ─── File Discovery Order ───────────────────────────────────────────────────
const SECTION_ORDER = [
  { id: 'reports', label: 'Reports', icon: '&#128196;' },
  { id: 'inventory', label: 'Inventory', icon: '&#128203;' },
  { id: 'analysis', label: 'Analysis', icon: '&#128269;' },
  { id: 'logic-apps', label: 'Logic Apps', icon: '&#9881;' },
];

const FILE_PRIORITY = {
  'current-state-assessment.md': 1,
  'improvement-opportunities.md': 2,
  'opportunity-summary.md': 3,
  'summary.md': 1,
  'resources.json': 2,
  'preflight-validation.md': 1,
  'security-audit.md': 2,
  'failure-analysis.md': 3,
  'service-bus-analysis.md': 4,
  'function-apps-analysis.md': 5,
  'apim-analysis.md': 6,
  'supporting-services-analysis.md': 7,
  'connector-inventory.md': 8,
  'dead-flows.md': 9,
  'monitoring-gaps.md': 10,
  'naming-tagging.md': 11,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function humanize(filename) {
  return filename
    .replace(/\.[^.]+$/, '')          // remove extension
    .replace(/[-_]/g, ' ')            // dashes/underscores to spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // title case
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dir, section) {
  const files = [];
  if (!(await exists(dir))) return files;

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) continue; // handled separately for logic-apps
    const ext = extname(entry.name).toLowerCase();
    if (ext !== '.md' && ext !== '.json') continue;

    const content = await readFile(fullPath, 'utf-8');
    files.push({
      name: entry.name,
      label: humanize(entry.name),
      section,
      path: fullPath,
      content,
      ext,
      priority: FILE_PRIORITY[entry.name] || 50,
    });
  }

  files.sort((a, b) => a.priority - b.priority);
  return files;
}

function renderContent(file) {
  if (file.ext === '.json') {
    try {
      const formatted = JSON.stringify(JSON.parse(file.content), null, 2);
      return `<pre class="json-block"><code>${escapeHtml(formatted)}</code></pre>`;
    } catch {
      return `<pre class="json-block"><code>${escapeHtml(file.content)}</code></pre>`;
    }
  }
  return marked.parse(file.content);
}

// ─── HTML Template ──────────────────────────────────────────────────────────

function generateHtml(client, date, sections) {
  const allTabs = sections.flatMap(s => s.files);
  const firstTabId = allTabs.length > 0 ? `tab-0` : '';

  const navItems = sections
    .filter(s => s.files.length > 0)
    .map(section => {
      const items = section.files
        .map((file, _idx) => {
          const globalIdx = allTabs.indexOf(file);
          return `<button class="nav-item${globalIdx === 0 ? ' active' : ''}" data-tab="tab-${globalIdx}" title="${escapeHtml(file.label)}">${escapeHtml(file.label)}</button>`;
        })
        .join('\n            ');
      return `
          <div class="nav-group">
            <div class="nav-group-header">${section.icon} ${escapeHtml(section.label)}</div>
            ${items}
          </div>`;
    })
    .join('\n');

  const panels = allTabs
    .map((file, idx) => {
      const html = renderContent(file);
      return `
        <div id="tab-${idx}" class="panel${idx === 0 ? ' active' : ''}">
          <div class="panel-header">
            <span class="panel-badge">${escapeHtml(file.section)}</span>
            <h2 class="panel-title">${escapeHtml(file.label)}</h2>
          </div>
          <div class="panel-body">${html}</div>
        </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Report — ${escapeHtml(client)} — ${escapeHtml(date)}</title>
  <style>
    /* ── Reset & Base ─────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 15px; scroll-behavior: smooth; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: ${COLORS.beige};
      color: ${COLORS.forest};
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* ── Header ───────────────────────────────────────────── */
    .header {
      background: linear-gradient(135deg, ${COLORS.plum}, ${COLORS.forest});
      color: #fff;
      padding: 1.4rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      box-shadow: 0 2px 12px rgba(0,0,0,.25);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header h1 { font-size: 1.35rem; font-weight: 600; letter-spacing: -.01em; }
    .header .meta { font-size: .85rem; opacity: .85; }
    .header .meta span { margin-right: 1.5rem; }
    .header-actions { display: flex; gap: .5rem; }
    .header-actions button {
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.25);
      color: #fff;
      padding: .45rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: .82rem;
      transition: background .2s;
    }
    .header-actions button:hover { background: ${COLORS.salmon}; border-color: ${COLORS.salmon}; }

    /* ── Layout ────────────────────────────────────────────── */
    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Sidebar ───────────────────────────────────────────── */
    .sidebar {
      width: 280px;
      min-width: 280px;
      background: ${COLORS.forest};
      color: ${COLORS.beige};
      overflow-y: auto;
      padding: .5rem 0;
      flex-shrink: 0;
      border-right: 3px solid ${COLORS.plum};
    }
    .nav-group { margin-bottom: .25rem; }
    .nav-group-header {
      padding: .65rem 1.2rem .4rem;
      font-size: .7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: ${COLORS.salmon};
      user-select: none;
    }
    .nav-item {
      display: block;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      color: ${COLORS.beige};
      padding: .5rem 1.2rem .5rem 1.6rem;
      font-size: .85rem;
      cursor: pointer;
      transition: background .15s, color .15s, border-left .15s;
      border-left: 3px solid transparent;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-item:hover {
      background: rgba(255,255,255,.08);
      color: #fff;
    }
    .nav-item.active {
      background: rgba(245,137,98,.12);
      color: ${COLORS.salmon};
      border-left-color: ${COLORS.salmon};
      font-weight: 600;
    }

    /* ── Main Content ──────────────────────────────────────── */
    .main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem 2.5rem;
      max-height: calc(100vh - 68px);
    }

    .panel { display: none; }
    .panel.active { display: block; animation: fadeIn .25s ease; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    .panel-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${COLORS.plum}22;
    }
    .panel-badge {
      display: inline-block;
      background: ${COLORS.plum};
      color: #fff;
      padding: .15rem .6rem;
      border-radius: 4px;
      font-size: .7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: .4rem;
    }
    .panel-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${COLORS.plum};
    }

    /* ── Markdown Content Styles ───────────────────────────── */
    .panel-body h1 { font-size: 1.6rem; color: ${COLORS.plum}; margin: 1.8rem 0 .8rem; font-weight: 700; }
    .panel-body h2 { font-size: 1.3rem; color: ${COLORS.plum}; margin: 1.6rem 0 .7rem; font-weight: 600; border-bottom: 1px solid ${COLORS.plum}22; padding-bottom: .3rem; }
    .panel-body h3 { font-size: 1.1rem; color: ${COLORS.forest}; margin: 1.3rem 0 .5rem; font-weight: 600; }
    .panel-body h4 { font-size: 1rem; color: ${COLORS.forest}; margin: 1rem 0 .4rem; font-weight: 600; }
    .panel-body p { margin: .6rem 0; line-height: 1.65; }
    .panel-body ul, .panel-body ol { margin: .5rem 0 .5rem 1.5rem; line-height: 1.65; }
    .panel-body li { margin: .25rem 0; }
    .panel-body a { color: ${COLORS.tomato}; text-decoration: none; border-bottom: 1px solid ${COLORS.tomato}44; transition: border-color .2s; }
    .panel-body a:hover { border-bottom-color: ${COLORS.tomato}; }
    .panel-body strong { color: ${COLORS.plum}; }
    .panel-body blockquote {
      border-left: 4px solid ${COLORS.salmon};
      background: ${COLORS.salmon}12;
      padding: .7rem 1rem;
      margin: .8rem 0;
      border-radius: 0 6px 6px 0;
    }
    .panel-body hr { border: none; border-top: 1px solid ${COLORS.plum}18; margin: 1.5rem 0; }

    /* ── Tables ────────────────────────────────────────────── */
    .panel-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: .88rem;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    .panel-body thead th {
      background: ${COLORS.plum};
      color: #fff;
      padding: .6rem .8rem;
      text-align: left;
      font-weight: 600;
      font-size: .8rem;
      text-transform: uppercase;
      letter-spacing: .03em;
    }
    .panel-body tbody td {
      padding: .55rem .8rem;
      border-bottom: 1px solid ${COLORS.beige};
    }
    .panel-body tbody tr:nth-child(even) { background: ${COLORS.pink}0D; }
    .panel-body tbody tr:hover { background: ${COLORS.salmon}15; }

    /* ── Code Blocks ───────────────────────────────────────── */
    .panel-body code {
      background: ${COLORS.forest}0D;
      padding: .15rem .4rem;
      border-radius: 3px;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: .88em;
      color: ${COLORS.tomato};
    }
    .panel-body pre {
      background: ${COLORS.forest};
      color: ${COLORS.beige};
      padding: 1rem 1.2rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: .8rem 0;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
      line-height: 1.5;
    }
    .panel-body pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: .85rem;
    }
    .json-block {
      background: ${COLORS.forest};
      color: ${COLORS.beige};
      padding: 1rem 1.2rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: .8rem 0;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: .82rem;
      line-height: 1.5;
      max-height: 80vh;
    }
    .json-block code { background: none; color: inherit; padding: 0; }

    /* ── Checkboxes ────────────────────────────────────────── */
    .panel-body input[type="checkbox"] { margin-right: .4rem; accent-color: ${COLORS.salmon}; }

    /* ── Search ────────────────────────────────────────────── */
    .search-box {
      padding: .6rem 1rem;
      margin: 0;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .search-box input {
      width: 100%;
      padding: .45rem .7rem;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 5px;
      background: rgba(255,255,255,.08);
      color: ${COLORS.beige};
      font-size: .82rem;
      outline: none;
      transition: border-color .2s;
    }
    .search-box input::placeholder { color: rgba(225,209,193,.45); }
    .search-box input:focus { border-color: ${COLORS.salmon}; background: rgba(255,255,255,.12); }

    /* ── Severity Badges (auto-detected) ───────────────────── */
    .panel-body .severity-high { color: ${COLORS.tomato}; font-weight: 700; }
    .panel-body .severity-medium { color: ${COLORS.salmon}; font-weight: 600; }
    .panel-body .severity-low { color: ${COLORS.forest}; font-weight: 600; }

    /* ── Print Styles ──────────────────────────────────────── */
    @media print {
      .header { position: static; }
      .sidebar { display: none; }
      .main { max-height: none; padding: 1rem; }
      .panel { display: block !important; page-break-after: always; }
      .panel-body pre { white-space: pre-wrap; word-break: break-all; }
    }

    /* ── Responsive ────────────────────────────────────────── */
    @media (max-width: 900px) {
      .sidebar { width: 220px; min-width: 220px; }
      .main { padding: 1.2rem; }
    }
    @media (max-width: 650px) {
      .layout { flex-direction: column; }
      .sidebar {
        width: 100%; min-width: 100%;
        max-height: 50vh;
        border-right: none;
        border-bottom: 3px solid ${COLORS.plum};
      }
      .main { max-height: none; }
    }

    /* ── Scroll indicator ──────────────────────────────────── */
    .main::-webkit-scrollbar { width: 8px; }
    .main::-webkit-scrollbar-track { background: ${COLORS.beige}; }
    .main::-webkit-scrollbar-thumb { background: ${COLORS.plum}44; border-radius: 4px; }
    .main::-webkit-scrollbar-thumb:hover { background: ${COLORS.plum}88; }
    .sidebar::-webkit-scrollbar { width: 6px; }
    .sidebar::-webkit-scrollbar-track { background: transparent; }
    .sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }

    /* ── Empty state ───────────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: ${COLORS.forest}88;
    }
    .empty-state h2 { font-size: 1.3rem; margin-bottom: .5rem; }

    /* ── Tab counter badge ─────────────────────────────────── */
    .tab-count {
      display: inline-block;
      background: ${COLORS.salmon};
      color: #fff;
      font-size: .65rem;
      font-weight: 700;
      padding: .1rem .4rem;
      border-radius: 10px;
      margin-left: .4rem;
      vertical-align: middle;
    }
  </style>
</head>
<body>

  <!-- ── Header ──────────────────────────────────────────── -->
  <header class="header">
    <div class="header-left">
      <div>
        <h1>Azure Integration Services Assessment</h1>
        <div class="meta">
          <span><strong>Client:</strong> ${escapeHtml(client)}</span>
          <span><strong>Date:</strong> ${escapeHtml(date)}</span>
          <span><strong>Documents:</strong> ${allTabs.length}</span>
        </div>
      </div>
    </div>
    <div class="header-actions">
      <button onclick="expandAll()">Show All</button>
      <button onclick="window.print()">Print / PDF</button>
    </div>
  </header>

  <!-- ── Layout ──────────────────────────────────────────── -->
  <div class="layout">

    <!-- ── Sidebar Navigation ──────────────────────────────── -->
    <nav class="sidebar" id="sidebar">
      <div class="search-box">
        <input type="text" id="search" placeholder="Search documents..." autocomplete="off" />
      </div>
      ${navItems}
    </nav>

    <!-- ── Content Panels ──────────────────────────────────── -->
    <main class="main" id="main">
      ${allTabs.length > 0 ? panels : '<div class="empty-state"><h2>No documents found</h2><p>Run the assessment phases first to generate output files.</p></div>'}
    </main>

  </div>

  <!-- ── Script ──────────────────────────────────────────── -->
  <script>
    // Tab switching
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        // Deactivate all
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        // Activate selected
        btn.classList.add('active');
        const panel = document.getElementById(btn.dataset.tab);
        if (panel) panel.classList.add('active');
        // Scroll main to top
        document.getElementById('main').scrollTop = 0;
      });
    });

    // Search / filter
    document.getElementById('search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.nav-item').forEach(btn => {
        const match = btn.textContent.toLowerCase().includes(q);
        btn.style.display = match ? '' : 'none';
      });
      // Show/hide group headers based on whether any children visible
      document.querySelectorAll('.nav-group').forEach(group => {
        const anyVisible = [...group.querySelectorAll('.nav-item')].some(b => b.style.display !== 'none');
        group.style.display = anyVisible ? '' : 'none';
      });
    });

    // Show All (for print)
    function expandAll() {
      document.querySelectorAll('.panel').forEach(p => p.classList.add('active'));
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('search').focus();
      }
      if (e.key === 'Escape') {
        document.getElementById('search').value = '';
        document.getElementById('search').dispatchEvent(new Event('input'));
        document.getElementById('search').blur();
      }
    });
  </script>

</body>
</html>`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('\nUsage: node scripts/generate-html-report.js <client-name> <date>');
    console.error('Example: node scripts/generate-html-report.js acme-corp 2026-02-12\n');
    process.exit(1);
  }

  const [clientName, date] = args;
  const outputRoot = join(process.cwd(), 'output', clientName, date);

  if (!(await exists(outputRoot))) {
    console.error(`\nError: Output directory not found: ${outputRoot}`);
    console.error('Run the assessment phases first to generate output files.\n');
    process.exit(1);
  }

  console.log(`\nGenerating HTML report for "${clientName}" (${date})...`);

  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  // Collect files by section
  const sections = [];

  // Reports
  const reportsDir = join(outputRoot, 'reports');
  const reportFiles = await collectFiles(reportsDir, 'Reports');
  if (reportFiles.length > 0) {
    sections.push({ ...SECTION_ORDER[0], files: reportFiles });
  }

  // Inventory
  const inventoryDir = join(outputRoot, 'inventory');
  const inventoryFiles = await collectFiles(inventoryDir, 'Inventory');
  if (inventoryFiles.length > 0) {
    sections.push({ ...SECTION_ORDER[1], files: inventoryFiles });
  }

  // Analysis (excluding logic-apps subfolder)
  const analysisDir = join(outputRoot, 'analysis');
  const analysisFiles = await collectFiles(analysisDir, 'Analysis');
  if (analysisFiles.length > 0) {
    sections.push({ ...SECTION_ORDER[2], files: analysisFiles });
  }

  // Logic Apps (individual files)
  const logicAppsDir = join(outputRoot, 'analysis', 'logic-apps');
  const logicAppFiles = await collectFiles(logicAppsDir, 'Logic Apps');
  if (logicAppFiles.length > 0) {
    // Sort alphabetically for logic apps
    logicAppFiles.sort((a, b) => a.name.localeCompare(b.name));
    sections.push({ ...SECTION_ORDER[3], files: logicAppFiles });
  }

  const totalFiles = sections.reduce((sum, s) => sum + s.files.length, 0);
  console.log(`  Found ${totalFiles} documents across ${sections.length} sections:`);
  for (const s of sections) {
    console.log(`    ${s.label}: ${s.files.length} files`);
  }

  // Generate HTML
  const html = generateHtml(clientName, date, sections);

  // Write output
  const reportsOutputDir = join(outputRoot, 'reports');
  await mkdir(reportsOutputDir, { recursive: true });
  const outputFile = join(reportsOutputDir, 'assessment-report.html');
  await writeFile(outputFile, html, 'utf-8');

  console.log(`\n  Report saved to: ${relative(process.cwd(), outputFile)}`);
  console.log(`  Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
  console.log(`\n  Open in a browser to view the interactive report.\n`);
}

main().catch(err => {
  console.error('Error generating report:', err.message);
  process.exit(1);
});
