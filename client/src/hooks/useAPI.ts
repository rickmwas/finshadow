/**
 * React Query hooks for API calls
 * Provides caching, automatic retries, error handling, loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fraudAPI,
  threatsAPI,
  darkWebAPI,
  predictionsAPI,
  alertsAPI,
  dashboardAPI,
} from '@/lib/apiClient';

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

export function useUpdateFraudFinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fraudAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudFindings'] });
    },
  });
}

export function useInvestigateFraud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fraudAPI.investigate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraudFindings'] });
    },
  });
}

export function useResolveFraud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fraudAPI.resolve(id),
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

export function useCreateThreatActor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => threatsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threatActors'] });
    },
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

export function useCreateDarkWebIntel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => darkWebAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['darkWebIntel'] });
    },
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

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => predictionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
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
