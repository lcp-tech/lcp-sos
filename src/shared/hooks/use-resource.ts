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

/** Generic list hook: pagination, debounced search, extra filters, and manual refetch. */
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
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const hasLoadedOnce = useRef(false)

  const debouncedSearch = useDebounce(search, 300)

  const refetch = useCallback(() => setRefreshTick((tick) => tick + 1), [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filtersKey])

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Only show loading skeleton on first load — subsequent polls update silently
      if (!hasLoadedOnce.current) {
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
        setData(response.data)
        setTotalCount(response.pagination?.totalItems ?? response.data.length)
      } catch (err) {
        if (cancelled) return
        setError(extractErrorMessage(err))
      } finally {
        if (!cancelled) {
          setLoading(false)
          hasLoadedOnce.current = true
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

  // Poll every 20s, but only when the tab is visible
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function startPolling() {
      stopPolling()
      intervalRef.current = setInterval(() => {
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

  return { data, totalCount, loading, error, page, setPage, search, setSearch, refetch }
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
