export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const CSRF_TOKEN_KEY = 'csrfToken';

export const DEFAULT_ACCESS_TOKEN_PATHS = [
  'headers.x-access-token',
  'headers.x-auth-token',
  'data.auth_token',
  'data.access_token',
];
export const DEFAULT_CSRF_TOKEN_PATHS = ['headers.x-csrf-token', 'headers.x-xsrf-token'];
export const DEFAULT_REFRESH_TOKEN = ['headers.x-refresh-token', 'data.refresh_token'];
