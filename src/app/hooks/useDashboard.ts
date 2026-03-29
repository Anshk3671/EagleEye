// ============================================================
// useDashboard.ts — Admin Dashboard Data Hook
//
// Fetches all data needed for the Admin Dashboard in ONE call:
//  - Stats (total shipments, revenue, agents count)
//  - Volume (daily/weekly shipment volume for charts)
//  - Summary (recent activity, top hubs etc.)
//
// Uses Promise.all() to fetch all 3 at the same time (parallel = faster).
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  getDashboardStats,    // API call → total shipments, revenue, active agents
  getDashboardVolume,   // API call → shipping volume over time (for charts)
  getDashboardSummary,  // API call → recent activity, hub performance
  type DashboardStats,
  type ShippingVolume,
  type DashboardSummary,
} from "../lib/api";

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);      // Totals (numbers)
  const [volume, setVolume] = useState<ShippingVolume[]>([]);           // Chart data (array)
  const [summary, setSummary] = useState<DashboardSummary | null>(null); // Summary cards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetchAll: Fetches all 3 API endpoints simultaneously using Promise.all
  // This is faster than fetching them one by one (parallel requests)
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Run all 3 API calls at the same time, wait for all to complete
      const [s, v, sm] = await Promise.all([
        getDashboardStats(),   // → s (stats)
        getDashboardVolume(),  // → v (volume)
        getDashboardSummary(), // → sm (summary)
      ]);
      setStats(s);
      setVolume(v);
      setSummary(sm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, volume, summary, loading, error, refetch: fetchAll };
}
