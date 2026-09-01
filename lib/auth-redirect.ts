const SAFE_PATH = /^\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%\-]*$/;

export function safePath(next: unknown, fallback = "/account") {
  if (typeof next !== "string") return fallback;
  const value = next.trim();
  if (!value || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || value.includes("://")) return fallback;
  if (!SAFE_PATH.test(value)) return fallback;
  return value;
}
