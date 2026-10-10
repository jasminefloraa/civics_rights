import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
export function useFetch(path) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(() => { if (!path) return; setLoading(true); setError(''); api(path).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [path]);
  useEffect(load, [load]);
  return { data, error, loading, reload: load };
}
export const useTitle = (t) => useEffect(() => { document.title = `${t} | CivicSignal`; }, [t]);
