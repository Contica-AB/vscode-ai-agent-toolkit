import { LOCATIONS } from './config.js';

export const SERVICE_SCHEMAS = {
  'servicebus': [
    { key:'namespaceName', label:'Service Bus namespace name', type:'text',
      q:'Name for the Service Bus namespace? (6–50 chars, letters/numbers/hyphens)\nMust be globally unique — include your org/project, e.g. contoso-myapp-bus',
      validate: v => v.length < 6 || v.length > 50 ? 'Must be 6–50 characters.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'sku',    label:'SKU', type:'choice', choices:['Standard','Premium','Basic'],
      q:'Which SKU?\n• Basic — queues only, lowest cost\n• Standard — queues + topics, most common\n• Premium — dedicated capacity, VNet support' },
    { key:'queues', label:'queues to create', type:'list_optional',
      q:'Any queues to pre-create? Enter names comma-separated, or click Skip.' },
    { key:'topics', label:'topics to create', type:'list_optional',
      q:'Any topics to pre-create? Enter names comma-separated, or click Skip.',
      skipIf: c => c.sku === 'Basic', skipMsg: '[!] Basic SKU does not support topics — skipping.' },
  ],

  'eventhub': [
    { key:'namespaceName', label:'Event Hubs namespace name', type:'text',
      q:'Name for the Event Hubs namespace? (6–50 chars, letters/numbers/hyphens)\nMust be globally unique — include your org/project, e.g. contoso-myapp-eh',
      validate: v => v.length < 6 || v.length > 50 ? 'Must be 6–50 characters.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'sku', label:'SKU', type:'choice', choices:['Basic','Standard','Premium'],
      q:'Which SKU?\n• Basic — single consumer group, no capture\n• Standard — multiple consumer groups, 20 connections\n• Premium — dedicated capacity, private endpoints' },
    { key:'eventHubs', label:'event hubs to create', type:'list_optional',
      q:'Any event hub instances to pre-create? Enter names comma-separated, or click Skip.' },
    { key:'messageRetentionInDays', label:'message retention (days)', type:'choice',
      choices:['1','3','7'], paramType:'int',
      q:'How many days to retain messages? (Basic: max 1 day, Standard/Premium: up to 7)',
      skipIf: c => !c.eventHubs?.length, skipMsg: '[~] No event hubs to create — skipping retention setting.' },
  ],

  'logicapp-consumption': [
    { key:'logicAppName', label:'Logic App name', type:'text',
      q:'Name for the Logic App (Consumption)? (2–80 chars, letters/numbers/hyphens)',
      validate: v => v.length < 2 || v.length > 80 ? 'Must be 2–80 characters.' : null },
    { key:'integrationAccountId', label:'Integration Account resource ID', type:'text_optional',
      q:'Link an Integration Account? Paste the full resource ID, or click Skip.' },
  ],

  'logicapp-standard': [
    { key:'logicAppName', label:'Logic App name', type:'text',
      q:'Name for the Logic App (Standard)? (2–60 chars)',
      validate: v => v.length < 2 || v.length > 60 ? 'Must be 2–60 characters.' : null },
    { key:'storageAccountName', label:'storage account name', type:'text',
      q:'Storage account name for the Logic App runtime? (3–24 lowercase letters/numbers, must be globally unique — e.g. myorg2024logicstore)',
      validate: v => /[^a-z0-9]/.test(v) || v.length < 3 || v.length > 24 ? 'Must be 3–24 lowercase letters and numbers only.' : null },
    { key:'skuName', label:'plan size', type:'choice', choices:['WS1','WS2','WS3'],
      q:'Which hosting plan?\n• WS1 — 1 core, 3.5 GB RAM\n• WS2 — 2 cores, 7 GB RAM\n• WS3 — 4 cores, 14 GB RAM' },
    { key:'__codePath', label:'workflows folder', type:'text',
      q:'Path to your local Logic App workflows folder? (e.g. C:\\Projects\\my-logicapp)\nLeave blank to skip code deployment and only create the infrastructure.',
      validate: () => null },
  ],

  'apim': [
    { key:'apimName', label:'API Management service name', type:'text',
      q:'Name for the API Management service?\n• 1–50 chars, letters/numbers/hyphens, must start with a letter\n• Must be globally unique across Azure\n• Best practice: include org + purpose, e.g. contoso-integration-apim',
      validate: v => v.length < 1 || v.length > 50 ? 'Must be 1–50 characters.' : !/^[a-zA-Z]/.test(v) ? 'Must start with a letter.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'publisherEmail', label:'publisher email', type:'text',
      q:'Publisher email address? (used for system notifications)',
      validate: v => !v.includes('@') ? 'Please enter a valid email address.' : null },
    { key:'publisherName', label:'publisher name', type:'text',
      q:'Publisher organisation or name? (shown in the developer portal)' },
    { key:'sku', label:'SKU', type:'choice',
      choices:['Consumption','Developer','Basic','Standard','Premium'],
      q:'Which SKU?\n• Consumption — serverless, pay-per-call, no VNet, fastest to deploy\n• Developer — dev/test only, no SLA, ~30–45 min to provision\n• Basic — production, SLA, ~30–45 min to provision\n• Standard — production + more scale, ~30–45 min to provision\n• Premium — multi-region, VNet integration, ~30–45 min to provision\n[!] All tiers except Consumption take 30–45 minutes to deploy.' },
    { key:'rateLimitCallsPerMinute', label:'rate limit (calls/min)', type:'text', paramType:'int',
      defaultValue: '60',
      q:'Rate limit per client IP — max calls per minute?\n• Recommended: 60 for dev/test, 300–1000 for production APIs\n• Too low = legitimate users get blocked; too high = no protection\n• Applies globally across all APIs in this template\n• Press Enter to use default (60)',
      validate: v => (isNaN(parseInt(v)) || parseInt(v) < 1) ? 'Please enter a positive number.' : null },
    { key:'corsAllowedOrigins', label:'CORS allowed origins', type:'text',
      defaultValue: '*',
      q:'CORS allowed origins?\n• * = allow all origins (convenient for dev, risky for production)\n• Production best practice: specify exact domain, e.g. https://myapp.com\n• Multiple domains not supported in this template — use * or one domain\n• Press Enter to use default (*)' },
  ],

  'integrationaccount': [
    { key:'integrationAccountName', label:'Integration Account name', type:'text',
      q:'Name for the Integration Account? (1–80 chars)',
      validate: v => v.length < 1 || v.length > 80 ? 'Must be 1–80 characters.' : null },
    { key:'sku', label:'SKU', type:'choice', choices:['Free','Basic','Standard'],
      q:'Which SKU?\n• Free — limited messages, dev/test only\n• Basic — B2B tracking, AS2/X12/EDIFACT\n• Standard — full EDI, maps, schemas, partner management' },
  ],

  'functionapp': [
    { key:'functionAppName', label:'Function App name', type:'text',
      q:'Name for the Function App? (2–60 chars)',
      validate: v => v.length < 2 || v.length > 60 ? 'Must be 2–60 characters.' : null },
    { key:'storageAccountName', label:'storage account name', type:'text',
      q:'Storage account name for the Function App? (3–24 lowercase letters/numbers, must be globally unique — e.g. myorg2024funcstore)',
      validate: v => /[^a-z0-9]/.test(v) || v.length < 3 || v.length > 24 ? 'Must be 3–24 lowercase letters and numbers only.' : null },
    { key:'runtime', label:'runtime', type:'choice',
      choices:['dotnet','dotnet-isolated','node','python','java'],
      q:'Which runtime?\n• dotnet / dotnet-isolated — C# functions\n• node — JavaScript/TypeScript\n• python — Python functions\n• java — Java functions' },
    { key:'__codePath', label:'function code folder', type:'text',
      q:'Path to your local function code folder to deploy? (e.g. C:\\Projects\\my-func)\nLeave blank to skip code deployment and only create the infrastructure.',
      validate: () => null },
  ],

  'keyvault': [
    { key:'keyVaultName', label:'Key Vault name', type:'text',
      q:'Name for the Key Vault? (3–24 chars, letters/numbers/hyphens, must start with a letter)',
      validate: v => v.length < 3 || v.length > 24 ? 'Must be 3–24 characters.' : /[^a-zA-Z0-9-]/.test(v) ? 'Only letters, numbers and hyphens allowed.' : null },
    { key:'sku', label:'SKU', type:'choice', choices:['standard','premium'],
      q:'Which SKU?\n• standard — software-protected keys\n• premium — HSM-backed keys (higher cost)' },
  ],

  'eventgrid': [
    { key:'topicName', label:'Event Grid topic name', type:'text',
      q:'Name for the Event Grid topic? (3–50 chars)',
      validate: v => v.length < 3 || v.length > 50 ? 'Must be 3–50 characters.' : null },
  ],
};

