const FALLBACK_ORIGIN = "http://localhost:4002";

function normalizeOrigin(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  return trimmed;
}

export function getPublicAppOrigin(): string {
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeOrigin(window.location.origin) || FALLBACK_ORIGIN;
  }

  return FALLBACK_ORIGIN;
}

export function buildPublicAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicAppOrigin()}${normalizedPath}`;
}
