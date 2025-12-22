# Phase 2: Wire Frontend to API - Next Steps

**Status**: Ready to Start  
**Estimated Duration**: 1-2 days  
**Difficulty**: Medium  
**Blocker**: None (Phase 1 complete)

---

## Overview

Your frontend still displays **hardcoded mock data**. Phase 2 connects it to the **real API + database**.

Currently:
```typescript
// ❌ Frontend only knows about mock data
import { fraudFindings } from "@/lib/mockData";
const findings = fraudFindings; // Always the same 5 items

// ✅ API has all the data in PostgreSQL
// GET /api/fraud/findings returns real data
```

After Phase 2:
```typescript
// ✅ Frontend queries the real API
const { data: findings } = useQuery('/api/fraud/findings');
// Makes HTTP request → Gets data from PostgreSQL
```

---

## Step-by-Step Implementation

### Step 1: Create API Client (`client/src/lib/apiClient.ts`)

**Create a new file** with fetch wrapper + error handling:

```typescript
/**
 * Centralized API client for all HTTP requests
 * Handles authentication tokens, error handling, request/response logging
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000';

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
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Fraud findings endpoints
 */
export const fraudAPI = {
  list: (status?: string, limit = 20, offset = 0) =>
    apiRequest(
      `/api/fraud/findings?status=${status || ''}&limit=${limit}&offset=${offset}`
    ),

  get: (id: string) =>
    apiRequest(`/api/fraud/findings/${id}`),

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

  get: (id: string) =>
    apiRequest(`/api/threats/actors/${id}`),

  create: (data: any) =>
    apiRequest('/api/threats/actors', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest(`/api/threats/actors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

/**
 * Dark web intel endpoints
 */
export const darkWebAPI = {
  list: (severity?: string, limit = 20, offset = 0) =>
    apiRequest(
      `/api/dark-web/intel?severity=${severity || ''}&limit=${limit}&offset=${offset}`
    ),

  get: (id: string) =>
    apiRequest(`/api/dark-web/intel/${id}`),

  create: (data: any) =>
    apiRequest('/api/dark-web/intel', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Predictions endpoints
 */
export const predictionsAPI = {
  list: (limit = 20, offset = 0) =>
    apiRequest(`/api/predictions?limit=${limit}&offset=${offset}`),

  get: (id: string) =>
    apiRequest(`/api/predictions/${id}`),

  create: (data: any) =>
    apiRequest('/api/predictions', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Alerts endpoints
 */
export const alertsAPI = {
  list: (unreadOnly = false, limit = 20, offset = 0) =>
    apiRequest(`/api/alerts?unread=${unreadOnly}&limit=${limit}&offset=${offset}`),

  get: (id: string) =>
    apiRequest(`/api/alerts/${id}`),

  create: (data: any) =>
    apiRequest('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),

  markRead: (id: string) =>
    apiRequest(`/api/alerts/${id}/read`, { method: 'PUT' }),
};

/**
 * Dashboard & stats endpoints
 */
export const dashboardAPI = {
  health: () =>
    apiRequest('/api/health'),

  stats: () =>
    apiRequest('/api/stats'),

  dashboard: () =>
    apiRequest('/api/dashboard'),
};
```

### Step 2: Create React Query Hooks (`client/src/hooks/useAPI.ts`)

```typescript
/**
 * React Query hooks for API calls
 * Provides caching, automatic retries, error handling, loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fraudAPI, threatsAPI, darkWebAPI, predictionsAPI, alertsAPI, dashboardAPI } from '@/lib/apiClient';

/**
 * Fraud Findings Queries
 */
export function useFraudFindings(status?: string) {
  return useQuery({
    queryKey: ['fraudFindings', status],
    queryFn: () => fraudAPI.list(status),
  });
}

export function useFraudFinding(id: string) {
  return useQuery({
    queryKey: ['fraudFinding', id],
    queryFn: () => fraudAPI.get(id),
    enabled: !!id,
  });
}

export function useCreateFraudFinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fraudAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudFindings'] });
    },
  });
}

/**
 * Threat Actors Queries
 */
export function useThreatActors() {
  return useQuery({
    queryKey: ['threatActors'],
    queryFn: () => threatsAPI.list(),
  });
}

export function useThreatActor(id: string) {
  return useQuery({
    queryKey: ['threatActor', id],
    queryFn: () => threatsAPI.get(id),
    enabled: !!id,
  });
}

/**
 * Dark Web Intel Queries
 */
export function useDarkWebIntel(severity?: string) {
  return useQuery({
    queryKey: ['darkWebIntel', severity],
    queryFn: () => darkWebAPI.list(severity),
  });
}

/**
 * Predictions Queries
 */
export function usePredictions() {
  return useQuery({
    queryKey: ['predictions'],
    queryFn: () => predictionsAPI.list(),
  });
}

/**
 * Alerts Queries
 */
export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: ['alerts', unreadOnly],
    queryFn: () => alertsAPI.list(unreadOnly),
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/**
 * Dashboard Queries
 */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.dashboard(),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => dashboardAPI.stats(),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => dashboardAPI.health(),
  });
}
```

### Step 3: Update Pages to Use Real Data

**Example: `client/src/pages/FraudFindings.tsx`**

```typescript
// BEFORE: Using mock data
import { fraudFindings as mockFindings } from "@/lib/mockData";
// ...
const [findings] = useState(mockFindings);

