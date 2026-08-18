import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "petabook-crm-access";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function requiredSecret(name: "CRM_ACCESS_PASSWORD" | "CRM_SESSION_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
}

function digest(value: string) {
  return createHmac("sha256", requiredSecret("CRM_SESSION_SECRET")).update(value).digest();
}

export function accessCookieValue() {
  return digest(`petabook-crm-access-v1:${requiredSecret("CRM_ACCESS_PASSWORD")}`).toString("base64url");
}

export function isValidAccessCookie(value: string | undefined) {
  if (!value) return false;
  const expected = Buffer.from(accessCookieValue());
  const received = Buffer.from(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function isValidAccessPassword(candidate: string) {
  return timingSafeEqual(digest(candidate), digest(requiredSecret("CRM_ACCESS_PASSWORD")));
}
