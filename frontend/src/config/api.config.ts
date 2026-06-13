export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Encodes URL parameters according to RFC 3986.
 */
export function encodeRFC3986(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/**
 * Builds a query string with RFC 3986-encoded keys and values.
 */
export function buildQueryString(
  query: Record<string, string | number | undefined>
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeRFC3986(key)}=${encodeRFC3986(String(value))}`);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * Builds an API URL with RFC 3986-encoded path segments and optional query parameters.
 */
export function apiUrl(
  endpoint: string,
  id?: string,
  query?: Record<string, string | number | undefined>
): string {
  const pathParts = [endpoint];

  if (id !== undefined) {
    pathParts.push(id);
  }

  const encodedPath = pathParts.map(encodeRFC3986).join('/');
  return `${API_BASE_URL}/${encodedPath}${buildQueryString(query ?? {})}`;
}

export function assetUrl(filePath: string): string {
  const normalized = filePath.replace(/^\//, '');
  const encodedPath = normalized.split('/').map(encodeRFC3986).join('/');
  return `${BACKEND_ORIGIN}/${encodedPath}`;
}
