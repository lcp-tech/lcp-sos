import type { Item } from '@/features/items/types'
import type { PaginatedResponse } from '@/shared/lib/types'

/** Read-only stock snapshot for an item: entries in, exits out, net available. */
export interface InventoryItem {
  item: Item
  totalEntries: number
  totalExits: number
  available: number
}

/** Summary counters returned at the root of the inventory API response. */
export interface InventorySummary {
  available: number
  low: number
  outOfStock: number
  negative: number
}

/** Full inventory API response including pagination and summary. */
export interface InventoryResponse extends PaginatedResponse<InventoryItem> {
  summary: InventorySummary
}

/** Accepted values for the `status` filter query param. */
export type InventoryStatus = 'available' | 'low' | 'out_of_stock' | 'negative'
