import policy from '../helpers/upgrade_policy.json' with { type: 'json' };

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const createResponse = (statusCode, body = '') => ({
  statusCode,
  headers: HEADERS,
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200);
  }

  if (event.httpMethod !== 'GET') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  const { bundleId, currentVersion } = event.queryStringParameters || {};

  if (!bundleId || !currentVersion) {
    return createResponse(400, { error: 'Missing required query parameters: bundleId, currentVersion' });
  }

  const app = policy.apps[bundleId];

  if (!app) {
    return createResponse(200, { upgradeRequirement: null });
  }

  const { minimumSupportedVersion, minimumRecommendedVersion, appStoreUrl } = app;

  // Below minimum supported version → forced upgrade
  if (minimumSupportedVersion && compareVersions(currentVersion, minimumSupportedVersion) < 0) {
    return createResponse(200, {
      upgradeRequirement: {
        type: 'forced',
        title: 'Update Required',
        message: 'This version is no longer supported. Please update to continue using the app.',
        appStoreUrl,
        minimumSupportedVersion,
        minimumRecommendedVersion: minimumRecommendedVersion || null,
      },
    });
  }

  // Below minimum recommended version → suggested upgrade
  if (minimumRecommendedVersion && compareVersions(currentVersion, minimumRecommendedVersion) < 0) {
    return createResponse(200, {
      upgradeRequirement: {
        type: 'suggested',
        title: 'Update Available',
        message: 'A new version is available with improvements and bug fixes.',
        appStoreUrl,
        minimumSupportedVersion: minimumSupportedVersion || null,
        minimumRecommendedVersion,
      },
    });
  }

  // Current version is up to date
  return createResponse(200, { upgradeRequirement: null });
};
