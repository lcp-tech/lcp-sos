import { apiClient } from '@/shared/api/client'
import type { InventoryResponse } from '@/features/inventory/types'
import type { ResourceListParams } from '@/shared/api/resource-factory'

/**
 * Inventory is read-only (no create/update/archive), so it does not go
 * through `createResourceApi` — a direct GET call is all that's needed.
 * basePath is `/bo/donations/inventory`, confirmed backend route, accepting
 * `name`/`barcode`/`status`/`limit`/`page` query params.
 *
 * The response shape differs from `PaginatedResponse<T>` by including a
 * `summary` field at the root — handled here as `InventoryResponse`.
 */
async function getAll(params?: ResourceListParams): Promise<InventoryResponse> {
  const { data } = await apiClient.get<InventoryResponse>(
    '/bo/donations/inventory',
    { params }
  )
  return data
}

/**
 * Exposes only `getAll`, returning the full `InventoryResponse` (data +
 * pagination + summary). The hook adapts the extra `summary` field from
 * the resolved response.
 */
export const inventoryApi = { getAll }
