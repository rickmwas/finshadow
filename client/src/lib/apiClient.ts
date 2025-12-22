/**
 * Centralized API client for all HTTP requests
 * Handles authentication tokens, error handling, request/response logging
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Make authenticated HTTP requests to the API
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...init } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers,
  };

  // Add JWT token if available
  if (token || typeof window !== 'undefined') {
    const storedToken = token || localStorage.getItem('authToken');
    if (storedToken) {
      headers.Authorization = `Bearer ${storedToken}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Authentication endpoints
 */
export const auth = {
  register: (data: { username: string; password: string; email: string }) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Fraud findings endpoints
 */
export const fraudAPI = {
  list: (status?: string, limit = 20, offset = 0) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return apiRequest(`/api/fraud/findings?${params.toString()}`);
  },

  get: (id: string) => apiRequest(`/api/fraud/findings/${id}`),

  create: (data: any) =>
    apiRequest('/api/fraud/findings', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/api/fraud/findings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  investigate: (id: string) =>
    apiRequest(`/api/fraud/findings/${id}/investigate`, { method: 'POST' }),

  resolve: (id: string) =>
    apiRequest(`/api/fraud/findings/${id}/resolve`, { method: 'POST' }),
};

/**
 * Threat actors endpoints
 */
export const threatsAPI = {
  list: (limit = 20, offset = 0) =>
    apiRequest(`/api/threats/actors?limit=${limit}&offset=${offset}`),

  get: (id: string) => apiRequest(`/api/threats/actors/${id}`),

  create: (data: any) =>
    apiRequest('/api/threats/actors', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/api/threats/actors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

/**
 * Dark web intel endpoints
 */
export const darkWebAPI = {
  list: (severity?: string, limit = 20, offset = 0) => {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return apiRequest(`/api/dark-web/intel?${params.toString()}`);
  },

  get: (id: string) => apiRequest(`/api/dark-web/intel/${id}`),

  create: (data: any) =>
    apiRequest('/api/dark-web/intel', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Predictions endpoints
 */
export const predictionsAPI = {
  list: (limit = 20, offset = 0) =>
    apiRequest(`/api/predictions?limit=${limit}&offset=${offset}`),

  get: (id: string) => apiRequest(`/api/predictions/${id}`),

  create: (data: any) =>
    apiRequest('/api/predictions', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Alerts endpoints
 */
export const alertsAPI = {
  list: (unreadOnly = false, limit = 20, offset = 0) =>
    apiRequest(`/api/alerts?unread=${unreadOnly}&limit=${limit}&offset=${offset}`),

  get: (id: string) => apiRequest(`/api/alerts/${id}`),

  create: (data: any) =>
    apiRequest('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),

  markRead: (id: string) =>
    apiRequest(`/api/alerts/${id}/read`, { method: 'PUT' }),
};

/**
 * Dashboard & stats endpoints
 */
export const dashboardAPI = {
  health: () => apiRequest('/api/health'),

  stats: () => apiRequest('/api/stats'),

  dashboard: () => apiRequest('/api/dashboard'),
};
