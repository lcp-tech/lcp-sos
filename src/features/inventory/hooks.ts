import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { inventoryApi } from '@/features/inventory/api'
import type { InventoryItem, InventoryResponse, InventorySummary, InventoryStatus } from '@/features/inventory/types'
import { type UseResourceListOptions, extractErrorMessage } from '@/shared/hooks/use-resource'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'

export interface InventoryFilters {
  name?: string
  barcode?: string
  status?: InventoryStatus
}

const EMPTY_SUMMARY: InventorySummary = { available: 0, low: 0, outOfStock: 0, negative: 0 }

/**
 * Read-only inventory list hook: pagination plus `name`/`barcode`/`status` filters.
 *
 * The inventory endpoint returns `{ data, pagination, summary }` — a superset
 * of `PaginatedResponse<T>`. We use a bespoke fetch here instead of
 * `useResourceList` so we can capture the `summary` field from each response.
 */
export function useInventory(
  filters?: InventoryFilters,
  options?: Pick<UseResourceListOptions, 'pageSize'>
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE

  const [data, setData] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<InventorySummary>(EMPTY_SUMMARY)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const hasLoadedOnce = useRef(false)
  const isLoadMoreRef = useRef(false)

  const filtersKey = useMemo(() => JSON.stringify({
    name: filters?.name,
    barcode: filters?.barcode,
    status: filters?.status,
  }), [filters?.name, filters?.barcode, filters?.status])

  const refetch = useCallback(() => setRefreshTick((t) => t + 1), [])

  const loadMore = useCallback(() => {
    setPage((prev) => {
      isLoadMoreRef.current = true
      return prev + 1
    })
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    isLoadMoreRef.current = false
    setPage(1)
  }, [filtersKey])

  useEffect(() => {
    let cancelled = false
    const isAppending = isLoadMoreRef.current

    async function load() {
      if (isAppending) {
        setLoadingMore(true)
      } else if (!hasLoadedOnce.current) {
        setLoading(true)
      }
      setError(null)

      const params: Record<string, string | number | undefined> = {
        limit: pageSize,
        page,
        ...(filters?.name ? { name: filters.name } : {}),
        ...(filters?.barcode ? { barcode: filters.barcode } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      }

      try {
        const response: InventoryResponse = await inventoryApi.getAll(params)
        if (cancelled) return

        if (isAppending) {
          setData((prev) => [...prev, ...response.data])
        } else {
          setData(response.data)
        }

        // summary is stable — not affected by status filter (backend design)
        if (response.summary) setSummary(response.summary)
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
          isLoadMoreRef.current = false
        }
      }
    }

    load()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, refreshTick, filtersKey])

  // Poll every 20s when tab is visible
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function startPolling() {
      stopPolling()
      intervalRef.current = setInterval(() => {
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
        isLoadMoreRef.current = false
        setPage(1)
        setRefreshTick((t) => t + 1)
        startPolling()
      }
    }

    if (!document.hidden) startPolling()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return { data, summary, totalCount, loading, error, refetch, loadMore, hasMore, loadingMore }
}
