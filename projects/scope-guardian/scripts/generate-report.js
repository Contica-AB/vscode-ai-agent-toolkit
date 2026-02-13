/**
 * Generate Interactive HTML Report
 *
 * Compiles all markdown files from a classification session into a single
 * offline interactive HTML report with tabbed navigation.
 *
 * Usage: npm run report -- [client-name] [date]
 * Example: npm run report -- acme-corp 2026-02-13
 */

const fs = require("fs");
const path = require("path");

// Color scheme
const colors = {
  plum: "#401938",
  salmon: "#f58962",
  forest: "#193837",
  beige: "#e1d1c1",
  pink: "#f79299",
  tomato: "#d93b0b",
};

// Simple markdown to HTML converter (no external dependencies)
function markdownToHtml(markdown) {
  let html = markdown;

  // Escape HTML entities first (but preserve our conversions)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block" data-lang="${lang}"><code>${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(/^&gt;\s+(.*)$/gm, "<blockquote>$1</blockquote>");

  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank">$1</a>',
  );

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr>");

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split("|").map((cell) => cell.trim());
    const isHeader = cells.every((cell) => /^[-:]+$/.test(cell));
    if (isHeader) return ""; // Skip separator row
    const cellTags = cells.map((cell) => `<td>${cell}</td>`).join("");
    return `<tr>${cellTags}</tr>`;
  });

  // Wrap consecutive table rows
  html = html.replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
    // Make first row header
    const rows = match
      .trim()
      .split("\n")
      .filter((r) => r.trim());
    if (rows.length > 0) {
      rows[0] = rows[0].replace(/<td>/g, "<th>").replace(/<\/td>/g, "</th>");
    }
    return `<table>${rows.join("\n")}</table>`;
  });

  // Unordered lists
  html = html.replace(/^[\-\*]\s+(.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, "<ul>$&</ul>");

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, "<li>$1</li>");

  // Checkboxes
  html = html.replace(/☐/g, '<span class="checkbox unchecked">☐</span>');
  html = html.replace(/☑/g, '<span class="checkbox checked">☑</span>');
  html = html.replace(/\[x\]/gi, '<span class="checkbox checked">☑</span>');
  html = html.replace(/\[ \]/g, '<span class="checkbox unchecked">☐</span>');

  // Paragraphs (wrap loose text)
  html = html
    .split("\n\n")
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (block.startsWith("<")) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

