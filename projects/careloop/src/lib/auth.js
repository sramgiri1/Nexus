import crypto from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const PASSWORD_RESET_MINUTES = 10;

export function normalizeEmail(value) {
  return value?.trim().toLowerCase() ?? "";
}

export function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_COST }).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  const [algorithm, salt, stored] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !stored) return false;
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_COST });
  const storedBuffer = Buffer.from(stored, "hex");
  if (storedBuffer.length !== derived.length) return false;
  return crypto.timingSafeEqual(storedBuffer, derived);
}

export function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function generateNumericCode(length = 6) {
  let output = "";
  while (output.length < length) {
    output += crypto.randomInt(0, 10).toString();
  }
  return output.slice(0, length);
}

export function passwordResetExpiry() {
  return new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);
}

export function passwordResetMinutes() {
  return PASSWORD_RESET_MINUTES;
}

function localFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}

async function googleProfileFromIdToken(idToken) {
  const url = new URL("https://oauth2.googleapis.com/tokeninfo");
  url.searchParams.set("id_token", idToken);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Google token validation failed");
  const payload = await res.json();
  if (payload.email_verified !== "true") throw new Error("Google account email is not verified");
  return {
    providerUserId: payload.sub,
    email: normalizeEmail(payload.email),
    name: payload.name ?? payload.given_name ?? null,
  };
}

async function googleProfileFromAccessToken(accessToken) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Google access token validation failed");
  const payload = await res.json();
  if (payload.email_verified !== true) throw new Error("Google account email is not verified");
  return {
    providerUserId: payload.sub,
    email: normalizeEmail(payload.email),
    name: payload.name ?? payload.given_name ?? null,
  };
}

async function facebookProfileFromAccessToken(accessToken) {
  const url = new URL("https://graph.facebook.com/me");
  url.searchParams.set("fields", "id,name,email");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Facebook access token validation failed");
  const payload = await res.json();
  return {
    providerUserId: payload.id,
    email: normalizeEmail(payload.email),
    name: payload.name ?? null,
  };
}

async function appleProfileFromIdToken(idToken) {
  const audience = process.env.APPLE_SERVICE_ID || process.env.APPLE_CLIENT_ID;
  if (!audience) {
    throw new Error("APPLE_SERVICE_ID or APPLE_CLIENT_ID must be configured");
  }
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience,
  });
  return {
    providerUserId: payload.sub,
    email: normalizeEmail(typeof payload.email === "string" ? payload.email : ""),
    name: null,
  };
}

function fallbackProfile(provider, payload) {
  if (!localFallbackAllowed()) {
    throw new Error(`${provider} authentication payload is incomplete`);
  }
  const providerUserId = payload.providerUserId?.trim();
  if (!providerUserId) throw new Error(`${provider} providerUserId is required`);
  return {
    providerUserId,
    email: normalizeEmail(payload.email),
    name: payload.name?.trim() || null,
  };
}

export async function resolveSocialProfile(provider, payload) {
  switch (provider) {
    case "GOOGLE":
      if (payload.idToken) return googleProfileFromIdToken(payload.idToken);
      if (payload.accessToken) return googleProfileFromAccessToken(payload.accessToken);
      return fallbackProfile("Google", payload);
    case "FACEBOOK":
      if (payload.accessToken) return facebookProfileFromAccessToken(payload.accessToken);
      return fallbackProfile("Facebook", payload);
    case "APPLE":
      if (payload.idToken) {
        const profile = await appleProfileFromIdToken(payload.idToken);
        return {
          ...profile,
          email: profile.email || normalizeEmail(payload.email),
          name: payload.name?.trim() || null,
        };
      }
      return fallbackProfile("Apple", payload);
    default:
      throw new Error("Unsupported provider");
  }
}
