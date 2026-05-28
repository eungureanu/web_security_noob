export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function assetUrl(filePath: string): string {
  return `${BACKEND_ORIGIN}/${filePath.replace(/^\//, '')}`;
}