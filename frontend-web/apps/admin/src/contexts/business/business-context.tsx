import type { BusinessSummary, PaginatedResults } from 'src/types/business';

import { useMemo, useState, useEffect, useCallback, createContext } from 'react';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';
import { getAccessToken } from 'src/lib/auth-session';
import { getStoredBusinessId, setStoredBusinessId } from 'src/lib/business-session';

// ----------------------------------------------------------------------

export type BusinessAccessError = 'forbidden' | 'network' | null;

export type BusinessContextValue = {
  businesses: BusinessSummary[];
  selectedBusinessId: number | null;
  selectedBusiness: BusinessSummary | null;
  loading: boolean;
  error: BusinessAccessError;
  setSelectedBusinessId: (id: number) => void;
  refetch: () => Promise<void>;
};

// ----------------------------------------------------------------------

export const BusinessContext = createContext<BusinessContextValue | null>(null);

function resolveSelectedId(
  list: BusinessSummary[],
  storedId: number | null
): { selectedId: number | null } {
  if (list.length === 0) {
    return { selectedId: null };
  }
  if (storedId != null && list.some((b) => b.id === storedId)) {
    return { selectedId: storedId };
  }
  return { selectedId: list[0].id };
}

type ProviderProps = {
  children: React.ReactNode;
};

export function BusinessProvider({ children }: ProviderProps) {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [selectedBusinessId, setSelectedBusinessIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusinessAccessError>(null);

  const load = useCallback(async () => {
    if (CONFIG.auth.skip && !getAccessToken()) {
      setBusinesses([]);
      setSelectedBusinessIdState(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<PaginatedResults<BusinessSummary>>(endpoints.business.mine);
      const list = res.data.results ?? [];
      setBusinesses(list);

      const stored = getStoredBusinessId();
      const { selectedId } = resolveSelectedId(list, stored);
      setSelectedBusinessIdState(selectedId);
      if (selectedId != null) {
        setStoredBusinessId(selectedId);
      } else {
        setStoredBusinessId(null);
      }
    } catch (e: unknown) {
      setBusinesses([]);
      setSelectedBusinessIdState(null);
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setError('forbidden');
      } else {
        setError('network');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setSelectedBusinessId = useCallback((id: number) => {
    setSelectedBusinessIdState(id);
    setStoredBusinessId(id);
  }, []);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId]
  );

  const value = useMemo<BusinessContextValue>(
    () => ({
      businesses,
      selectedBusinessId,
      selectedBusiness,
      loading,
      error,
      setSelectedBusinessId,
      refetch: load,
    }),
    [
      businesses,
      selectedBusinessId,
      selectedBusiness,
      loading,
      error,
      setSelectedBusinessId,
      load,
    ]
  );

  return <BusinessContext value={value}>{children}</BusinessContext>;
}
