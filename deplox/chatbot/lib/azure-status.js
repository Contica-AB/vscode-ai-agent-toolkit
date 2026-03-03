import { execSync } from 'child_process';

/**
 * Compare a project's local deployment versions against Azure's actual state.
 * Returns an array of per-service status objects.
 */
export async function getAzureDeploymentStatus(project) {
  const results = [];

  // If no deployments yet, nothing to compare
  if (!project.deployments?.length) {
    return { localVersion: 0, services: [], summary: 'No deployments yet' };
  }

  const latestDeploy = project.deployments[0]; // newest first
  const localVersion = latestDeploy.version || project.deployments.length;

  // Resolve resource group and subscription — prefer project defaults, fall back to latest deployment
  const resourceGroup = project.defaults?.resourceGroup
    || latestDeploy.resourceGroup
    || null;
  const subscriptionId = project.defaults?.subscription?.id
    || latestDeploy.subscriptionId
    || null;

  if (!resourceGroup || !subscriptionId) {
    return {
      localVersion,
      services: [],
      summary: 'Missing resource group or subscription in project defaults',
    };
  }

  // Set the subscription context
  try {
    execSync(`az account set --subscription "${subscriptionId}" 2>/dev/null`, { timeout: 10000 });
  } catch {
    return {
      localVersion,
      services: [],
      summary: 'Could not set Azure subscription. Are you logged in?',
    };
  }

  // Query Azure for deployments in the resource group
  let azureDeployments = [];
  try {
    const raw = execSync(
      `az deployment group list --resource-group "${resourceGroup}" --output json 2>/dev/null`,
      { timeout: 20000 }
    ).toString().trim();
    azureDeployments = JSON.parse(raw);
  } catch {
    return {
      localVersion,
      services: [],
      summary: `Could not query deployments for resource group "${resourceGroup}".`,
    };
  }

  // Collect unique services from the latest deployment's services list
  const latestServices = latestDeploy.services || [];

  // Also check all deployments to build a service map
  const serviceMap = new Map();
  for (const dep of project.deployments) {
    if (dep.services) {
      for (const svc of dep.services) {
        if (!serviceMap.has(svc.service)) {
          serviceMap.set(svc.service, {
            service: svc.service,
            serviceLabel: svc.serviceLabel || svc.service,
            localVersion: dep.version,
            localStatus: svc.result || dep.status,
            localTimestamp: dep.timestamp,
            localParams: svc.params || {},
          });
        }
      }
    }
    // Also handle flat deployment records (single-service deploys from history)
    if (dep.service && !serviceMap.has(dep.service)) {
      serviceMap.set(dep.service, {
        service: dep.service,
        serviceLabel: dep.serviceLabel || dep.service,
        localVersion: dep.version,
        localStatus: dep.status,
        localTimestamp: dep.timestamp,
        localParams: dep.params || {},
      });
    }
  }

  // Match local services against Azure deployments
  for (const [svcKey, localInfo] of serviceMap) {
    // Look for matching Azure deployment names (DeploX names them as <service>-<name>)
    const matching = azureDeployments.filter(d =>
      d.name?.toLowerCase().includes(svcKey.toLowerCase())
    );

    if (matching.length === 0) {
      results.push({
        ...localInfo,
        azureStatus: 'not-found',
        azureTimestamp: null,
        azureProvisioningState: null,
        syncStatus: localInfo.localStatus === 'failed' ? 'failed-locally' : 'not-deployed',
      });
    } else {
      // Take the most recent Azure deployment for this service
      const latest = matching.sort((a, b) =>
        new Date(b.properties?.timestamp || 0) - new Date(a.properties?.timestamp || 0)
      )[0];

      const azureTime = latest.properties?.timestamp;
      const azureState = latest.properties?.provisioningState;
      const localTime = localInfo.localTimestamp;

      let syncStatus = 'unknown';
      if (azureState === 'Succeeded') {
        if (localTime && azureTime && new Date(localTime) <= new Date(azureTime)) {
          syncStatus = 'in-sync';
        } else if (localTime && azureTime && new Date(localTime) > new Date(azureTime)) {
          syncStatus = 'local-ahead';
        } else {
          syncStatus = 'in-sync';
        }
      } else if (azureState === 'Failed') {
        syncStatus = 'failed-in-azure';
      } else if (azureState === 'Running' || azureState === 'Accepted') {
        syncStatus = 'deploying';
      } else {
        syncStatus = 'unknown';
      }

      results.push({
        ...localInfo,
        azureStatus: azureState,
        azureTimestamp: azureTime,
        azureProvisioningState: azureState,
        azureDeploymentName: latest.name,
        syncStatus,
      });
    }
  }

  // Compute overall summary
  const allInSync = results.every(r => r.syncStatus === 'in-sync');
  const anyFailed = results.some(r => r.syncStatus === 'failed-in-azure' || r.syncStatus === 'failed-locally');
  const anyAhead = results.some(r => r.syncStatus === 'local-ahead');

  let summary;
  if (allInSync) summary = 'All services in sync with Azure';
  else if (anyFailed) summary = 'Some services have failed deployments';
  else if (anyAhead) summary = 'Local changes not yet deployed';
  else summary = 'Mixed status — check individual services';

  return {
    localVersion,
    services: results,
    summary,
  };
}
