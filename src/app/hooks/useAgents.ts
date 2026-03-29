// ============================================================
// useAgents.ts — Agent List Fetching Hook
//
// Fetches the list of delivery agents from the backend.
// Supports filtering by hub location and agent status.
// Used in: AdminManageAgentsPage, NetworkPage
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { getAgents, type Agent } from "../lib/api";

// useAgents: Fetches agents with optional filters
// hub: filter by hub code (e.g. "DEL", "BOM")
// status: filter by agent status ("ACTIVE", "ON_ROUTE", "OFFLINE")
export function useAgents(initialParams?: { hub?: string; status?: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);     // List of agents
  const [loading, setLoading] = useState(true);           // True while fetching
  const [error, setError] = useState<string | null>(null); // Error message if fetch fails

  // fetchAgents: Calls getAgents() from api.ts to get agents from the backend
  const fetchAgents = useCallback(async (params?: typeof initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAgents(params || initialParams);
      setAgents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when component mounts
  useEffect(() => {
    fetchAgents(initialParams);
  }, []);

  return { agents, loading, error, refetch: fetchAgents };
}
