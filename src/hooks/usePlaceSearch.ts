'use client';

import { useEffect, useRef, useState } from 'react';
import { Place } from '@/types/place';

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export type PlaceSearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface UsePlaceSearchResult {
  results: Place[];
  status: PlaceSearchStatus;
  errorMessage: string | null;
}

/**
 * Debounced Singapore place search backed by /api/places/search (OneMap).
 * Cancels in-flight requests and ignores out-of-order responses so a fast
 * typist never sees a stale result set overwrite a newer one.
 */
export function usePlaceSearch(query: string): UsePlaceSearchResult {
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<PlaceSearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const isQueryTooShort = trimmed.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    abortRef.current?.abort();

    if (isQueryTooShort) {
      return;
    }

    const seq = ++requestSeq.current;

    const timer = setTimeout(async () => {
      setStatus('loading');
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`/api/places/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });

        if (seq !== requestSeq.current) return; // superseded by a newer query

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setStatus('error');
          setErrorMessage(body?.message || 'Search is temporarily unavailable.');
          setResults([]);
          return;
        }

        const data = (await response.json()) as { results: Place[] };
        if (seq !== requestSeq.current) return;

        setResults(data.results);
        setStatus(data.results.length > 0 ? 'success' : 'empty');
        setErrorMessage(null);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (seq !== requestSeq.current) return;
        setStatus('error');
        setErrorMessage('Could not reach search. Check your connection and try again.');
        setResults([]);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [trimmed, isQueryTooShort]);

  if (isQueryTooShort) {
    return { results: [], status: 'idle', errorMessage: null };
  }

  return { results, status, errorMessage };
}
