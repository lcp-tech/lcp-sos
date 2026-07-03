import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { personsApi } from '@/features/persons/api'
import type { CreatePersonDTO, Person, UpdatePersonDTO } from '@/features/persons/types'
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants'
import { extractErrorMessage } from '@/shared/hooks/use-resource'

export interface PersonFilters {
  names?: string
  dni?: string
}

/** List hook: infinite scroll, optional names/DNI filter via API. */
export function usePersons(filters?: PersonFilters) {
  const params: Record<string, string> = {}
  if (filters?.names) params.names = filters.names
  if (filters?.dni) params.dni = filters.dni
  const paramsKey = Object.keys(params).length > 0 ? params : undefined

  const query = useInfiniteQuery({
    queryKey: ['persons', paramsKey],
    queryFn: ({ pageParam }) =>
      personsApi.getAll({ limit: DEFAULT_PAGE_SIZE, page: pageParam as number, ...paramsKey }),
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

interface UsePersonReturn {
  data: Person | null
  loading: boolean
  error: string | null
  notFound: boolean
}

/** Fetches a single person by id. Distinguishes 404 (`notFound`) from other errors. */
export function usePerson(id: number | string | undefined): UsePersonReturn {
  const query = useQuery({
    queryKey: ['persons', id],
    queryFn: () => personsApi.getById(id!),
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

export function useCreatePerson() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreatePersonDTO) => personsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const createPerson = async (payload: CreatePersonDTO): Promise<Person | null> => {
    try {
      return await mutation.mutateAsync(payload)
    } catch {
      return null
    }
  }

  return { createPerson, submitting: mutation.isPending }
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdatePersonDTO }) =>
      personsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const updatePerson = async (
    id: number | string,
    payload: UpdatePersonDTO
  ): Promise<Person | null> => {
    try {
      return await mutation.mutateAsync({ id, payload })
    } catch {
      return null
    }
  }

  return { updatePerson, submitting: mutation.isPending }
}

export function useArchivePerson() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: number | string) => personsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const archivePerson = async (id: number | string): Promise<boolean> => {
    try {
      await mutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return { archivePerson, submitting: mutation.isPending }
}
