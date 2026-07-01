import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { personSchema, DNI_LIMITS, type PersonFormValues } from '@/features/persons/schemas'

interface PersonDrawerFormProps {
  defaultValues?: PersonFormValues
  onSubmit: (values: PersonFormValues) => Promise<void> | void
  submitting?: boolean
  formError?: string
  title?: string
  submitLabel?: string
}

const EMPTY: PersonFormValues = { names: '', surnames: '', dniType: 'V', dniNumber: '', phone: '', address: '', notes: '' }

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#f5f7fa',
  border: '1.5px solid #e6ebf1',
  borderRadius: 14,
  padding: '15px 16px',
  fontSize: 15,
  fontWeight: 600,
  color: '#12212e',
  outline: 'none',
  fontFamily: 'inherit',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#3a4d5e',
  marginBottom: 8,
  display: 'block',
}

const OPTIONAL_STYLE: React.CSSProperties = {
  color: '#a7b3bf',
  fontWeight: 500,
}

export function PersonDrawerForm({
  defaultValues,
  onSubmit,
  submitting = false,
  formError = '',
  title = 'Nueva persona',
  submitLabel = 'Crear persona',
}: PersonDrawerFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: EMPTY,
    values: defaultValues,
  })

  const dniType = useWatch({ control, name: 'dniType' }) ?? 'V'
  const limits = DNI_LIMITS[dniType] ?? { min: 6, max: 8 }

  return (
    <div className="scrollarea" style={{ overflowY: 'auto', padding: '6px 22px 30px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.4px', margin: '2px 0 20px' }}>
        {title}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Names + Surnames row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Nombres <span style={{ color: '#c8392f' }}>*</span></label>
            <input
              placeholder="María"
              style={{ ...INPUT_STYLE, border: `1.5px solid ${errors.names ? '#c8392f' : '#e6ebf1'}` }}
              {...register('names')}
            />
            {errors.names && (
              <div style={{ color: '#c8392f', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{errors.names.message}</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Apellidos <span style={{ color: '#c8392f' }}>*</span></label>
            <input
              placeholder="González"
              style={{ ...INPUT_STYLE, border: `1.5px solid ${errors.surnames ? '#c8392f' : '#e6ebf1'}` }}
              {...register('surnames')}
            />
            {errors.surnames && (
              <div style={{ color: '#c8392f', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{errors.surnames.message}</div>
            )}
          </div>
        </div>

        {/* DNI: type select + number input */}
        <label style={LABEL_STYLE}>
          Cédula / DNI <span style={OPTIONAL_STYLE}>· opcional</span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select
            {...register('dniType')}
            style={{
              width: 72,
              flexShrink: 0,
              background: '#f5f7fa',
              border: '1.5px solid #e6ebf1',
              borderRadius: 14,
              padding: '15px 8px 15px 14px',
              fontSize: 15,
              fontWeight: 700,
              color: '#12212e',
              outline: 'none',
              fontFamily: 'inherit',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239aa8b6' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            <option value="V">V</option>
            <option value="E">E</option>
            <option value="P">P</option>
          </select>
          <input
            inputMode="numeric"
            placeholder={`${limits.min}–${limits.max} dígitos`}
            maxLength={limits.max}
            style={{
              ...INPUT_STYLE,
              flex: 1,
              border: `1.5px solid ${errors.dniNumber ? '#c8392f' : '#e6ebf1'}`,
            }}
            {...register('dniNumber')}
          />
        </div>
        {errors.dniNumber && (
          <div style={{ color: '#c8392f', fontSize: 12, fontWeight: 600, marginTop: -10, marginBottom: 10 }}>{errors.dniNumber.message}</div>
        )}

        {/* Phone */}
        <label style={LABEL_STYLE}>
          Teléfono <span style={OPTIONAL_STYLE}>· opcional</span>
        </label>
        <input
          inputMode="numeric"
          placeholder="4141234567"
          style={{ ...INPUT_STYLE, border: `1.5px solid ${errors.phone ? '#c8392f' : '#e6ebf1'}`, marginBottom: 16 }}
          {...register('phone')}
        />
        {errors.phone && (
          <div style={{ color: '#c8392f', fontSize: 12, fontWeight: 600, marginTop: -10, marginBottom: 10 }}>{errors.phone.message}</div>
        )}

        {/* Address */}
        <label style={LABEL_STYLE}>
          Dirección <span style={OPTIONAL_STYLE}>· opcional</span>
        </label>
        <input
          placeholder="Av. Principal, Caracas"
          style={{ ...INPUT_STYLE, marginBottom: 16 }}
          {...register('address')}
        />

        {/* Notes */}
        <label style={LABEL_STYLE}>
          Notas <span style={OPTIONAL_STYLE}>· opcional</span>
        </label>
        <textarea
          placeholder="Observaciones…"
          rows={2}
          style={{ ...INPUT_STYLE, resize: 'none', lineHeight: 1.4, fontWeight: 500 }}
          {...register('notes')}
        />

        {formError && (
          <div style={{ color: '#c8392f', fontSize: 13, fontWeight: 600, marginTop: 14, textAlign: 'center', background: '#fdeceb', padding: 11, borderRadius: 12 }}>
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 20,
            width: '100%',
            background: 'linear-gradient(180deg, #1d6299, #165382)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: 17,
            fontSize: 16,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </form>
    </div>
  )
}
