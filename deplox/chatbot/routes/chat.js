import { Router } from 'express';
import { OLLAMA_URL, OLLAMA_MODEL, SYSTEM_PROMPT, LEARN_INTENT_WORDS, LEARN_DOCS } from '../lib/config.js';
import { SERVICE_LABELS } from '../lib/schemas.js';
import { sessions } from '../lib/session.js';
import { sse } from '../lib/sse.js';
import { azJson } from '../lib/azure-cli.js';
import { detectServiceWithAI, extractValueWithAI } from '../lib/ollama.js';
import { BICEP_TEMPLATES, BICEP_FULL, fetchLearnContent } from '../lib/learn.js';
import { estimateMonthlyCost, formatCostEstimate } from '../lib/pricing.js';
import {
  detectService, extractValue, validationError, currentParam,
  buildSchema, inferEnv, buildDirective, choicesForParam,
  buildDeployConfig, makeSummary, makePlanSummary, snapshotToPlan,
  paramLabel, editableChoices, findParamByKey
} from '../lib/state-machine.js';
import { generateMermaid } from '../lib/diagram.js';

const router = Router();

/** Chat — state-machine driven, streams tokens via SSE */
router.post('/', async (req, res) => {
  const { message, sessionId, model } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: 'message and sessionId required' });

  // ── Bootstrap session ──────────────────────────────────────────────────────
  if (!sessions.has(sessionId)) {
    const subs       = azJson(['account', 'list']) || [];
    const defaultSub = subs.find(s => s.isDefault) || subs[0] || null;
    const autoEnv    = inferEnv(defaultSub?.name);

    const preCollected = {};
    if (defaultSub) preCollected.__subscription = defaultSub;
    if (autoEnv)    preCollected.__env           = autoEnv;

    sessions.set(sessionId, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      state:    'start',
      service:  null,
      schema:   [],
      schemaIdx: 0,
      collected: preCollected,
      plan:     [],
      subs
    });
  }

  const session = sessions.get(sessionId);
  if (model) session.model = model;
  const activeModel = session.model || OLLAMA_MODEL;
  const { subs } = session;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // ── State machine: process user message ───────────────────────────────────
  let directive = '';
  let nextChoices = null;
  let useOllamaForRetry = false;

  if (session.state === 'start') {
    // Template explain sentinel: __template_servicebus__ etc.
    if (message.startsWith('__template_')) {
      const svc = message.replace('__template_', '').replace(/__$/, '');
      session.state = 'learning';
      session._learnService = svc;
      const svcLabel = SERVICE_LABELS[svc] || svc;
      const fullBicep = BICEP_FULL[svc] || '(not found)';
      directive = `You are DeploX, an Azure deployment assistant. Explain our ${svcLabel} template to the user in a friendly, guided way. Cover:

1. **Why Bicep** — briefly explain why DeploX uses Bicep (infrastructure-as-code, repeatable, readable, native ARM support)
2. **What our template deploys** — describe each resource created, the SKU or tier we chose and why it is a sensible default
3. **What the user can configure** — for each parameter, say what it controls and why we exposed it (mention default values and any restrictions)
4. **What we kept simple on purpose** — mention any advanced options that were intentionally left out to keep the template focused and reliable
5. **Outputs** — what the template returns after deployment and how you would use those values

Write in a clear, professional tone as if you are a solutions architect explaining your own design choices. Use short paragraphs or bullets — not a raw code dump.

DeploX ${svcLabel} Bicep template (read this to inform your explanation):
\`\`\`bicep
${fullBicep}
\`\`\`

DIRECTIVE: Explain the template above as described — cover Bicep choice, design decisions, parameters, and outputs.`;
    } else {
    // Check for learn intent before trying to deploy
    const lowerMsg = message.toLowerCase();
    const isLearnIntent = LEARN_INTENT_WORDS.some(w => lowerMsg.includes(w))
      && !['deploy','create','set up','provision','spin up','i want to deploy','lets deploy'].some(w => lowerMsg.includes(w));

    if (isLearnIntent || message === '__learn__') {
      session.state = 'learning';
      session._learnService = detectService(message) || null;
      const bicepSnippet = session._learnService ? BICEP_TEMPLATES[session._learnService] : '';
      const templateNote = bicepSnippet
        ? `

DeploX template for this service (Bicep source):
\`\`\`
${bicepSnippet}
\`\`\``
        : '';
      directive = `You are DeploX, an Azure integration services assistant. Answer the user's question about Azure services clearly and professionally. Be concise but thorough. Focus on practical use cases, when to choose this service, and key concepts. If asked about the DeploX template, explain what it deploys based on the Bicep source provided.${templateNote}

DIRECTIVE: Answer the user's question. Do not mention deploying unless the user asks about it.`;
    } else {
    // Try to detect service from first message
    let svc = detectService(message);
    if (!svc) svc = await detectServiceWithAI(message, activeModel);
    if (svc) {
      session._pendingService = svc;
      session.state = 'confirming_service';
      const svcLabel = SERVICE_LABELS[svc] || svc;
      directive = `DIRECTIVE: The user described what they want and you identified it as "${svcLabel}". In 2-3 professional sentences: (1) restate what the user wants to achieve in your own words, (2) confirm that ${svcLabel} is the right Azure service for this need, (3) give one concrete reason why it is a good fit. End by asking if they want to proceed with deploying ${svcLabel}.`;
      nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
    } else {
      directive   = 'DIRECTIVE: Welcome the user and ask what Azure integration service they want to deploy.';
      nextChoices = Object.values(SERVICE_LABELS);
    }
    } // end isLearnIntent else
    } // end __template__ else

  } else if (session.state === 'learning') {
    const lowerMsg = message.toLowerCase();
    const wantsDeploy = message.startsWith('Deploy ') || ['deploy now','yes deploy','i want to deploy','lets deploy','go ahead and deploy'].some(w => lowerMsg.includes(w));
    const svcFromBtn  = message.startsWith('Deploy ') ? detectService(message.replace(/^Deploy\s+/i,'')) : null;

    if (wantsDeploy) {
      const svc = svcFromBtn || session._learnService || detectService(message) || await detectServiceWithAI(message, activeModel);
      if (svc) {
        session._pendingService = svc;
        session.state = 'confirming_service';
        delete session._learnService;
        const svcLabel = SERVICE_LABELS[svc] || svc;
        directive = `DIRECTIVE: The user wants to deploy "${svcLabel}". Confirm your understanding, briefly say why it is a good fit, and ask if they want to proceed.`;
        nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
      } else {
        directive = 'DIRECTIVE: Ask the user which Azure service they would like to deploy.';
        nextChoices = Object.values(SERVICE_LABELS);
      }
    } else {
      const mentionedSvc = detectService(message) || await detectServiceWithAI(message, activeModel);
      if (mentionedSvc) session._learnService = mentionedSvc;
      const svc = session._learnService;
      const svcLabel = svc ? (SERVICE_LABELS[svc] || svc) : null;
      const wantsTemplateExplain = /explain.*template|template.*explain|how.*template.*work|what.*template.*do|explain.*included|included.*template/i.test(message);

      if (wantsTemplateExplain && svc) {
        const fullBicep = BICEP_FULL[svc] || '(not found)';
        directive = `You are DeploX, an Azure deployment assistant. Explain our ${svcLabel} template to the user in a friendly, guided way. Cover:

1. **Why Bicep** — briefly explain why DeploX uses Bicep (infrastructure-as-code, repeatable, readable, native ARM support)
2. **What our template deploys** — describe each resource created, the SKU or tier we chose and why it is a sensible default
3. **What the user can configure** — for each parameter, say what it controls and why we exposed it (mention default values and any restrictions)
4. **What we kept simple on purpose** — mention any advanced options that were intentionally left out to keep the template focused and reliable
5. **Outputs** — what the template returns after deployment and how you would use those values

Write in a clear, professional tone as if you are a solutions architect explaining your own design choices. Use short paragraphs or bullets — not a raw code dump.

DeploX ${svcLabel} Bicep template (read this to inform your explanation):
\`\`\`bicep
${fullBicep}
\`\`\`

DIRECTIVE: Explain the template above as described — cover Bicep choice, design decisions, parameters, and outputs.`;
      } else {
        const docsUrl = svc ? LEARN_DOCS[svc] : null;
        const learnContent = docsUrl ? await fetchLearnContent(docsUrl) : '';
        const bicepSnippet = svc ? BICEP_TEMPLATES[svc] : '';
        const templateNote = bicepSnippet
          ? `\n\nDeploX template (Bicep source):\n\`\`\`\n${bicepSnippet}\n\`\`\``
          : '';
        const learnNote = learnContent
          ? `\n\nFresh content from Microsoft Learn documentation:\n${learnContent}`
          : '';
        session._pendingLearnLink = docsUrl || null;
        directive = `You are DeploX, an Azure integration services assistant. Answer clearly and professionally. Be concise but thorough.${templateNote}${learnNote}

DIRECTIVE: Answer the user's question about Azure services using the documentation and template context above where relevant. Do not push them to deploy.`;
      }
    }

  } else if (session.state === 'confirming_service') {
    const svc      = session._pendingService;
    const svcLabel = SERVICE_LABELS[svc] || svc;
    const msg      = message.toLowerCase();
    const confirmed = msg.includes('yes') || msg.includes('proceed') || msg.includes('go ahead')
                   || msg.includes('deploy') || msg.includes('correct') || msg.includes('right');
    const rejected  = msg.includes('no') || msg.includes('different') || msg.includes('change')
                   || msg.includes('other') || msg.includes('cancel');
    if (confirmed) {
      session.service   = svc;
      session.schema    = buildSchema(svc, session.collected);
      session.schemaIdx = 0;
      session.state     = 'collecting';
      delete session._pendingService;
      const param = currentParam(session);
      directive   = buildDirective(param, subs);
      nextChoices = choicesForParam(param, subs, session);
    } else if (rejected) {
      delete session._pendingService;
      session.state = 'start';
      directive   = 'DIRECTIVE: The user wants to choose a different service. Ask them what Azure service they would like to deploy.';
      nextChoices = Object.values(SERVICE_LABELS);
    } else {
      directive   = `DIRECTIVE: The user's response was unclear. Re-confirm in one sentence: did they mean to deploy "${svcLabel}"? Ask them to confirm yes or choose a different service.`;
      nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
    }

  } else if (session.state === 'collecting') {
    const param = currentParam(session);
    const isFreeText = param && (param.type === 'text' || param.type === 'text_optional' || param.type === 'rg_select');

    const wantsChangeService = message === 'Change service'
      || (!isFreeText && /\b(change service|different service|wrong service|start over|restart|never mind)\b/i.test(message));
    if (wantsChangeService) {
      delete session._pendingService;
      session.service = null; session.schema = []; session.schemaIdx = 0; session.collected = {};
      session.state = 'start';
      directive   = 'DIRECTIVE: The user wants to choose a different Azure service. Acknowledge briefly and ask what they would like to deploy instead.';
      nextChoices = Object.values(SERVICE_LABELS);
    } else {
    const switchSvc = !isFreeText && detectService(message);
    if (switchSvc) {
      session.service   = switchSvc;
      session.schema    = buildSchema(switchSvc, session.collected);
      session.schemaIdx = 0;
    } else {
    if (param) {
      const value   = extractValue(param, message, subs);
      const valErr  = validationError(value);

      if (valErr) {
        directive   = '';
        nextChoices = choicesForParam(param, subs, session);
        param._retryMsg = `❌ Invalid input: ${valErr}\n\nPlease try again — ${param.q}`;
      } else if (value !== null) {
        session.collected[param.key] = value;
        session.schemaIdx++;
        delete param._retryMsg;
        if (param.key === '__rgPick' && value !== '+ Create new') {
          session.collected.__rgName = value;
          if (session.schema[session.schemaIdx]?.key === '__rgName') {
            session.schemaIdx++;
          }
        }
      } else if (param.defaultValue !== undefined && !message.trim()) {
        session.collected[param.key] = String(param.defaultValue);
        session.schemaIdx++;
        delete param._retryMsg;
      } else {
        const aiValue = await extractValueWithAI(param, message, subs, activeModel);
        if (aiValue !== null) {
          session.collected[param.key] = typeof aiValue === 'object' ? aiValue : String(aiValue);
          session.schemaIdx++;
          delete param._retryMsg;
          if (param.key === '__rgPick' && aiValue !== '+ Create new') {
            session.collected.__rgName = aiValue;
            if (session.schema[session.schemaIdx]?.key === '__rgName') session.schemaIdx++;
          }
        }
        else {
          directive = `DIRECTIVE: The user seems unsure. Gently re-ask them for their ${param.label}. Remind them: ${param.q}`;
          nextChoices = choicesForParam(param, subs, session);
          useOllamaForRetry = true;
        }
      }

      const next = currentParam(session);
      if (!next) {
        session.state = 'confirm';
        nextChoices   = ['Yes, deploy', 'Cancel'];
      } else {
        directive   = '';
        nextChoices = choicesForParam(next, subs, session);
      }
    }
    } // end else (not a service switch)
    } // end wantsChangeService else

  } else if (session.state === 'confirm') {
    const lower = message.toLowerCase();
    if (message === 'Change service' || /\b(change service|different service|start over)\b/i.test(lower)) {
      delete session._pendingService;
      session.service = null; session.schema = []; session.schemaIdx = 0;
      // Keep shared infra params when changing service
      const shared = {};
      for (const key of ['__subscription', '__rgPick', '__rgName', '__location', '__env']) {
        if (session.collected[key] !== undefined) shared[key] = session.collected[key];
      }
      session.collected = shared;
      session.state = 'start';
      directive   = 'DIRECTIVE: The user wants to deploy a different Azure service. Ask them what they would like to deploy.';
      nextChoices = Object.values(SERVICE_LABELS);
    } else if (message === 'Edit a setting' || /\b(edit|change|modify|update|fix)\b/i.test(lower)) {
      session.state = 'editing';
      session._editingKey = null;
      nextChoices = editableChoices(session);
    } else if (['yes','ok','go','confirm','sure','proceed','add'].some(k => lower.includes(k))) {
      // Snapshot current service to plan and go to plan_review
      snapshotToPlan(session);
      session.state = 'plan_review';
    } else {
      nextChoices = ['Yes, add to plan', 'Edit a setting', 'Change service'];
    }

  } else if (session.state === 'plan_review') {
    const lower = message.toLowerCase();
    const wantsAdd = lower.includes('add') || lower.includes('another') || lower.includes('more')
                  || lower.includes('also') || lower.includes('next service');
    const wantsDeploy = lower.includes('deploy') || lower.includes('go') || lower.includes('yes')
                     || lower.includes('proceed') || lower.includes('confirm') || lower.includes('launch');
    const wantsRemove = lower.includes('remove') || lower.includes('delete');

    if (wantsRemove && session.plan.length > 0) {
      // Try to find which service to remove
      const svcToRemove = detectService(message);
      if (svcToRemove) {
        const idx = session.plan.findIndex(p => p.service === svcToRemove);
        if (idx >= 0) {
          session.plan.splice(idx, 1);
        }
      } else {
        // Remove the last added
        session.plan.pop();
      }
      if (session.plan.length === 0) {
        session.state = 'start';
        directive = 'DIRECTIVE: The plan is now empty. Ask the user which service they want to deploy.';
        nextChoices = Object.values(SERVICE_LABELS);
      }
      // Otherwise stay in plan_review and the direct text block will render updated plan
    } else if (wantsAdd) {
      session.state = 'start';
      // Try to detect a service from the "add another X" message
      const svc = detectService(message);
      if (svc) {
        session._pendingService = svc;
        session.state = 'confirming_service';
        const svcLabel = SERVICE_LABELS[svc] || svc;
        directive = `DIRECTIVE: The user wants to add "${svcLabel}" to their deployment plan. Confirm your understanding in 1-2 professional sentences and ask if they want to proceed with configuring ${svcLabel}.`;
        nextChoices = [`Yes, deploy ${svcLabel}`, 'Choose a different service'];
      } else {
        directive = 'DIRECTIVE: The user wants to add another service to the deployment plan. Ask which Azure service they would like to add.';
        nextChoices = Object.values(SERVICE_LABELS);
      }
    } else if (wantsDeploy && session.plan.length > 0) {
      // Deploy all services
      const configs = session.plan.map(p => p.config);
      session.state = 'done';
      const planLabel = session.plan.map(p => SERVICE_LABELS[p.service] || p.service).join(', ');
      const firstConfig = configs[0] || {};
      const deployingText = `Deployment initiated...\n\nDeploying ${session.plan.length} service${session.plan.length > 1 ? 's' : ''}: ${planLabel}\nSubscription: ${firstConfig.subscriptionName || '—'}\nResource Group: ${firstConfig.resourceGroup || '—'}\nLocation: ${firstConfig.location || '—'}\n\nThis may take a few minutes. You will see the result below.`;
      sse(res, 'deploy_plan', { configs, plan: session.plan });
      session.messages.push({ role: 'user', content: message });
      session.messages.push({ role: 'assistant', content: deployingText });
      sse(res, 'token', { content: deployingText });
      sse(res, 'done');
      return res.end();
    } else {
      // Unclear — re-show plan review options
    }

  } else if (session.state === 'editing') {
    if (!session._editingKey) {
      const stripped = message.replace(/^Edit:\s*/i, '').split(':')[0].trim();
      const found = (session.schema || []).find(p => {
        const label = p.editLabel || paramLabel(p.key.replace(/^__/, ''));
        return label.toLowerCase() === stripped.toLowerCase();
      });
      if (found) {
        session._editingKey = found.key;
        delete found._retryMsg;
        nextChoices = choicesForParam(found, subs, session);
      } else {
        nextChoices = editableChoices(session);
      }
    } else {
      const key   = session._editingKey;
      const param = findParamByKey(session, key);
      if (param) {
        const value  = extractValue(param, message, subs);
        const valErr = validationError(value);
        if (valErr) {
          param._retryMsg = `❌ Invalid input: ${valErr}\n\nPlease try again — ${param.q}`;
          nextChoices = choicesForParam(param, subs, session);
        } else if (value !== null) {
          session.collected[key] = value;
          delete param._retryMsg;
          delete session._editingKey;
          session.state = 'confirm';
          nextChoices = ['Yes, deploy', 'Edit a setting', 'Change service'];
        } else {
          const aiValue = await extractValueWithAI(param, message, subs, activeModel);
          if (aiValue !== null && !validationError(aiValue)) {
            session.collected[key] = aiValue;
            delete param._retryMsg;
            delete session._editingKey;
            session.state = 'confirm';
            nextChoices = ['Yes, deploy', 'Edit a setting', 'Change service'];
          } else {
            param._retryMsg = null;
            nextChoices = choicesForParam(param, subs, session);
          }
        }
      }
    }

  } else {
    // done state — allow starting over, keep subscription + re-detect env
    const keepSub = session.collected.__subscription;
    const autoEnv = inferEnv(keepSub?.name);
    session.state = 'start'; session.service = null; session.schema = []; session.schemaIdx = 0;
    session.collected = { ...(keepSub ? { __subscription: keepSub } : {}), ...(autoEnv ? { __env: autoEnv } : {}) };
    session.plan = [];
    const svc = detectService(message);
    if (svc) {
      session.service = svc; session.schema = buildSchema(svc, session.collected); session.schemaIdx = 0; session.state = 'collecting';
      nextChoices = choicesForParam(currentParam(session), subs, session);
    } else {
      nextChoices = Object.values(SERVICE_LABELS);
    }
  }

  // ── Respond: collecting state → direct text, no LLM ─────────────────────
  const useDirectText = !useOllamaForRetry &&
    ((session.state === 'collecting' || session.state === 'confirm' || session.state === 'editing' || session.state === 'plan_review')
    || (session.state === 'start' && nextChoices?.length > 0 && !directive));

  if (useDirectText) {
    let text = '';
    const skipPrefix = session._skipMsgs?.length ? session._skipMsgs.join('\n') + '\n\n' : '';
    session._skipMsgs = [];
    if (session.state === 'collecting') {
      const next = currentParam(session);
      text = skipPrefix + (next
        ? (next._retryMsg || next.q)
        : 'Something went wrong. Please refresh and try again.');
    } else if (session.state === 'confirm') {
      const costEstimate = await estimateMonthlyCost(session.service, session.collected, session.collected.__location);
      const costLine = formatCostEstimate(costEstimate);
      const planCount = (session.plan || []).length;
      const planNote = planCount > 0 ? `\n\n(${planCount} other service${planCount > 1 ? 's' : ''} already in plan)` : '';
      text = skipPrefix + `Here's a summary of what will be deployed:\n\n${makeSummary(session)}${costLine}${planNote}\n\nAdd this service to the deployment plan?`;
      nextChoices = ['Yes, add to plan', 'Edit a setting', 'Change service'];
    } else if (session.state === 'plan_review') {
      // Generate plan summary and diagram
      const planSummary = makePlanSummary(session);
      const mermaidSyntax = generateMermaid(session.plan, 'preview');
      text = skipPrefix + `Here's your deployment plan:\n\n${planSummary}\nWhat would you like to do?`;
      nextChoices = ['Add another service', 'Deploy all', 'Remove a service'];
      // Send diagram as separate SSE event
      if (mermaidSyntax) {
        sse(res, 'diagram', { mermaid: mermaidSyntax, mode: 'preview' });
      }
    } else if (session.state === 'editing') {
      if (!session._editingKey) {
        text = skipPrefix + 'Which setting would you like to change?';
      } else {
        const editParam = findParamByKey(session, session._editingKey);
        text = skipPrefix + (editParam ? (editParam._retryMsg || editParam.q) : 'Please enter the new value.');
      }
    } else {
      text = 'What would you like to deploy next?';
    }
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: text });
    sse(res, 'token', { content: text });
    if (nextChoices?.length) sse(res, 'choices', { choices: nextChoices });
    sse(res, 'done');
    return res.end();
  }

  // ── Call Ollama (only for start/done states — welcome & service picker) ────
  session.messages.push({ role: 'system', content: directive });
  session.messages.push({ role: 'user',   content: message });

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: activeModel, messages: session.messages, stream: true, options: { temperature: 0.3 } })
    });

    if (!ollamaRes.ok) {
      sse(res, 'error', { message: `Ollama returned ${ollamaRes.status}: ${await ollamaRes.text()}` });
      return res.end();
    }

    let fullContent = '';
    const reader  = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n').filter(Boolean)) {
        try {
          const chunk = JSON.parse(line);
          if (chunk.message?.content) {
            fullContent += chunk.message.content;
            sse(res, 'token', { content: chunk.message.content });
          }
        } catch { /* partial line */ }
      }
    }

    session.messages.push({ role: 'assistant', content: fullContent });

    // Learn mode: append MS Learn link + action buttons after Ollama response
    if (session.state === 'learning' && !nextChoices?.length) {
      const docsLink = session._pendingLearnLink;
      session._pendingLearnLink = null;
      if (docsLink) sse(res, 'learn_link', { url: docsLink });
      const svcLabel = session._learnService ? (SERVICE_LABELS[session._learnService] || session._learnService) : null;
      nextChoices = svcLabel
        ? [`Deploy ${svcLabel} now`, 'Explain the included template', 'Keep learning']
        : ['Keep learning'];
    }

    if (nextChoices?.length) sse(res, 'choices', { choices: nextChoices });
    sse(res, 'done');
  } catch (err) {
    sse(res, 'error', { message: `Chat error: ${err.message}` });
  }

  res.end();
});

export default router;
