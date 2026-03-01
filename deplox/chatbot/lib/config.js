import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const CHATBOT_DIR   = join(__dirname, '..');
export const MODULES_DIR   = join(CHATBOT_DIR, '..', 'modules');
export const HISTORY_FILE  = join(CHATBOT_DIR, '..', 'deplox-history.json');
export const PROJECTS_DIR  = join(CHATBOT_DIR, '..', 'projects');

export const PORT         = process.env.PORT || 3000;
export const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
export const OLLAMA_EXE   = process.env.OLLAMA_EXE ||
  (process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe')
    : 'ollama');

export const HOURS_PER_MONTH  = 730;
export const AZURE_PRICES_API = 'https://prices.azure.com/api/retail/prices';

export const LOCATIONS = [
  'swedencentral', 'westeurope', 'northeurope', 'eastus', 'eastus2',
  'westus', 'westus2', 'uksouth', 'ukwest', 'australiaeast',
  'southeastasia', 'japaneast', 'centralus'
];

export const PORTAL_PATHS_SRV = {
  servicebus:             'Microsoft.ServiceBus/namespaces',
  eventhub:               'Microsoft.EventHub/namespaces',
  'logicapp-consumption': 'Microsoft.Logic/workflows',
  'logicapp-standard':    'Microsoft.Web/sites',
  apim:                   'Microsoft.ApiManagement/service',
  functionapp:            'Microsoft.Web/sites',
  keyvault:               'Microsoft.KeyVault/vaults',
  eventgrid:              'Microsoft.EventGrid/topics',
  integrationaccount:     'Microsoft.Logic/integrationAccounts',
};

export const LEARN_DOCS = {
  'servicebus':           'https://learn.microsoft.com/azure/service-bus-messaging/',
  'eventhub':             'https://learn.microsoft.com/azure/event-hubs/',
  'logicapp-consumption': 'https://learn.microsoft.com/azure/logic-apps/',
  'logicapp-standard':    'https://learn.microsoft.com/azure/logic-apps/',
  'apim':                 'https://learn.microsoft.com/azure/api-management/',
  'functionapp':          'https://learn.microsoft.com/azure/azure-functions/',
  'keyvault':             'https://learn.microsoft.com/azure/key-vault/',
  'eventgrid':            'https://learn.microsoft.com/azure/event-grid/',
  'integrationaccount':   'https://learn.microsoft.com/azure/logic-apps/logic-apps-enterprise-integration-create-integration-account'
};

export const LEARN_INTENT_WORDS = [
  'what is', 'what are', 'explain', 'tell me about', 'how does', 'how do',
  'when should', 'when to use', 'difference between', 'compare', 'vs ', 'versus',
  'learn', 'understand', 'overview', 'help me understand', 'why would', 'what can'
];

export const SYSTEM_PROMPT = `You are DeploX, a friendly Azure deployment assistant built by Ahmed Bayoumy.
You help users deploy Azure integration services through natural conversation.
Be concise, warm and helpful. Understand what users mean even when they don't use exact Azure terms.
When you receive a DIRECTIVE, follow it precisely and ask that one thing naturally.
Never ask more than one question at a time. Acknowledge answers briefly before continuing.`;
