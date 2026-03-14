import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Simple in-memory cache with TTL.
 * Shared across all hook instances — survives component unmounts.
 */
const cache = new Map();

function getCached(key) {
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl) {
  if (!key || !ttl) return;
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

/**
 * Hook for async data fetching with independent loading/error states
 * and optional in-memory caching.
 *
 * @param {() => Promise<T>} fetcher — async function returning data
 * @param {any[]} deps — dependency array (re-fetches when deps change)
 * @param {object} options
 * @param {string} options.cacheKey — unique key for caching (null = no cache)
 * @param {number} options.ttl — cache TTL in ms (default 0 = no cache)
 * @returns {{ data: T|null, loading: boolean, error: string|null, reload: () => void }}
 */
export default function useAsyncData(fetcher, deps = [], { cacheKey = null, ttl = 0 } = {}) {
  const cached = getCached(cacheKey);
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    // Check cache first
    const hit = getCached(cacheKey);
    if (hit) {
      setData(hit);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setCache(cacheKey, result, ttl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(async () => {
    // Force reload: invalidate cache
    if (cacheKey) cache.delete(cacheKey);
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setCache(cacheKey, result, ttl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, ttl]);

  return { data, loading, error, reload };
}
