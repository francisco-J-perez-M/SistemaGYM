/**
 * useMetricsHistory
 * Fetches the member's body metrics time-series from /api/user/metrics/history.
 * Used by weight prediction, progress charts, and any analytics component.
 *
 * @param {object} options
 * @param {number} [options.limit=100]  Max records to fetch
 * @param {string} [options.campo]      Restrict to a single metric field
 * @param {boolean} [options.enabled]   Set false to skip the fetch
 */
import { useState, useEffect, useCallback } from "react";

export function useMetricsHistory({ limit = 100, campo = null, enabled = true } = {}) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!enabled) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit });
      if (campo) params.set("campo", campo);

      const res = await fetch(`/api/user/metrics/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setHistory(json.history || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, campo]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}
