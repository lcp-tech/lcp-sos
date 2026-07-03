import { useInfiniteQuery } from '@tanstack/react-query'

import { inventoryApi } from '@/features/inventory/api'
import type { InventoryItem, InventorySummary, InventoryStatus } from '@/features/inventory/types'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import { extractErrorMessage } from '@/shared/hooks/use-resource'

export interface InventoryFilters {
  name?: string
  barcode?: string
  status?: InventoryStatus
}

const EMPTY_SUMMARY: InventorySummary = { available: 0, low: 0, outOfStock: 0, negative: 0 }

/**
 * Read-only inventory list hook: infinite scroll plus `name`/`barcode`/`status` filters.
 *
 * The inventory endpoint returns `{ data, pagination, summary }` — the `summary`
 * is captured from the first page and stays stable across load-more calls.
 */
export function useInventory(filters?: InventoryFilters) {
  const params: Record<string, string | number> = {}
  if (filters?.name) params.name = filters.name
  if (filters?.barcode) params.barcode = filters.barcode
  if (filters?.status) params.status = filters.status
  const activeParams = Object.keys(params).length > 0 ? params : undefined

  const query = useInfiniteQuery({
    queryKey: ['inventory', activeParams],
    queryFn: ({ pageParam }) =>
      inventoryApi.getAll({ limit: DEFAULT_PAGE_SIZE, page: pageParam as number, ...activeParams }),
    getNextPageParam: (last) =>
      last.pagination?.hasNextPage ? last.pagination.currentPage + 1 : undefined,
    initialPageParam: 1,
  })

  const allItems: InventoryItem[] = query.data?.pages.flatMap((p) => p.data) ?? []
  // summary is returned on every page but is stable — use the first page's value
  const summary: InventorySummary = query.data?.pages[0]?.summary ?? EMPTY_SUMMARY

  return {
    data: allItems,
    summary,
    totalCount:
      query.data?.pages[0]?.pagination?.totalItems ?? allItems.length,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error ? extractErrorMessage(query.error) : null,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  }
}
