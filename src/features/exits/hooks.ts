import { useEffect, useMemo, useState } from 'react'

import { exitsApi } from '@/features/exits/api'
import type { CreateExitDTO, Exit, UpdateExitDTO } from '@/features/exits/types'
import {
  extractErrorMessage,
  useResourceList,
  useResourceMutation,
  type UseResourceListOptions,
} from '@/shared/hooks/use-resource'

export interface ExitFilters {
  itemId?: number
  recipientId?: number
  since?: string
  until?: string
}

/** List hook: paginated, debounced free-text search, plus optional item/recipient/date filters. */
export function useExits(
  filters?: ExitFilters,
  options?: Pick<UseResourceListOptions, 'pageSize'>
) {
  const mergedFilters = useMemo(() => {
    const merged: Record<string, string | number> = {}
    if (filters?.itemId) merged.itemId = filters.itemId
    if (filters?.recipientId) merged.recipientId = filters.recipientId
    if (filters?.since) merged.since = filters.since
    if (filters?.until) merged.until = filters.until
    return Object.keys(merged).length > 0 ? merged : undefined
  }, [filters?.itemId, filters?.recipientId, filters?.since, filters?.until])

  return useResourceList<Exit>(exitsApi, { ...options, filters: mergedFilters })
}

interface UseExitReturn {
  data: Exit | null
  loading: boolean
  error: string | null
  notFound: boolean
}

/** Fetches a single exit by id. Distinguishes 404 (`notFound`) from other errors. */
export function useExit(id: number | string | undefined): UseExitReturn {
  const [data, setData] = useState<Exit | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (id == null) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setNotFound(false)

      try {
        const exit = await exitsApi.getById(id as number | string)
        if (!cancelled) setData(exit)
      } catch (err) {
        if (cancelled) return
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          setNotFound(true)
        } else {
          setError(extractErrorMessage(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  return { data, loading, error, notFound }
}

export function useCreateExit() {
  const { create, submitting } = useResourceMutation<Exit, CreateExitDTO, UpdateExitDTO>(exitsApi)
  return { createExit: create, submitting }
}

export function useUpdateExit() {
  const { update, submitting } = useResourceMutation<Exit, CreateExitDTO, UpdateExitDTO>(exitsApi)
  return { updateExit: update, submitting }
}

export function useArchiveExit() {
  const { archive, submitting } = useResourceMutation<Exit, CreateExitDTO, UpdateExitDTO>(
    exitsApi
  )
  return { archiveExit: archive, submitting }
}