export const COMMON_SCHEMA = [
  { key:'__subscription', label:'Azure subscription',  type:'subscription', q:'' },
  { key:'__rgPick',       label:'resource group',      type:'rg_select',    q:'Select an existing resource group or create a new one:' },
  { key:'__rgName',       label:'resource group name', type:'text',         q:'What name for the new resource group? (1–90 chars, letters/numbers/hyphens/underscores/periods)',
    validate: v => (v.length < 1 || v.length > 90) ? 'Name must be 1–90 characters.' : null },
  { key:'__location',     label:'Azure region',        type:'choice', choices:LOCATIONS, q:'Which Azure region do you want to deploy to?' },
  { key:'__env',          label:'environment tag',     type:'choice', choices:['dev','test','prod'], q:'Which environment is this for?' },
];

export const SERVICE_LABELS = {
  'servicebus':'Service Bus', 'eventhub':'Event Hubs',
  'logicapp-consumption':'Logic App Consumption', 'logicapp-standard':'Logic App Standard',
  'apim':'API Management', 'integrationaccount':'Integration Account',
  'functionapp':'Function App', 'keyvault':'Key Vault', 'eventgrid':'Event Grid'
};

export const SERVICE_KEYWORDS = {
  'servicebus':['service bus','servicebus'],
  'eventhub':['event hub','eventhub'],
  'logicapp-standard':['logic app standard','standard logic app','logic app standard'],
  'logicapp-consumption':['logic app consumption','consumption logic app','logic app consumption'],
  'apim':['api management','apim','api gateway'],
  'integrationaccount':['integration account','b2b','edi'],
  'functionapp':['function app','functionapp','azure function','functions'],
  'keyvault':['key vault','keyvault'],
  'eventgrid':['event grid','eventgrid'],
};
