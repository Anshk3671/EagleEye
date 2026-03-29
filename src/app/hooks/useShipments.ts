// ============================================================
// useShipments.ts — Shipment Data Fetching Hooks
//
// Provides two custom hooks:
//  - useShipments(): fetch a LIST of shipments (with filters)
//  - useShipment(awb): fetch ONE specific shipment by AWB number
//
// Both hooks manage loading/error state automatically.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { getShipments, getShipment, type Shipment, type ShipmentListResponse } from "../lib/api";

// useShipments: Fetches a paginated/filtered list of shipments from the backend
// Parameters: search query, status filter, limit (page size), offset (page number)
export function useShipments(initialParams?: {
  search?: string;   // Filter by AWB, sender/receiver name etc.
  status?: string;   // Filter by status: "PENDING", "IN_TRANSIT", "DELIVERED" etc.
  limit?: number;    // How many results per page
  offset?: number;   // Skip this many results (for pagination)
}) {
  const [data, setData] = useState<ShipmentListResponse | null>(null); // Full API response
  const [loading, setLoading] = useState(true);                         // True while fetching
  const [error, setError] = useState<string | null>(null);              // Error message if fetch fails

  // fetchShipments: Calls the backend API to get shipments
  // useCallback: prevents unnecessary re-creation of this function on every render
  const fetchShipments = useCallback(async (params?: typeof initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getShipments(params || initialParams);
      setData(result); // Store fetched data in state
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shipments");
    } finally {
      setLoading(false); // Always stop loading, whether success or error
    }
  }, []);

  // Auto-fetch when component using this hook mounts
  useEffect(() => {
    fetchShipments(initialParams);
  }, []);

  return {
    shipments: data?.shipments ?? [], // Array of shipment objects (empty array as default)
    total: data?.total ?? 0,          // Total count for pagination
    loading,
    error,
    refetch: fetchShipments, // Expose refetch so components can manually refresh
  };
}

// useShipment: Fetches ONE specific shipment by its AWB (tracking) number
export function useShipment(awb: string | undefined) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipment = useCallback(async () => {
    if (!awb) {
      // No AWB provided — nothing to fetch
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getShipment(awb); // Fetch by AWB number
      setShipment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shipment not found");
    } finally {
      setLoading(false);
    }
  }, [awb]); // Re-fetch whenever AWB changes

  // Auto-fetch whenever the AWB number changes
  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  return { shipment, loading, error, refetch: fetchShipment };
}
