import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { FormField } from '@/shared/components/form-field'
import { Button } from '@/shared/components/ui/button'
import { FieldGroup } from '@/shared/components/ui/field'
import { personSchema, type PersonFormValues } from '@/features/persons/schemas'

const EMPTY_VALUES: PersonFormValues = {
  names: '',
  surnames: '',
  dniType: 'V',
  dniNumber: '',
  phone: '',
  address: '',
  notes: '',
}

interface PersonFormProps {
  /** Pre-populated values for edit mode. Loaded asynchronously — the form resets when this changes. */
  defaultValues?: PersonFormValues
  onSubmit: (values: PersonFormValues) => Promise<void> | void
  submitting?: boolean
  submitLabel?: string
}

/** Reusable create/edit form for Persons. Field-level Spanish validation via `personSchema`. */
export function PersonForm({
  defaultValues,
  onSubmit,
  submitting = false,
  submitLabel = 'Guardar',
}: PersonFormProps) {
  const { control, handleSubmit } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: EMPTY_VALUES,
    // Reactive default values: resets the form whenever `defaultValues` changes
    // (e.g. once the edit page's async `usePerson` fetch resolves).
    values: defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Personal data section */}
      <section aria-labelledby="section-personal">
        <h2
          id="section-personal"
          className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Datos personales
        </h2>
        <FieldGroup>
          <FormField
            control={control}
            name="names"
            label="Nombres"
            placeholder="Nombres"
            required
          />
          <FormField
            control={control}
            name="surnames"
            label="Apellidos"
            placeholder="Apellidos"
            required
          />
          <FormField control={control} name="dniNumber" label="DNI" placeholder="12345678" />
        </FieldGroup>
      </section>

      {/* Contact section */}
      <section aria-labelledby="section-contact">
        <h2
          id="section-contact"
          className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Contacto
        </h2>
        <FieldGroup>
          <FormField control={control} name="phone" label="Teléfono" placeholder="4141234567" />
          <FormField
            control={control}
            name="address"
            label="Dirección"
            variant="textarea"
            placeholder="Dirección"
          />
        </FieldGroup>
      </section>

      {/* Notes section */}
      <section aria-labelledby="section-notes">
        <h2
          id="section-notes"
          className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Notas
        </h2>
        <FieldGroup>
          <FormField
            control={control}
            name="notes"
            label="Notas adicionales"
            variant="textarea"
            placeholder="Notas adicionales"
          />
        </FieldGroup>
      </section>

      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Guardando…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
