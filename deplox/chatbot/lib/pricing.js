import { AZURE_PRICES_API, HOURS_PER_MONTH } from './config.js';

/** Query the Azure Retail Prices API (free, unauthenticated) */
export async function queryAzurePrices(filters) {
  try {
    const url = `${AZURE_PRICES_API}?$filter=${encodeURIComponent(filters.join(' and '))}&$top=100`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.Items || []).filter(i => i.type === 'Consumption');
  } catch { return []; }
}

/** Find an hourly-rate meter matching a SKU and name pattern */
export function findHourlyMeter(items, sku, pattern) {
  return items.find(i =>
    i.skuName?.toLowerCase().includes(sku.toLowerCase()) && pattern.test(i.meterName)
  );
}

/** Estimate the monthly cost for a service deployment using Azure Retail Prices */
export async function estimateMonthlyCost(service, collected, location) {
  if (!location) return null;
  const base = [`armRegionName eq '${location}'`, `priceType eq 'Consumption'`];

  try {
    switch (service) {
      case 'servicebus': {
        const sku = collected.sku || 'Standard';
        if (sku === 'Basic') return { monthly: 0, currency: 'USD',
          detail: 'Basic tier — pay per operation',
          note: '$0.05 per 1M messaging operations' };
        const items = await queryAzurePrices([`serviceName eq 'Service Bus'`, ...base]);
        const m = items.find(i => i.skuName?.toLowerCase() === sku.toLowerCase()
          && /base unit|messaging unit/i.test(i.meterName) && /1\/Hour/i.test(i.unitOfMeasure));
        return m ? { monthly: +(m.retailPrice * HOURS_PER_MONTH).toFixed(2), currency: m.currencyCode,
          detail: `${m.meterName}: $${m.retailPrice}/hr × ${HOURS_PER_MONTH} hrs`,
          note: sku === 'Premium' ? 'Per messaging unit (1 MU minimum)' : null } : null;
      }
      case 'eventhub': {
        const sku = collected.sku || 'Standard';
        const items = await queryAzurePrices([`serviceName eq 'Event Hubs'`, ...base, `unitOfMeasure eq '1 Hour'`]);
        const m = findHourlyMeter(items, sku, /throughput unit|processing unit/i);
        return m ? { monthly: +(m.retailPrice * HOURS_PER_MONTH).toFixed(2), currency: m.currencyCode,
          detail: `${m.meterName}: $${m.retailPrice}/hr × ${HOURS_PER_MONTH} hrs`,
          note: 'Per throughput/processing unit (1 minimum)' } : null;
      }
      case 'logicapp-standard': {
        const WS_SPECS = { WS1: { vcpu: 1, memGb: 3.5 }, WS2: { vcpu: 2, memGb: 7 }, WS3: { vcpu: 4, memGb: 14 } };
        const plan = collected.skuName || 'WS1';
        const spec = WS_SPECS[plan] || WS_SPECS.WS1;
        const items = await queryAzurePrices([`serviceName eq 'Logic Apps'`, ...base, `skuName eq 'Standard'`]);
        const cpuMeter = items.find(i => /vCPU Duration/i.test(i.meterName));
        const memMeter = items.find(i => /Memory Duration/i.test(i.meterName));
        if (!cpuMeter) return null;
        const cpuCost = cpuMeter.retailPrice * spec.vcpu * HOURS_PER_MONTH;
        const memCost = memMeter ? memMeter.retailPrice * spec.memGb * HOURS_PER_MONTH : 0;
        const total = +(cpuCost + memCost).toFixed(2);
        return { monthly: total, currency: cpuMeter.currencyCode,
          detail: `${plan} (${spec.vcpu} vCPU, ${spec.memGb} GB): vCPU $${cpuMeter.retailPrice}/hr × ${spec.vcpu} + Memory $${memMeter?.retailPrice || 0}/hr × ${spec.memGb} GB`,
          note: `Runs 24/7 — ${HOURS_PER_MONTH} hrs/month` };
      }
      case 'logicapp-consumption': {
        const items = await queryAzurePrices([`serviceName eq 'Logic Apps'`, ...base]);
        const m = items.find(i => /^action/i.test(i.meterName));
        return { monthly: 0, currency: m?.currencyCode || 'USD',
          detail: m ? `$${m.retailPrice} per action` : 'Pay-per-action',
          note: 'No fixed cost — typical dev workloads: $0–5/month' };
      }
      case 'apim': {
        const sku = collected.sku || 'Developer';
        if (sku === 'Consumption') return { monthly: 0, currency: 'USD',
          detail: '$3.50 per 10,000 gateway calls', note: 'Pay-per-call — first 1M calls/month included free' };
        const items = await queryAzurePrices([`serviceName eq 'API Management'`, ...base, `unitOfMeasure eq '1 Hour'`]);
        const m = findHourlyMeter(items, sku, /unit/i);
        return m ? { monthly: +(m.retailPrice * HOURS_PER_MONTH).toFixed(2), currency: m.currencyCode,
          detail: `${m.meterName}: $${m.retailPrice}/hr × ${HOURS_PER_MONTH} hrs`,
          note: 'Runs 24/7 — cost applies even when idle' } : null;
      }
      case 'functionapp':
        return { monthly: 0, currency: 'USD', detail: 'Consumption plan (Y1)',
          note: 'First 1M executions & 400K GB-s/month free' };
      case 'keyvault': {
        const sku = (collected.sku || 'standard').toLowerCase();
        const items = await queryAzurePrices([`serviceName eq 'Key Vault'`, ...base]);
        const m = items.find(i => i.skuName?.toLowerCase().includes(sku) && /operations|secrets/i.test(i.meterName));
        if (!m) return null;
        const ops = m.unitOfMeasure?.includes('10K') ? 1 : 10000;
        return { monthly: +(m.retailPrice * ops).toFixed(2), currency: m.currencyCode,
          detail: `$${m.retailPrice} per ${m.unitOfMeasure}`,
          note: 'Estimate based on ~10,000 operations/month' };
      }
      case 'eventgrid':
        return { monthly: 0, currency: 'USD', detail: '$0.60 per 1M operations after free tier',
          note: 'First 100,000 operations/month free' };
      case 'integrationaccount': {
        const sku = collected.sku || 'Free';
        if (sku === 'Free') return { monthly: 0, currency: 'USD', detail: 'Free tier',
          note: 'Limited to development and test scenarios' };
        const items = await queryAzurePrices([`serviceName eq 'Logic Apps'`, ...base]);
        const m = items.find(i => i.skuName?.toLowerCase() === sku.toLowerCase()
          && new RegExp(sku + '\\s+unit', 'i').test(i.meterName)
          && /1\/Month/i.test(i.unitOfMeasure));
        return m ? { monthly: +m.retailPrice.toFixed(2), currency: m.currencyCode,
          detail: `${m.meterName}: $${m.retailPrice.toFixed(2)}/month` } : null;
      }
      default: return null;
    }
  } catch { return null; }
}

/** Format a cost estimate as a readable text block for the confirm summary */
export function formatCostEstimate(est) {
  if (!est) return '';
  const { monthly, currency, detail, note } = est;
  let s = '\n\n💰 Estimated monthly cost: ';
  s += monthly === 0 ? 'Free / pay-per-use' : `~$${monthly.toFixed(2)} ${currency}/month`;
  if (detail) s += `\n   ${detail}`;
  if (note) s += `\n   ${note}`;
  s += '\n   Source: Azure Retail Prices API (retail pay-as-you-go rates)';
  return s;
}
