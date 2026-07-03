import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { exitsApi } from '@/features/exits/api'
import type { CreateExitDTO, Exit, UpdateExitDTO } from '@/features/exits/types'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import { extractErrorMessage } from '@/shared/hooks/use-resource'

export interface ExitFilters {
  itemId?: number
  recipientId?: number
  since?: string
  until?: string
}

/** List hook: infinite scroll, optional item/recipient/date filters. */
export function useExits(filters?: ExitFilters) {
  const params: Record<string, string | number> = {}
  if (filters?.itemId) params.itemId = filters.itemId
  if (filters?.recipientId) params.recipientId = filters.recipientId
  if (filters?.since) params.since = filters.since
  if (filters?.until) params.until = filters.until
  const activeParams = Object.keys(params).length > 0 ? params : undefined

  const query = useInfiniteQuery({
    queryKey: ['exits', activeParams],
    queryFn: ({ pageParam }) =>
      exitsApi.getAll({ limit: DEFAULT_PAGE_SIZE, page: pageParam as number, ...activeParams }),
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

interface UseExitReturn {
  data: Exit | null
  loading: boolean
  error: string | null
  notFound: boolean
}

/** Fetches a single exit by id. Distinguishes 404 (`notFound`) from other errors. */
export function useExit(id: number | string | undefined): UseExitReturn {
  const query = useQuery({
    queryKey: ['exits', id],
    queryFn: () => exitsApi.getById(id!),
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

export function useCreateExit() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateExitDTO) => exitsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const createExit = async (payload: CreateExitDTO): Promise<Exit | null> => {
    try {
      return await mutation.mutateAsync(payload)
    } catch {
      return null
    }
  }

  return { createExit, submitting: mutation.isPending }
}

export function useUpdateExit() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateExitDTO }) =>
      exitsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const updateExit = async (
    id: number | string,
    payload: UpdateExitDTO
  ): Promise<Exit | null> => {
    try {
      return await mutation.mutateAsync({ id, payload })
    } catch {
      return null
    }
  }

  return { updateExit, submitting: mutation.isPending }
}

export function useArchiveExit() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: number | string) => exitsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const archiveExit = async (id: number | string): Promise<boolean> => {
    try {
      await mutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return { archiveExit, submitting: mutation.isPending }
}
