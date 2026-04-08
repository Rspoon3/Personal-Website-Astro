import policy from '../helpers/upgrade_policy.json' with { type: 'json' };
import { checkUpgrade } from '../helpers/upgrade_check.js';

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

  const result = checkUpgrade(policy.apps[bundleId], currentVersion);
  return result ? createResponse(200, result) : createResponse(204);
};
