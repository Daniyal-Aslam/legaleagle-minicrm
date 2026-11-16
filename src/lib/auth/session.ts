/**
 * Stateless signed session tokens: base64url(payload).base64url(HMAC-SHA256).
 * Uses Web Crypto so it runs in both middleware (edge) and route handlers.
 */

export const SESSION_COOKIE = "le_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // one working day, in seconds

interface SessionPayload {
  sub: string;
  exp: number; // unix seconds
}

// A fixed fallback keeps the mock working with zero configuration; set
// AUTH_SECRET in production so tokens can't be forged from the public repo.
const SECRET = process.env.AUTH_SECRET ?? "legal-eagle-crm-demo-secret-change-me";

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

let keyPromise: Promise<CryptoKey> | null = null;
function getKey() {
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return keyPromise;
}

export async function createSessionToken(userId: string, now = Date.now()) {
  const payload: SessionPayload = { sub: userId, exp: Math.floor(now / 1000) + SESSION_MAX_AGE };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body)));
  return `${body}.${toBase64Url(signature)}`;
}

/** Returns the user id for a valid, unexpired token; otherwise null. */
export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<string | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Partial<SessionPayload>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    return payload.exp * 1000 > now ? payload.sub : null;
  } catch {
    return null;
  }
}
