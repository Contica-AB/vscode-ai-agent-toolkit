import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PORT, OLLAMA_MODEL, OLLAMA_URL } from './lib/config.js';
import azureRoutes  from './routes/azure.js';
import ollamaRoutes from './routes/ollama.js';
import chatRoutes   from './routes/chat.js';
import deployRoutes from './routes/deploy.js';
import sessionRoutes from './routes/session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── Mount routes ─────────────────────────────────────────────────────────────
app.use('/api/azure',  azureRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use('/api/chat',   chatRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api',        sessionRoutes);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   DeploX Chatbot  v0.01                  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n  🌐  http://localhost:${PORT}`);
  console.log(`  🤖  Model : ${OLLAMA_MODEL}`);
  console.log(`  🔗  Ollama: ${OLLAMA_URL}\n`);
});
