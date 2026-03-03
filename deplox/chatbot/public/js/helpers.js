import { chatWrap } from './state.js';

export function scrollBottom() {
  chatWrap.scrollTop = chatWrap.scrollHeight;
}

/** Markdown-lite renderer */
export function renderMd(text) {
  text = text.replace(/DEPLOY_CONFIG:\s*\{[\s\S]*?\}(?=\s*$|\n\s*[^}\s])/g, '');
  text = text.replace(/CHOICES:\[.*?\]/g, '');
  return text.trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

/** Model label — inferred from name, works for any installed model */
export function modelLabel(m) {
  const name = m.toLowerCase();
  const sizeMatch = name.match(/:?(\d+(?:\.\d+)?)\s*b\b/);
  const sizeB = sizeMatch ? parseFloat(sizeMatch[1]) : null;
  let hint = '';
  if (sizeB !== null) {
    if (sizeB <= 2)       hint = 'Fastest · very light';
    else if (sizeB <= 4)  hint = 'Fast · light';
    else if (sizeB <= 9)  hint = 'Balanced · good quality';
    else if (sizeB <= 20) hint = 'High quality · slower';
    else                  hint = 'Best quality · requires strong hardware';
  }
  return hint ? `${m}  —  ${hint}` : m;
}
