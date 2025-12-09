// netlify/helpers/momentum/handler.js
// Shared request handling for Momentum API endpoints

import { verifyMomentumHMAC } from './auth.js';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-device-id, x-timestamp, x-signature'
};

export const createResponse = (statusCode, body = '') => ({
  statusCode,
  headers: HEADERS,
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

/**
 * Creates a standardized Netlify function handler.
 * @param {Object} options
 * @param {Function} options.validate - Validation function: (data) => errorMessage | null
 * @param {Function} options.process - Processing function: (data) => Promise<{ message: string }>
 * @returns {Function} Netlify handler function
 */
export function createHandler({ validate, process }) {
  return async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200);
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
      return createResponse(405, { error: 'Method not allowed' });
    }

    // Verify HMAC authentication
    const authCheck = verifyMomentumHMAC(event.headers);
    if (!authCheck.ok) {
      return createResponse(authCheck.code, { error: authCheck.reason });
    }

    // Parse request body
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, { error: 'Invalid JSON data' });
    }

    // Validate request data
    const validationError = validate(data);
    if (validationError) {
      return createResponse(400, { error: validationError });
    }

    // Process request
    try {
      const result = await process(data);
      return createResponse(200, result);
    } catch (error) {
      console.error('Request processing failed:', error);
      return createResponse(500, { error: `Generation failed: ${error.message}` });
    }
  };
}