// Get document title from filename or first heading
function getDocumentTitle(filename, content) {
  // Try to get from first h1
  const h1Match = content.match(/^#\s+(.*)$/m);
  if (h1Match) return h1Match[1];

  // Otherwise use filename
  return filename
    .replace(".md", "")
    .replace(/-/g, " ")
    .replace(/^\d+/, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Generate HTML template
function generateHtmlReport(documents, clientName, date) {
  const tabs = documents
    .map((doc, index) => {
      const activeClass = index === 0 ? "active" : "";
      return `<button class="tab ${activeClass}" data-tab="${doc.id}">${doc.title}</button>`;
    })
    .join("\n        ");

  const contents = documents
    .map((doc, index) => {
      const activeClass = index === 0 ? "active" : "";
      return `
      <div class="tab-content ${activeClass}" id="${doc.id}">
        <div class="document-info">
          <span class="filename">${doc.filename}</span>
        </div>
        <div class="markdown-content">
          ${doc.html}
        </div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scope Guardian Report - ${clientName} - ${date}</title>
  <style>
    :root {
      --plum: ${colors.plum};
      --salmon: ${colors.salmon};
      --forest: ${colors.forest};
      --beige: ${colors.beige};
      --pink: ${colors.pink};
      --tomato: ${colors.tomato};
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--beige);
      color: var(--plum);
      line-height: 1.6;
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, var(--plum) 0%, var(--forest) 100%);
      color: var(--beige);
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .header .meta {
      font-size: 0.9rem;
      opacity: 0.9;
    }
    
    .header .logo {
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--salmon);
    }
    
    /* Tab Navigation */
    .tab-nav {
      background: var(--plum);
      padding: 0 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      border-bottom: 3px solid var(--salmon);
    }
    
    .tab {
      background: transparent;
      border: none;
      color: var(--beige);
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      border-radius: 8px 8px 0 0;
      opacity: 0.7;
    }
    
    .tab:hover {
      background: rgba(255,255,255,0.1);
      opacity: 1;
    }
    
    .tab.active {
      background: var(--salmon);
      color: var(--plum);
      opacity: 1;
      font-weight: 600;
    }
    
    /* Tab Content */
    .tab-content {
      display: none;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease;
    }
    
    .tab-content.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .document-info {
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(64, 25, 56, 0.2);
    }
    
    .filename {
      font-size: 0.8rem;
      color: var(--forest);
      font-family: monospace;
    }
    
    /* Markdown Content Styles */
    .markdown-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .markdown-content h1 {
      color: var(--plum);
      border-bottom: 3px solid var(--salmon);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1.8rem;
    }
    
    .markdown-content h2 {
      color: var(--forest);
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 1.4rem;
      border-left: 4px solid var(--salmon);
      padding-left: 0.75rem;
    }
    
    .markdown-content h3 {
      color: var(--plum);
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      font-size: 1.15rem;
    }
    
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      color: var(--forest);
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .markdown-content p {
      margin-bottom: 1rem;
    }
    
    .markdown-content a {
      color: var(--salmon);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }
    
    .markdown-content a:hover {
      border-bottom-color: var(--salmon);
    }
    
    .markdown-content ul, .markdown-content ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    
    .markdown-content li {
      margin-bottom: 0.25rem;
    }
    
    .markdown-content blockquote {
      border-left: 4px solid var(--pink);
      background: rgba(247, 146, 153, 0.1);
      padding: 0.75rem 1rem;
      margin: 1rem 0;
      font-style: italic;
    }
    
    .markdown-content hr {
      border: none;
      border-top: 2px solid var(--beige);
      margin: 1.5rem 0;
    }
    
    /* Code */
    .inline-code {
      background: rgba(64, 25, 56, 0.1);
      color: var(--tomato);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.9em;
    }
    
    .code-block {
      background: var(--forest);
      color: var(--beige);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    
    .code-block code {
      color: inherit;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }
    
    th {
      background: var(--plum);
      color: var(--beige);
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--beige);
    }
    
    tr:nth-child(even) {
      background: rgba(225, 209, 193, 0.3);
    }
    
    tr:hover {
      background: rgba(245, 137, 98, 0.1);
    }
    
    /* Classification badges */
    .markdown-content strong {
      color: var(--plum);
    }
    
    /* Checkboxes */
    .checkbox {
      font-size: 1.1em;
      margin-right: 0.25rem;
    }
    
    .checkbox.checked {
      color: var(--forest);
    }
    
    .checkbox.unchecked {
      color: var(--pink);
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 1.5rem;
      color: var(--forest);
      font-size: 0.85rem;
      border-top: 1px solid rgba(64, 25, 56, 0.1);
      margin-top: 2rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }
      
      .tab-nav {
        justify-content: center;
      }
      
      .tab {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }
      
      .tab-content {
        padding: 1rem;
      }
      
      .markdown-content {
        padding: 1rem;
      }
    }
    
    /* Print styles */
    @media print {
      .tab-nav { display: none; }
      .tab-content { display: block !important; }
      .tab-content { page-break-before: always; }
      .header { background: white; color: var(--plum); }
    }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <span class="logo">🛡️ SCOPE GUARDIAN</span>
      <h1>Classification Report</h1>
    </div>
    <div class="meta">
      <div><strong>Client:</strong> ${clientName}</div>
      <div><strong>Date:</strong> ${date}</div>
      <div><strong>Documents:</strong> ${documents.length}</div>
    </div>
  </header>
  
  <nav class="tab-nav">
    ${tabs}
  </nav>
  
  <main>
    ${contents}
  </main>
  
  <footer class="footer">
    Generated by Scope Guardian • ${new Date().toISOString().split("T")[0]}
  </footer>
  
  <script>
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active from all
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const tabs = Array.from(document.querySelectorAll('.tab'));
      const activeIndex = tabs.findIndex(t => t.classList.contains('active'));
      
      if (e.key === 'ArrowRight' && activeIndex < tabs.length - 1) {
        tabs[activeIndex + 1].click();
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        tabs[activeIndex - 1].click();
      }
    });
  </script>
</body>
</html>`;
}

// Main function
function generateReport() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Scope Guardian - HTML Report Generator\n");
    console.log("Usage: npm run report -- <client-name> <date>");
    console.log("Example: npm run report -- acme-corp 2026-02-13\n");

    // List available clients and dates
    const outputDir = path.join(__dirname, "..", "output");
    if (fs.existsSync(outputDir)) {
      const clients = fs.readdirSync(outputDir).filter((f) => {
        const stat = fs.statSync(path.join(outputDir, f));
        return stat.isDirectory() && !f.startsWith(".");
      });

      if (clients.length > 0) {
        console.log("Available clients:");
        clients.forEach((client) => {
          const clientDir = path.join(outputDir, client);
          const dates = fs.readdirSync(clientDir).filter((f) => {
            return /^\d{4}-\d{2}-\d{2}$/.test(f);
          });
          if (dates.length > 0) {
            console.log(`  ${client}: ${dates.join(", ")}`);
          } else {
            console.log(`  ${client}: (no dated folders)`);
          }
        });
      }
    }
    return;
  }

  const clientName = args[0];
  const date = args[1];

  // Find markdown files
  const baseDir = path.join(__dirname, "..", "output", clientName, date);

  if (!fs.existsSync(baseDir)) {
    console.error(`Error: Directory not found: ${baseDir}`);
    console.error("\nMake sure you have classification outputs in:");
    console.error(`  output/${clientName}/${date}/`);
    process.exit(1);
  }

  // Collect all markdown files from the date folder
  const documents = [];

  function collectMarkdownFiles(dir, prefix = "") {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        collectMarkdownFiles(filePath, prefix + file + "/");
      } else if (file.endsWith(".md")) {
        const content = fs.readFileSync(filePath, "utf8");
        const relativePath = prefix + file;
        const id = relativePath.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

        documents.push({
          id: id,
          filename: relativePath,
          title: getDocumentTitle(file, content),
          content: content,
          html: markdownToHtml(content),
        });
      }
    }
  }

  collectMarkdownFiles(baseDir);

  if (documents.length === 0) {
    console.error(`Error: No markdown files found in ${baseDir}`);
    process.exit(1);
  }

  // Sort documents (classification reports first, then alphabetically)
  documents.sort((a, b) => {
    // Classification reports first
    if (a.filename.includes("classification")) return -1;
    if (b.filename.includes("classification")) return 1;
    return a.filename.localeCompare(b.filename);
  });

  console.log(`Found ${documents.length} documents:`);
  documents.forEach((doc) =>
    console.log(`  - ${doc.filename} → "${doc.title}"`),
  );

  // Generate HTML
  const html = generateHtmlReport(documents, clientName, date);

  // Write output
  const outputPath = path.join(baseDir, "classification-report.html");
  fs.writeFileSync(outputPath, html);

  console.log(`\n✓ Report generated: ${outputPath}`);
  console.log("\nOpen in browser to view the interactive report.");
}

generateReport();
