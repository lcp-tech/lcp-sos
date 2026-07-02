import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { ResourceApi, ResourceListParams } from '@/shared/api/resource-factory'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import type { ApiError } from '@/shared/lib/types'

export interface UseResourceListReturn<T> {
  data: T[]
  totalCount: number
  loading: boolean
  error: string | null
  page: number
  setPage: (page: number) => void
  search: string
  setSearch: (search: string) => void
  refetch: () => void
  /** Load the next page and append results to existing data */
  loadMore: () => void
  /** True when there are more pages to load */
  hasMore: boolean
  /** True when a "load more" fetch is in progress (not the initial load) */
  loadingMore: boolean
}

export interface UseResourceListOptions {
  pageSize?: number
  /**
   * Additional static filter params merged into every list request
   * (e.g. `{ dni: '...' }`). Callers should memoize this object (`useMemo`)
   * so its identity is stable across renders — it is compared by value
   * (via `JSON.stringify`) to decide when to refetch.
   */
  filters?: Record<string, string | number | undefined>
}

/** Generic list hook: pagination, debounced search, extra filters, infinite scroll, and manual refetch. */
export function useResourceList<T>(
  api: Pick<ResourceApi<T>, 'getAll'>,
  options: UseResourceListOptions = {}
): UseResourceListReturn<T> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const filters = options.filters
  const filtersKey = JSON.stringify(filters ?? {})

  const [data, setData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const hasLoadedOnce = useRef(false)

  // When this is true, the next fetch should APPEND data (not replace)
  const isLoadMoreRef = useRef(false)

  const debouncedSearch = useDebounce(search, 300)

  const refetch = useCallback(() => setRefreshTick((tick) => tick + 1), [])

  /** Load the next page and append results to existing data */
  const loadMore = useCallback(() => {
    setPage((prev) => {
      isLoadMoreRef.current = true
      return prev + 1
    })
  }, [])

  // Reset to page 1 (replace data) when search or filters change
  useEffect(() => {
    isLoadMoreRef.current = false
    setPage(1)
  }, [debouncedSearch, filtersKey])

  useEffect(() => {
    let cancelled = false
    const isAppending = isLoadMoreRef.current

    async function load() {
      if (isAppending) {
        setLoadingMore(true)
      } else if (!hasLoadedOnce.current) {
        // Only show loading skeleton on first load — subsequent polls update silently
        setLoading(true)
      }
      setError(null)

      const params: ResourceListParams = { limit: pageSize, page, ...filters }
      if (debouncedSearch) {
        params.search = debouncedSearch
      }

      try {
        const response = await api.getAll(params)
        if (cancelled) return

        if (isAppending) {
          // Append new items to existing data
          setData((prev) => [...prev, ...response.data])
        } else {
          // Replace data on fresh load or poll
          setData(response.data)
        }

        setTotalCount(response.pagination?.totalItems ?? response.data.length)
        setHasMore(response.pagination?.hasNextPage ?? false)
      } catch (err) {
        if (cancelled) return
        setError(extractErrorMessage(err))
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingMore(false)
          hasLoadedOnce.current = true
          // Reset the append flag after the fetch completes
          isLoadMoreRef.current = false
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // `filtersKey` (a stable JSON snapshot of `filters`) is the real dependency;
    // `filters` itself is read fresh from the closure when this effect fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, page, pageSize, debouncedSearch, refreshTick, filtersKey])

  // Poll every 20s, but only when the tab is visible.
  // On poll: fetch page 1 and replace all data (keeps data fresh without complexity).
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function startPolling() {
      stopPolling()
      intervalRef.current = setInterval(() => {
        // Reset to page 1 and replace data on every poll
        isLoadMoreRef.current = false
        setPage(1)
        setRefreshTick((t) => t + 1)
      }, 20_000)
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopPolling()
      } else {
        // Refetch immediately when tab becomes visible, then resume polling
        isLoadMoreRef.current = false
        setPage(1)
        setRefreshTick((t) => t + 1)
        startPolling()
      }
    }

    if (!document.hidden) {
      startPolling()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return { data, totalCount, loading, error, page, setPage, search, setSearch, refetch, loadMore, hasMore, loadingMore }
}

export interface UseResourceMutationReturn<T, CreateDTO, UpdateDTO> {
  create: (payload: CreateDTO) => Promise<T | null>
  update: (id: number | string, payload: UpdateDTO) => Promise<T | null>
  archive: (id: number | string) => Promise<boolean>
  submitting: boolean
}

/** Generic create/update/archive mutation hook with toast-on-error. */
export function useResourceMutation<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>(
  api: Pick<ResourceApi<T, CreateDTO, UpdateDTO>, 'create' | 'update' | 'archive'>
): UseResourceMutationReturn<T, CreateDTO, UpdateDTO> {
  const [submitting, setSubmitting] = useState(false)

  const create = useCallback(
    async (payload: CreateDTO) => {
      setSubmitting(true)
      try {
        return await api.create(payload)
      } catch (err) {
        toast.error(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [api]
  )

  const update = useCallback(
    async (id: number | string, payload: UpdateDTO) => {
      setSubmitting(true)
      try {
        return await api.update(id, payload)
      } catch (err) {
        toast.error(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [api]
  )

  const archive = useCallback(
    async (id: number | string) => {
      setSubmitting(true)
      try {
        await api.archive(id)
        return true
      } catch (err) {
        toast.error(extractErrorMessage(err))
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [api]
  )

  return { create, update, archive, submitting }
}

/** Extracts the backend's Spanish `detail` message from an Axios error, with a generic fallback. */
export function extractErrorMessage(err: unknown): string {
  const apiError = (err as { response?: { data?: ApiError } })?.response?.data
  return apiError?.detail ?? 'Ocurrió un error inesperado. Intentá nuevamente.'
}
