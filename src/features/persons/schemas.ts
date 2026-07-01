import { z } from 'zod'

import type { CreatePersonDTO, Person } from '@/features/persons/types'

/** 10 digits starting with a valid Venezuelan mobile/landline prefix. */
const PHONE_REGEX = /^(412|422|414|424|416|426)\d{7}$/

/** DNI digit limits by type: V (6-8), E (6-10), P (5-15). */
const DNI_LIMITS: Record<string, { min: number; max: number }> = {
  V: { min: 6, max: 8 },
  E: { min: 6, max: 10 },
  P: { min: 5, max: 15 },
}

export const personSchema = z.object({
  names: z
    .string()
    .trim()
    .min(1, 'Los nombres son obligatorios')
    .max(100, 'Máximo 100 caracteres'),
  surnames: z
    .string()
    .trim()
    .min(1, 'Los apellidos son obligatorios')
    .max(100, 'Máximo 100 caracteres'),
  dniType: z.enum(['V', 'E', 'P']),
  dniNumber: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), {
      message: 'Solo números',
    }),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || PHONE_REGEX.test(value), {
      message: 'Teléfono inválido: 10 dígitos con prefijo válido (412, 414, 416, 422, 424, 426)',
    }),
  address: z.string(),
  notes: z.string(),
}).refine(
  (data) => {
    if (!data.dniNumber) return true
    const limits = DNI_LIMITS[data.dniType]
    if (!limits) return true
    return data.dniNumber.length >= limits.min && data.dniNumber.length <= limits.max
  },
  {
    message: 'Número de cédula inválido',
    path: ['dniNumber'],
  }
)

export { DNI_LIMITS }

/**
 * Form values are all plain strings (RHF-friendly). Optional backend fields
 * use `''` for "empty", converted to `null` at the DTO boundary — see
 * `toCreatePersonDTO`/`personToFormValues` below. This sidesteps Zod
 * input/output transform typing entirely.
 */
export type PersonFormValues = z.infer<typeof personSchema>

/** Maps validated form values to the API create/update payload shape. */
export function toCreatePersonDTO(values: PersonFormValues): CreatePersonDTO {
  const dni = values.dniNumber ? `${values.dniType}${values.dniNumber}` : null
  return {
    names: values.names,
    surnames: values.surnames,
    dni,
    phone: values.phone ? values.phone : null,
    address: values.address ? values.address : null,
    notes: values.notes ? values.notes : null,
  }
}

/** Maps a fetched `Person` to editable form values (`null` → `''`). */
export function personToFormValues(person: Person): PersonFormValues {
  let dniType: 'V' | 'E' | 'P' = 'V'
  let dniNumber = ''
  if (person.dni) {
    const match = person.dni.match(/^([VEP])(\d+)$/)
    if (match) {
      dniType = match[1] as 'V' | 'E' | 'P'
      dniNumber = match[2]
    } else {
      // Fallback: put the whole thing as number with default type
      dniNumber = person.dni.replace(/\D/g, '')
    }
  }
  return {
    names: person.names,
    surnames: person.surnames,
    dniType,
    dniNumber,
    phone: person.phone ?? '',
    address: person.address ?? '',
    notes: person.notes ?? '',
  }
}
