import { useState, useEffect, useCallback } from 'react';

// Simple global query cache to handle invalidations and basic sharing
const globalQueryCache = new Map<string, any>();
const listeners = new Map<string, Set<() => void>>();

export class QueryClient {
  invalidateQueries({ queryKey }: { queryKey: any[] }) {
    const pattern = JSON.stringify(queryKey);
    if (listeners.has(pattern)) {
      listeners.get(pattern)!.forEach((listener) => listener());
    }
    const prefix = pattern.slice(0, -1);
    for (const [key, set] of listeners.entries()) {
      if (key.startsWith(prefix)) {
        set.forEach((listener) => listener());
      }
    }
  }
}

export const queryClient = new QueryClient();

export function useQueryClient() {
  return queryClient;
}

export function QueryClientProvider({ children, client }: { children: any; client?: any }) {
  return children;
}

export interface UseQueryOptions<TQueryFnData> {
  queryKey: any[];
  queryFn: () => Promise<TQueryFnData>;
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

export interface UseQueryResult<TData, TError> {
  data: TData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: TError | null;
  refetch: () => Promise<void>;
}

export function useQuery<TQueryFnData = any, TError = any, TData = TQueryFnData>({
  queryKey,
  queryFn,
  enabled = true,
}: UseQueryOptions<TQueryFnData>): UseQueryResult<TData, TError> {
  const cacheKey = JSON.stringify(queryKey);
  const [data, setData] = useState<TData | undefined>(globalQueryCache.get(cacheKey));
  const [isLoading, setIsLoading] = useState(!data && enabled);
  const [error, setError] = useState<TError | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const res = await queryFn();
      globalQueryCache.set(cacheKey, res);
      setData(res as unknown as TData);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, enabled, queryFn]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [cacheKey, enabled]);

  useEffect(() => {
    if (!listeners.has(cacheKey)) {
      listeners.set(cacheKey, new Set());
    }
    listeners.get(cacheKey)!.add(fetchData);
    return () => {
      listeners.get(cacheKey)?.delete(fetchData);
    };
  }, [cacheKey, fetchData]);

  return {
    data,
    isLoading,
    isFetching: isLoading,
    isError: !!error,
    error,
    refetch: fetchData,
  };
}

export interface UseInfiniteQueryOptions<TQueryFnData> {
  queryKey: any[];
  queryFn: (context: { pageParam: any }) => Promise<TQueryFnData>;
  initialPageParam?: any;
  getNextPageParam?: (lastPage: TQueryFnData, allPages: TQueryFnData[]) => any;
  enabled?: boolean;
}

export interface UseInfiniteQueryResult<TData, TError> {
  data: { pages: TData[] };
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: TError | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  refetch: () => Promise<void>;
}

export function useInfiniteQuery<TQueryFnData = any, TError = any, TData = TQueryFnData>({
  queryKey,
  queryFn,
  initialPageParam = 1,
  getNextPageParam,
  enabled = true,
}: UseInfiniteQueryOptions<TQueryFnData>): UseInfiniteQueryResult<TData, TError> {
  const cacheKey = JSON.stringify(queryKey);
  const [pages, setPages] = useState<TData[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [nextPageParam, setNextPageParam] = useState<any>(initialPageParam);

  const fetchPage = useCallback(async (pageParam: any, isNext: boolean) => {
    if (!enabled) return;
    if (isNext) {
      setIsFetchingNextPage(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await queryFn({ pageParam });
      setPages(prev => {
        const newPages = isNext ? [...prev, res as unknown as TData] : [res as unknown as TData];
        if (getNextPageParam) {
          const next = getNextPageParam(res, newPages as unknown as TQueryFnData[]);
          setNextPageParam(next);
        }
        return newPages;
      });
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  }, [cacheKey, enabled, queryFn, getNextPageParam]);

  useEffect(() => {
    if (enabled) {
      setPages([]);
      setNextPageParam(initialPageParam);
      fetchPage(initialPageParam, false);
    }
  }, [cacheKey, enabled]);

  const fetchNextPage = useCallback(() => {
    if (nextPageParam !== undefined && !isFetchingNextPage) {
      fetchPage(nextPageParam, true);
    }
  }, [nextPageParam, isFetchingNextPage, fetchPage]);

  const hasNextPage = nextPageParam !== undefined;

  const refetch = useCallback(() => {
    setPages([]);
    setNextPageParam(initialPageParam);
    return fetchPage(initialPageParam, false);
  }, [initialPageParam, fetchPage]);

  useEffect(() => {
    if (!listeners.has(cacheKey)) {
      listeners.set(cacheKey, new Set());
    }
    listeners.get(cacheKey)!.add(refetch);
    return () => {
      listeners.get(cacheKey)?.delete(refetch);
    };
  }, [cacheKey, refetch]);

  return {
    data: { pages },
    isLoading,
    isFetching: isLoading || isFetchingNextPage,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
  };
}

export interface UseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  variables: TVariables | null;
  error: any | null;
}

export function useMutation<TData = any, TVariables = any>({
  mutationFn,
  onSuccess,
  onError,
}: UseMutationOptions<TData, TVariables>): UseMutationResult<TData, TVariables> {
  const [isPending, setIsPending] = useState(false);
  const [variables, setVariables] = useState<TVariables | null>(null);
  const [error, setError] = useState<any | null>(null);

  const mutate = useCallback(async (vars: TVariables) => {
    setIsPending(true);
    setVariables(vars);
    try {
      const res = await mutationFn(vars);
      if (onSuccess) {
        onSuccess(res, vars);
      }
      return res;
    } catch (err: any) {
      setError(err);
      if (onError) {
        onError(err, vars);
      }
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [mutationFn, onSuccess, onError]);

  return { mutate, isPending, variables, error };
}
