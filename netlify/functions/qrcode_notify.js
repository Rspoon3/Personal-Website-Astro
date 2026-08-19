// netlify/functions/qrcode_notify.js
// Sends a Pushover push notification when someone hits the /qrcode redirect page

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const userKey = process.env.PUSHOVER_USER_KEY;
  const appToken = process.env.PUSHOVER_APP_TOKEN;

  if (!userKey || !appToken) {
    console.error('ERROR: Pushover credentials not configured');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Pushover not configured' }) };
  }

  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: appToken,
        user: userKey,
        title: 'QR Code Scanned',
        message: 'Someone just hit rspoon3.com/qrcode',
        priority: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pushover request failed:', errorText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to send notification' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error('Request failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Request failed: ${error.message}` }) };
  }
};
