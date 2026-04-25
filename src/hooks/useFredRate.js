import { useState, useCallback } from 'react';

const API_KEY = '41c2483c46b037489d6cd4a74226049b';
const CACHE_KEY = 'fred_mortgage30_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const useFredRate = () => {
  const [fredRate, setFredRate] = useState(null);
  const [fredDate, setFredDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRate = useCallback(async (bustCache = false) => {
    if (!bustCache) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
          setFredRate(cached.rate);
          setFredDate(cached.date);
          return cached.rate;
        }
      } catch { /* ignore bad cache */ }
    }

    setLoading(true);
    try {
      const url =
        `https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=MORTGAGE30US&api_key=${API_KEY}` +
        `&sort_order=desc&limit=1&file_type=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('FRED request failed');
      const json = await res.json();
      const obs = json.observations?.[0];
      if (!obs || obs.value === '.') throw new Error('No valid observation');
      const rate = parseFloat(obs.value);
      const date = obs.date; // "YYYY-MM-DD"
      setFredRate(rate);
      setFredDate(date);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, date, ts: Date.now() }));
      return rate;
    } catch {
      // Silent fail — leave existing rates untouched
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fredRate, fredDate, loading, fetchRate };
};
