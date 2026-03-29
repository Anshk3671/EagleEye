// ============================================================
// useHubs.ts — Hub List Fetching Hook
//
// Fetches the list of logistics hubs from the backend database.
// Used in: HubManagementPage, AdminManageHubsPage, NetworkPage
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { getHubs, type Hub } from "../lib/api";

export function useHubs() {
  const [hubs, setHubs] = useState<Hub[]>([]);             // List of hub objects
  const [loading, setLoading] = useState(true);             // True while fetching
  const [error, setError] = useState<string | null>(null);  // Error if fetch fails

  // fetchHubs: Calls the backend to get all hubs
  const fetchHubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHubs();
      setHubs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch hubs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when component mounts
  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  return { hubs, loading, error, refetch: fetchHubs };
}
