import { useEffect, useMemo, useState } from 'react'

import { entriesApi } from '@/features/entries/api'
import type { CreateEntryDTO, Entry, UpdateEntryDTO } from '@/features/entries/types'
import {
  extractErrorMessage,
  useResourceList,
  useResourceMutation,
  type UseResourceListOptions,
} from '@/shared/hooks/use-resource'

export interface EntryFilters {
  itemId?: number
  donorId?: number
  since?: string
  until?: string
}

/** List hook: paginated, debounced free-text search, plus optional item/donor/date filters. */
export function useEntries(
  filters?: EntryFilters,
  options?: Pick<UseResourceListOptions, 'pageSize'>
) {
  const mergedFilters = useMemo(() => {
    const merged: Record<string, string | number> = {}
    if (filters?.itemId) merged.itemId = filters.itemId
    if (filters?.donorId) merged.donorId = filters.donorId
    if (filters?.since) merged.since = filters.since
    if (filters?.until) merged.until = filters.until
    return Object.keys(merged).length > 0 ? merged : undefined
  }, [filters?.itemId, filters?.donorId, filters?.since, filters?.until])

  return useResourceList<Entry>(entriesApi, { ...options, filters: mergedFilters })
}

interface UseEntryReturn {
  data: Entry | null
  loading: boolean
  error: string | null
  notFound: boolean
}

/** Fetches a single entry by id. Distinguishes 404 (`notFound`) from other errors. */
export function useEntry(id: number | string | undefined): UseEntryReturn {
  const [data, setData] = useState<Entry | null>(null)
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
        const entry = await entriesApi.getById(id as number | string)
        if (!cancelled) setData(entry)
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

export function useCreateEntry() {
  const { create, submitting } = useResourceMutation<Entry, CreateEntryDTO, UpdateEntryDTO>(
    entriesApi
  )
  return { createEntry: create, submitting }
}

export function useUpdateEntry() {
  const { update, submitting } = useResourceMutation<Entry, CreateEntryDTO, UpdateEntryDTO>(
    entriesApi
  )
  return { updateEntry: update, submitting }
}

export function useArchiveEntry() {
  const { archive, submitting } = useResourceMutation<Entry, CreateEntryDTO, UpdateEntryDTO>(
    entriesApi
  )
  return { archiveEntry: archive, submitting }
}
