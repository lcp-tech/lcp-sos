import { useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { BarcodeScanner } from '@/shared/components/barcode-scanner'
import { itemSchema, type ItemFormValues } from '@/features/items/schemas'

const UNIT_CHIPS = ['Kilogramos (kg)', 'Unidades', 'Litros', 'Cajas', 'Blísters']

const EMPTY: ItemFormValues = { name: '', barcode: '', unit: '' }

export interface ItemDrawerFormProps {
  defaultValues?: ItemFormValues
  /** Existing image URL (for edit mode). */
  existingImageUrl?: string | null
  onSubmit: (values: ItemFormValues, file: File | null) => Promise<void> | void
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
  existingImageUrl,
  onSubmit,
  submitting = false,
  formError = '',
  title = 'Nuevo artículo',
  submitLabel = 'Crear artículo',
}: ItemDrawerFormProps) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: EMPTY,
    values: defaultValues,
  })

  function handleScan(code: string) {
    setValue('barcode', code, { shouldValidate: true, shouldDirty: true })
    setScannerOpen(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function removeImage() {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onFormSubmit(values: ItemFormValues) {
    onSubmit(values, selectedFile)
  }

  return (
    <>
      <div className="scrollarea" style={{ overflowY: 'auto', padding: '6px 22px 30px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.4px', margin: '2px 0 20px' }}>
          {title}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
          {/* Image upload */}
          <label style={LABEL_STYLE}>
            Foto del artículo <span style={OPTIONAL_STYLE}>· opcional</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {previewUrl ? (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{
                  width: '100%',
                  height: 160,
                  objectFit: 'cover',
                  borderRadius: 14,
                  border: '1.5px solid #e6ebf1',
                }}
              />
              <button
                type="button"
                onClick={removeImage}
                aria-label="Quitar imagen"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(12,26,40,.6)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: '#f5f7fa',
                border: '1.5px dashed #c5d0db',
                borderRadius: 14,
                padding: '22px 16px',
                cursor: 'pointer',
                color: '#5c7186',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                marginBottom: 16,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7a8a98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              Tomar foto o elegir de galería
            </button>
          )}

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
