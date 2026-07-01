import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { BarcodeScanner } from '@/shared/components/barcode-scanner'
import { itemSchema, type ItemFormValues } from '@/features/items/schemas'

const UNIT_CHIPS = ['Kilogramos (kg)', 'Unidades', 'Litros', 'Cajas', 'Blísters']

const EMPTY: ItemFormValues = { name: '', barcode: '', unit: '' }

interface ItemDrawerFormProps {
  defaultValues?: ItemFormValues
  onSubmit: (values: ItemFormValues) => Promise<void> | void
  submitting?: boolean
  formError?: string
  title?: string
  submitLabel?: string
}

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

export function ItemDrawerForm({
  defaultValues,
  onSubmit,
  submitting = false,
  formError = '',
  title = 'Nuevo artículo',
  submitLabel = 'Crear artículo',
}: ItemDrawerFormProps) {
  const [scannerOpen, setScannerOpen] = useState(false)

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: EMPTY,
    values: defaultValues,
  })

  function handleScan(code: string) {
    setValue('barcode', code, { shouldValidate: true, shouldDirty: true })
    setScannerOpen(false)
  }

  return (
    <>
      <div className="scrollarea" style={{ overflowY: 'auto', padding: '6px 22px 30px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.4px', margin: '2px 0 20px' }}>
          {title}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Item name */}
          <label style={LABEL_STYLE}>Nombre del artículo <span style={{ color: '#c8392f' }}>*</span></label>
          <input
            placeholder="Harina de Maíz Precocida (1kg)"
            style={{ ...INPUT_STYLE, border: `1.5px solid ${errors.name ? '#c8392f' : '#e6ebf1'}`, marginBottom: 16 }}
            {...register('name')}
          />
          {errors.name && (
            <div style={{ color: '#c8392f', fontSize: 12, fontWeight: 600, marginTop: -10, marginBottom: 10 }}>{errors.name.message}</div>
          )}

          {/* Barcode */}
          <label style={LABEL_STYLE}>
            Código de barras <span style={OPTIONAL_STYLE}>· opcional</span>
          </label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              placeholder="7591016000010"
              style={{ ...INPUT_STYLE, flex: 1, fontFamily: 'ui-monospace, monospace' }}
              {...register('barcode')}
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              aria-label="Escanear código de barras"
              style={{
                flexShrink: 0,
                width: 54,
                background: 'linear-gradient(180deg, #1d6299, #165382)',
                border: 'none',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <path d="M3 12h18"/>
              </svg>
            </button>
          </div>

          {/* Unit chips */}
          <label style={LABEL_STYLE}>Unidad de medida</label>
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {UNIT_CHIPS.map((u) => {
                  const active = field.value === u
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => field.onChange(active ? '' : u)}
                      style={{
                        border: `1.5px solid ${active ? '#165382' : '#e6ebf1'}`,
                        background: active ? '#165382' : '#f5f7fa',
                        color: active ? '#fff' : '#5c7186',
                        borderRadius: 12,
                        padding: '11px 15px',
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {u}
                    </button>
                  )
                })}
              </div>
            )}
          />

          {formError && (
            <div style={{ color: '#c8392f', fontSize: 13, fontWeight: 600, marginTop: 16, textAlign: 'center', background: '#fdeceb', padding: 11, borderRadius: 12 }}>
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 22,
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

      <BarcodeScanner
        open={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />
    </>
  )
}
