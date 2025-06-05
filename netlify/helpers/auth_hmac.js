import crypto from "crypto";

const SECRET = process.env.HMAC_SECRET;

export function verifyHMAC(headers) {
  const deviceId = headers["x-device-id"];
  const timestamp = headers["x-timestamp"];
  const signature = headers["x-signature"];

  if (!deviceId || !timestamp || !signature) {
    return { ok: false, code: 400, reason: "Missing required auth headers" };
  }

  const now = Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return { ok: false, code: 403, reason: "Request expired or invalid timestamp" };
  }

  const message = `device-id:${deviceId}:${timestamp}`;
  const expected = crypto.createHmac("sha256", SECRET).update(message).digest("base64");

  if (signature !== expected) {
    return { ok: false, code: 401, reason: "Invalid signature" };
  }

  return { ok: true };
}