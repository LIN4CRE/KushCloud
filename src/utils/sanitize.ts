/**
 * Input Sanitization Utilities
 * Provides XSS-safe helpers for handling external data.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates and sanitizes a URL to prevent javascript: injection.
 */
export function sanitizeUrl(url: string | null | undefined, fallback = "/"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    console.warn("[Sanitize] Blocked dangerous URL protocol:", trimmed.slice(0, 30));
    return fallback;
  }

  return trimmed;
}

/**
 * Strips non-alphanumeric characters for clean IDs or names.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}
