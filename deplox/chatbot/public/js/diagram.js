/** Diagram rendering module — uses Mermaid.js loaded from CDN */

let mermaidReady = false;
let mermaidInitialized = false;

/** Initialize mermaid with dark theme (call once after script loads) */
function initMermaid() {
  if (mermaidInitialized) return;
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor:       '#2563eb',
      primaryTextColor:   '#e2e8f0',
      primaryBorderColor: '#3b82f6',
      lineColor:          '#64748b',
      secondaryColor:     '#1e2235',
      tertiaryColor:      '#161925',
      background:         '#0d0f17',
      mainBkg:            '#1e2235',
      nodeBorder:         '#3b82f6',
      clusterBkg:         '#161925',
      clusterBorder:      '#2a2f45',
      titleColor:         '#e2e8f0',
      edgeLabelBackground:'#161925',
    },
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
      curve: 'basis',
    },
    securityLevel: 'loose',
  });
  mermaidInitialized = true;
  mermaidReady = true;
}

/** Render a Mermaid diagram into a container element.
 *  Returns the SVG element on success, or null on failure (with fallback text shown).
 */
export async function renderDiagram(mermaidSyntax, container) {
  if (!container || !mermaidSyntax) return null;

  initMermaid();

  if (!mermaidReady) {
    container.innerHTML = `<pre class="diagram-fallback">${escapeHtml(mermaidSyntax)}</pre>`;
    return null;
  }

  try {
    const id = `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { svg } = await mermaid.render(id, mermaidSyntax);
    container.innerHTML = svg;

    // Make SVG responsive
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.style.maxWidth = '100%';
      svgEl.style.height = 'auto';
    }
    return svgEl;
  } catch (err) {
    console.warn('[diagram] Mermaid render failed:', err);
    container.innerHTML = `<pre class="diagram-fallback">${escapeHtml(mermaidSyntax)}</pre>`;
    return null;
  }
}

/** Show/hide the diagram panel */
export function showDiagramPanel(mermaidSyntax) {
  const panel = document.getElementById('diagram-panel');
  const content = document.getElementById('diagram-content');
  if (!panel || !content) return;

  if (!mermaidSyntax) {
    panel.classList.remove('open');
    return;
  }

  panel.classList.add('open');
  renderDiagram(mermaidSyntax, content);
}

/** Render an inline diagram inside a chat bubble */
export async function renderInlineDiagram(mermaidSyntax, parentElement) {
  if (!mermaidSyntax || !parentElement) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'diagram-inline';
  parentElement.appendChild(wrapper);

  await renderDiagram(mermaidSyntax, wrapper);

  // Add expand button
  const expandBtn = document.createElement('button');
  expandBtn.className = 'diagram-expand-btn';
  expandBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg> Expand';
  expandBtn.onclick = () => showDiagramPanel(mermaidSyntax);
  wrapper.appendChild(expandBtn);
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
