import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { itemsApi } from '@/features/items/api'
import type { CreateItemDTO, Item, UpdateItemDTO } from '@/features/items/types'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import { extractErrorMessage } from '@/shared/hooks/use-resource'

export interface ItemFilters {
  name?: string
  barcode?: string
}

/** List hook: infinite scroll, optional name/barcode filter via API. */
export function useItems(filters?: ItemFilters) {
  const params: Record<string, string> = {}
  if (filters?.name) params.name = filters.name
  if (filters?.barcode) params.barcode = filters.barcode
  const paramsKey = Object.keys(params).length > 0 ? params : undefined

  const query = useInfiniteQuery({
    queryKey: ['items', paramsKey],
    queryFn: ({ pageParam }) =>
      itemsApi.getAll({ limit: DEFAULT_PAGE_SIZE, page: pageParam as number, ...paramsKey }),
    getNextPageParam: (last) =>
      last.pagination?.hasNextPage ? last.pagination.currentPage + 1 : undefined,
    initialPageParam: 1,
  })

  return {
    data: query.data?.pages.flatMap((p) => p.data) ?? [],
    totalCount:
      query.data?.pages[0]?.pagination?.totalItems ??
      (query.data?.pages.flatMap((p) => p.data).length ?? 0),
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error ? extractErrorMessage(query.error) : null,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  }
}

interface UseItemReturn {
  data: Item | null
  loading: boolean
  error: string | null
  notFound: boolean
}

/** Fetches a single item by id. Distinguishes 404 (`notFound`) from other errors. */
export function useItem(id: number | string | undefined): UseItemReturn {
  const query = useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsApi.getById(id!),
    enabled: id != null,
  })

  const notFound =
    (query.error as { response?: { status?: number } } | null)?.response?.status === 404

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error && !notFound ? extractErrorMessage(query.error) : null,
    notFound,
  }
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateItemDTO) => itemsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const createItem = async (payload: CreateItemDTO): Promise<Item | null> => {
    try {
      return await mutation.mutateAsync(payload)
    } catch {
      return null
    }
  }

  return { createItem, submitting: mutation.isPending }
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateItemDTO }) =>
      itemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const updateItem = async (
    id: number | string,
    payload: UpdateItemDTO
  ): Promise<Item | null> => {
    try {
      return await mutation.mutateAsync({ id, payload })
    } catch {
      return null
    }
  }

  return { updateItem, submitting: mutation.isPending }
}

export function useArchiveItem() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: number | string) => itemsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const archiveItem = async (id: number | string): Promise<boolean> => {
    try {
      await mutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return { archiveItem, submitting: mutation.isPending }
}
