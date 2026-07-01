import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { SelectorDrawer } from '@/shared/components/selector-drawer'
import { itemsApi } from '@/features/items/api'
import { personsApi } from '@/features/persons/api'
import { buildExitSchema, type ExitFormValues } from '@/features/exits/schemas'
import type { Item } from '@/features/items/types'
import type { Person } from '@/features/persons/types'

interface ExitDrawerFormProps {
  mode?: 'create' | 'edit'
  defaultValues?: Partial<ExitFormValues>
  preselectedItem?: Item | null
  preselectedPerson?: Person | null
  onSubmit: (values: ExitFormValues) => Promise<void> | void
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

export function ExitDrawerForm({
  mode = 'create',
  defaultValues,
  preselectedItem = null,
  preselectedPerson = null,
  onSubmit,
  submitting = false,
  formError = '',
  title = 'Nueva salida',
  submitLabel = 'Registrar salida',
}: ExitDrawerFormProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(preselectedItem)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(preselectedPerson)
  const [selectorOpen, setSelectorOpen] = useState<'item' | 'person' | null>(null)

  const schema = buildExitSchema(mode)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: preselectedItem?.id ?? null,
      quantity: '',
      recipientId: preselectedPerson?.id ?? null,
      notes: '',
      ...defaultValues,
    },
  })

  function handleItemSelect(item: Item) {
    setSelectedItem(item)
    setValue('itemId', item.id, { shouldValidate: true })
    setSelectorOpen(null)
  }

  function handlePersonSelect(person: Person) {
    setSelectedPerson(person)
    setValue('recipientId', person.id, { shouldValidate: true })
    setSelectorOpen(null)
  }

  return (
    <>
      <div className="scrollarea" style={{ overflowY: 'auto', padding: '6px 22px 30px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.4px', margin: '2px 0 20px' }}>
          {title}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Article picker */}
          <label style={LABEL_STYLE}>Artículo <span style={{ color: '#c8392f' }}>*</span></label>
          <button
            type="button"
            onClick={() => setSelectorOpen('item')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: '#f5f7fa',
              border: `1.5px solid ${errors.itemId ? '#c8392f' : '#e6ebf1'}`,
              borderRadius: 14,
              padding: '15px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: 16,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: selectedItem ? '#12212e' : '#9aa8b6' }}>
              {selectedItem ? selectedItem.name : 'Seleccionar artículo…'}
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2.2" strokeLinecap="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {errors.itemId && (
            <div style={{ color: '#c8392f', fontSize: 13, fontWeight: 600, marginTop: -10, marginBottom: 12 }}>
              {errors.itemId.message}
            </div>
          )}

          {/* Quantity + Unit */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1.4 }}>
              <label style={LABEL_STYLE}>Cantidad <span style={{ color: '#c8392f' }}>*</span></label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                style={{ ...INPUT_STYLE, border: `1.5px solid ${errors.quantity ? '#c8392f' : '#e6ebf1'}` }}
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <div style={{ color: '#c8392f', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                  {errors.quantity.message}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={LABEL_STYLE}>Unidad</label>
              <div style={{
                background: '#eef2f6',
                border: '1.5px solid #e6ebf1',
                borderRadius: 14,
                padding: '15px 14px',
                fontSize: 13.5,
                fontWeight: 600,
                color: '#5c7186',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {selectedItem?.unit ?? '—'}
              </div>
            </div>
          </div>

          {/* Recipient picker (optional) */}
          <label style={LABEL_STYLE}>
            Beneficiario <span style={OPTIONAL_STYLE}>· opcional</span>
          </label>
          <button
            type="button"
            onClick={() => setSelectorOpen('person')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: '#f5f7fa',
              border: '1.5px solid #e6ebf1',
              borderRadius: 14,
              padding: '15px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: 16,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: selectedPerson ? '#12212e' : '#9aa8b6' }}>
              {selectedPerson ? `${selectedPerson.names} ${selectedPerson.surnames}` : 'Seleccionar beneficiario…'}
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2.2" strokeLinecap="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Notes (optional) */}
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

      {/* Item selector */}
      <SelectorDrawer
        open={selectorOpen === 'item'}
        title="Seleccionar artículo"
        placeholder="Buscar artículo…"
        showScan={true}
        onBack={() => setSelectorOpen(null)}
        fetchRows={async (q) => {
          const isBarcode = /^\d+$/.test(q.trim())
          const res = await itemsApi.getAll({
            ...(isBarcode ? { barcode: q.trim() } : { name: q }),
            limit: 20,
          })
          return res.data.map((item) => ({
            id: item.id,
            title: item.name,
            sub: item.barcode ?? '',
            iconBg: '#eaf1f7',
            iconColor: '#2c6ea0',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2c6ea0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>
              </svg>
            ),
            data: item,
          }))
        }}
        onSelect={(row) => handleItemSelect(row.data as Item)}
      />

      {/* Person selector */}
      <SelectorDrawer
        open={selectorOpen === 'person'}
        title="Seleccionar beneficiario"
        placeholder="Buscar persona…"
        onBack={() => setSelectorOpen(null)}
        fetchRows={async (q) => {
          const res = await personsApi.getAll({ names: q, limit: 20 })
          return res.data.map((p, i) => {
            const palettes = [['#eaf1f7','#2c6ea0'],['#e9f3ec','#2f9e6a'],['#f5edda','#b5851f'],['#f3e9f0','#9a4d84'],['#eae9f5','#5a52a0']]
            const [bg, color] = palettes[i % palettes.length]
            const initials = ((p.names[0] ?? '') + (p.surnames[0] ?? '')).toUpperCase()
            return {
              id: p.id,
              title: `${p.names} ${p.surnames}`,
              sub: p.dni ?? p.phone ?? '',
              iconBg: bg,
              iconColor: color,
              icon: <span style={{ fontWeight: 800, fontSize: 13 }}>{initials}</span>,
              data: p,
            }
          })
        }}
        onSelect={(row) => handlePersonSelect(row.data as Person)}
      />
    </>
  )
}
