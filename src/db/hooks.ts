import { liveQuery } from 'dexie';
import { useEffect, useState, type DependencyList } from 'react';

export type Loadable<T> = { loading: true } | { loading: false; value: T };

/** Re-runs `query` whenever the tables it reads change. */
export function useLiveQuery<T>(
  query: () => Promise<T>,
  deps: DependencyList,
): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ loading: true });
  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => {
        setState({ loading: false, value });
      },
      error: (error: unknown) => {
        console.error(error);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
    // The caller's deps decide when the query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
