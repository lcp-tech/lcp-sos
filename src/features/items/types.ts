/**
 * An inventory item entity.
 *
 * NOTE: audit field shape (`createdBy`/`updatedBy` as `number`, nullable
 * `updatedAt`) mirrors the confirmed Persons contract (see
 * `src/features/persons/types.ts`) and intentionally does NOT reuse the
 * shared `AuditFields` type from `src/shared/lib/types.ts`.
 */
export interface Item {
  id: number
  name: string
  barcode: string | null
  unit: string | null
  url: string | null
  createdAt: string
  createdBy: number
  updatedAt: string | null
  updatedBy: number | null
  archivedAt: string | null
  archivedBy: number | null
}

export interface CreateItemDTO {
  name: string
  barcode?: string | null
  unit?: string | null
}

export type UpdateItemDTO = CreateItemDTO
