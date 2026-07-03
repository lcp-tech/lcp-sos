import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { entriesApi } from '@/features/entries/api'
import type { CreateEntryDTO, Entry, UpdateEntryDTO } from '@/features/entries/types'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import { extractErrorMessage } from '@/shared/hooks/use-resource'

export interface EntryFilters {
  itemId?: number
  donorId?: number
  since?: string
  until?: string
}

/** List hook: infinite scroll, optional item/donor/date filters. */
export function useEntries(filters?: EntryFilters) {
  const params: Record<string, string | number> = {}
  if (filters?.itemId) params.itemId = filters.itemId
  if (filters?.donorId) params.donorId = filters.donorId
  if (filters?.since) params.since = filters.since
  if (filters?.until) params.until = filters.until
  const activeParams = Object.keys(params).length > 0 ? params : undefined

  const query = useInfiniteQuery({
    queryKey: ['entries', activeParams],
    queryFn: ({ pageParam }) =>
      entriesApi.getAll({ limit: DEFAULT_PAGE_SIZE, page: pageParam as number, ...activeParams }),
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

interface UseEntryReturn {
  data: Entry | null
  loading: boolean
  error: string | null
  notFound: boolean
}

/** Fetches a single entry by id. Distinguishes 404 (`notFound`) from other errors. */
export function useEntry(id: number | string | undefined): UseEntryReturn {
  const query = useQuery({
    queryKey: ['entries', id],
    queryFn: () => entriesApi.getById(id!),
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

export function useCreateEntry() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateEntryDTO) => entriesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const createEntry = async (payload: CreateEntryDTO): Promise<Entry | null> => {
    try {
      return await mutation.mutateAsync(payload)
    } catch {
      return null
    }
  }

  return { createEntry, submitting: mutation.isPending }
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateEntryDTO }) =>
      entriesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const updateEntry = async (
    id: number | string,
    payload: UpdateEntryDTO
  ): Promise<Entry | null> => {
    try {
      return await mutation.mutateAsync({ id, payload })
    } catch {
      return null
    }
  }

  return { updateEntry, submitting: mutation.isPending }
}

export function useArchiveEntry() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: number | string) => entriesApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const archiveEntry = async (id: number | string): Promise<boolean> => {
    try {
      await mutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return { archiveEntry, submitting: mutation.isPending }
}