// AFTER: Using real API
import { useFraudFindings } from "@/hooks/useAPI";
// ...
const { data: findings = [], isLoading, error } = useFraudFindings();

if (isLoading) return <Spinner />;
if (error) return <Alert variant="destructive">{error.message}</Alert>;
```

### Step 4: Update Dashboard

**`client/src/pages/Dashboard.tsx`**

```typescript
import { useDashboard, useStats } from "@/hooks/useAPI";

export default function Dashboard() {
  const { data: dashboardData, isLoading: dashLoading } = useDashboard();
  const { data: stats, isLoading: statsLoading } = useStats();

  if (dashLoading || statsLoading) return <Spinner />;

  const {
    activeThreats = 0,
    fraudAttemptsBlocked = 0,
    systemRiskScore = 0,
    aiConfidenceAvg = 0,
  } = stats || {};

  return (
    // Use real stats instead of hardcoded initialStats
  );
}
```

### Step 5: Update Each Page

Apply same pattern to:
- [ ] `FraudFindings.tsx` → Use `useFraudFindings()`
- [ ] `ThreatActors.tsx` → Use `useThreatActors()`
- [ ] `DarkWebIntel.tsx` → Use `useDarkWebIntel()`
- [ ] `Predictions.tsx` → Use `usePredictions()`
- [ ] Add `Alerts.tsx` page → Use `useAlerts()`

### Step 6: Add Error Handling

Create `client/src/components/ErrorBoundary.tsx`:

```typescript
import { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong: {this.state.error?.message}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

---

## Testing Checklist

- [ ] `npm run dev` - Backend runs
- [ ] `npm run dev:client` - Frontend runs (separate terminal)
- [ ] Open http://localhost:5173 in browser
- [ ] Dashboard shows real data from `/api/stats`
- [ ] Fraud Findings table loads from `/api/fraud/findings`
- [ ] Can filter by status
- [ ] Click "Live Scan" → Creates new finding in database
- [ ] Refresh page → New finding still there (proves persistence)
- [ ] Console shows no errors
- [ ] Network tab shows API requests succeeding

---

## Files to Create/Modify

| File | Action | Effort |
|------|--------|--------|
| `client/src/lib/apiClient.ts` | Create | 1 hour |
| `client/src/hooks/useAPI.ts` | Create | 1 hour |
| `client/src/pages/Dashboard.tsx` | Modify | 30 min |
| `client/src/pages/FraudFindings.tsx` | Modify | 30 min |
| `client/src/pages/ThreatActors.tsx` | Modify | 20 min |
| `client/src/pages/DarkWebIntel.tsx` | Modify | 20 min |
| `client/src/pages/Predictions.tsx` | Modify | 20 min |
| `client/src/components/ErrorBoundary.tsx` | Create | 30 min |
| `client/src/App.tsx` | Wrap with ErrorBoundary | 5 min |

**Total Effort**: ~4 hours

---

## Success Criteria

- [ ] Frontend loads real data from API
- [ ] No hardcoded mock data in pages
- [ ] Data updates persist across page refreshes
- [ ] All list pages have pagination
- [ ] Error messages display when API fails
- [ ] Loading spinners show while fetching
- [ ] Network tab shows `/api/` requests

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API returns 401 (Unauthorized) | Add login first, or remove JWT requirement from routes |
| CORS errors | Add CORS middleware to Express (already there) |
| Data doesn't refresh | Use queryClient.invalidateQueries() after mutations |
| TypeScript errors with fetch | Use `as Promise<T>` or create typed response types |
| Mock data still showing | Remove mock imports, use hooks instead |

---

## Timeline

**Day 1 (Morning)**: Implement API client + hooks  
**Day 1 (Afternoon)**: Update 3-4 pages  
**Day 2 (Morning)**: Update remaining pages + error handling  
**Day 2 (Afternoon)**: Testing & bug fixes  

---

**Ready to start Phase 2?** Let me know and I'll help implement it!
