import { print, type DocumentNode } from 'graphql';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, type AnyVariables, type TypedDocumentNode, type UseQueryArgs } from 'urql';

import { fingerprint, isFresh } from '@/lib/saved-data';
import { loadSaved, saveData } from '@/lib/saved-store';

// Results already written to storage, so the several screens sharing one query don't each
// write the same data again.
const written = new WeakSet<object>();

/**
 * A urql query whose last result is saved on the device (task 0007).
 *
 * - The saved copy shows at once on the first render.
 * - If it is younger than `maxAgeMs`, no request is made; otherwise the query runs in the
 *   background and its result is saved.
 * - `refetch()` (pull to refresh) always goes to the network.
 * - If a request fails while saved data is shown, the saved data stays, and
 *   `refreshFailed` and `savedAt` let the screen say so.
 *
 * Only public API data goes through here. Never use it for anything about the user.
 */
export function useSavedQuery<Data, Variables extends AnyVariables>(options: {
  query: TypedDocumentNode<Data, Variables>;
  variables: Variables;
  /** Key prefix, e.g. "members", or "votes:B001261" for one member's votes. */
  name: string;
  maxAgeMs: number;
  /** Checks a saved value still has the shape this query returns. */
  isValid: (data: unknown) => data is Data;
  pause?: boolean;
}) {
  const { query, variables, name, maxAgeMs, isValid, pause = false } = options;

  // The fingerprint changes when the query text does, so old saved shapes are ignored.
  const key = useMemo(() => `${name}:${fingerprint(print(query as DocumentNode))}`, [name, query]);
  const saved = pause ? null : loadSaved(key, isValid);

  // Decided once, when the screen opens: a fresh saved copy means no request.
  const [startedFresh] = useState(() => saved !== null && isFresh(saved.fetchedAt, Date.now(), maxAgeMs));
  const [forced, setForced] = useState(false);
  const skipNetwork = startedFresh && !forced;

  const [result, reexecute] = useQuery<Data, Variables>({
    query,
    variables,
    pause: pause || skipNetwork,
    requestPolicy: forced ? 'network-only' : 'cache-first',
  } as UseQueryArgs<Variables, Data>);

  useEffect(() => {
    const data = result.data;
    if (!data || result.error || typeof data !== 'object' || written.has(data)) return;
    written.add(data);
    saveData(key, data);
  }, [key, result.data, result.error]);

  const fromSaved = !result.data && saved !== null;

  return {
    data: result.data ?? saved?.data,
    fetching: result.fetching,
    error: result.error,
    /** A request failed, and the data shown is the saved copy. */
    refreshFailed: fromSaved && Boolean(result.error),
    /** When the shown data was fetched, if it is the saved copy. */
    savedAt: fromSaved ? saved.fetchedAt : null,
    refetch: () => {
      // A paused query fetches when un-paused; otherwise ask urql to skip its cache.
      if (skipNetwork) setForced(true);
      else reexecute({ requestPolicy: 'network-only' });
    },
  };
}
