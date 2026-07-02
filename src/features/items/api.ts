import { apiClient } from '@/shared/api/client'
import { createResourceApi } from '@/shared/api/resource-factory'
import type { CreateItemDTO, Item, UpdateItemDTO } from '@/features/items/types'

/**
 * Items CRUD client.
 *
 * basePath is `/bo/donations/items` (backend-office donations module),
 * confirmed backend route (same module family as `/bo/donations/persons`).
 *
 * `getAll()` (from `createResourceApi`) already accepts arbitrary query
 * params, so the `barcode` filter is supported without a bespoke wrapper —
 * see `useItems` in `hooks.ts`.
 */
export const itemsApi = {
  ...createResourceApi<Item, CreateItemDTO, UpdateItemDTO>('/bo/donations/items'),

  /** Upload an image/file for an item. Returns the updated item with `url` populated. */
  async uploadFile(id: number, file: File): Promise<Item> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.put<Item>(`/bo/donations/items/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Remove the file from an item. Returns the updated item with `url: null`. */
  async deleteFile(id: number): Promise<Item> {
    const { data } = await apiClient.put<Item>(`/bo/donations/items/${id}/file`)
    return data
  },
}
