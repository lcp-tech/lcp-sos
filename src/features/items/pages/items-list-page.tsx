import { useState, useContext, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'

import { Drawer } from '@/shared/components/drawer'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AddContext } from '@/shared/layouts/app-layout'
import { useArchiveItem, useCreateItem, useItems, useUpdateItem } from '@/features/items/hooks'
import { toCreateItemDTO, type ItemFormValues } from '@/features/items/schemas'
import { ItemDrawerForm } from '@/features/items/components/item-drawer-form'
import type { Item } from '@/features/items/types'

import type { OutletCtxValue } from '@/shared/layouts/app-layout'

export function ItemsListPage() {
  const { searchValue, barcodeValue } = useOutletContext<OutletCtxValue>()
  const { data, loading, error, refetch } = useItems()
  const { archiveItem } = useArchiveItem()
  const { createItem, submitting: createSubmitting } = useCreateItem()
  const { updateItem, submitting: updateSubmitting } = useUpdateItem()

  const { registerAddHandler } = useContext(AddContext)

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    return registerAddHandler(() => { setFormError(''); setCreateOpen(true) })
  }, [registerAddHandler])

  const filterValue = barcodeValue || searchValue
  const filtered = filterValue
    ? data.filter(
        (item) =>
          item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
          (item.barcode && item.barcode.includes(filterValue))
      )
    : data

  async function handleCreate(values: ItemFormValues) {
    setFormError('')
    try {
      const item = await createItem(toCreateItemDTO(values))
      if (item) {
        setCreateOpen(false)
        toast.success('Artículo creado')
        refetch()
      }
    } catch {
      setFormError('No se pudo crear el artículo. Intentá de nuevo.')
    }
  }

  async function handleUpdate(values: ItemFormValues) {
    if (!selectedItem) return
    setFormError('')
    try {
      const ok = await updateItem(selectedItem.id, toCreateItemDTO(values))
      if (ok) {
        setEditOpen(false)
        toast.success('Artículo actualizado')
        refetch()
      }
    } catch {
      setFormError('No se pudo actualizar. Intentá de nuevo.')
    }
  }

  async function handleArchive() {
    if (!selectedItem) return
    const ok = await archiveItem(selectedItem.id)
    if (ok) {
      setDetailOpen(false)
      toast.success('Artículo archivado')
      refetch()
    }
  }

  function openDetail(item: Item) {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  return (
    <div style={{ animation: 'screenIn .32s ease' }}>
      {error && (
        <p style={{ color: '#c8392f', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>{error}</p>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-[18px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#9aa8b6', fontWeight: 500 }}>
          {filterValue ? 'Sin resultados' : 'No hay artículos registrados'}
        </div>
      ) : (
        <div>
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => openDetail(item)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: '#fff',
                border: '1.5px solid #e9edf2',
                borderRadius: 18,
                padding: '14px 15px',
                marginBottom: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                fontFamily: 'inherit',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.985)'; e.currentTarget.style.borderColor = '#cfdae4' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#e9edf2' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#e9edf2' }}
            >
              {/* Box icon */}
              <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 14, background: '#eaf1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2c6ea0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>
                </svg>
              </div>

              {/* Name + unit + barcode */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#122433', lineHeight: 1.25, marginBottom: 4 }}>
                  {item.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {item.unit && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#5c7186', background: '#eef2f6', padding: '2px 9px', borderRadius: 7 }}>
                      {item.unit}
                    </span>
                  )}
                  {item.barcode && (
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#a7b3bf', fontFamily: 'ui-monospace, monospace' }}>
                      {item.barcode}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c3ccd6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6"/>
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Create item drawer */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)}>
        <ItemDrawerForm
          onSubmit={handleCreate}
          submitting={createSubmitting}
          formError={formError}
        />
      </Drawer>

      {/* Detail drawer */}
      <Drawer open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selectedItem && (
          <div className="scrollarea" style={{ overflowY: 'auto', padding: '6px 22px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 16, background: '#eaf1f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#2c6ea0', fontSize: 14 }}>
                ART
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.4px', lineHeight: 1.2 }}>
                  {selectedItem.name}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8a99a8', marginTop: 3 }}>
                  {selectedItem.unit ?? 'Artículo'}
                </div>
              </div>
            </div>

            {[
              { label: 'Unidad', value: selectedItem.unit ?? '—' },
              { label: 'Código de barras', value: selectedItem.barcode ?? '—' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '13px 0', borderBottom: '1px solid #f0f3f6' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#8a99a8', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: '#243444', textAlign: 'right', fontFamily: f.label === 'Código de barras' ? 'ui-monospace, monospace' : undefined }}>
                  {f.value}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 11, marginTop: 22 }}>
              <button
                onClick={() => { setDetailOpen(false); setFormError(''); setEditOpen(true) }}
                style={{ flex: 1, background: '#eaf1f7', color: '#165382', border: 'none', borderRadius: 14, padding: 15, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#165382" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                </svg>
                Editar
              </button>
              <button
                onClick={handleArchive}
                style={{ flex: 1, background: '#fdeceb', color: '#c8392f', border: 'none', borderRadius: 14, padding: 15, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c8392f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>
                </svg>
                Archivar
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit drawer */}
      <Drawer open={editOpen} onClose={() => setEditOpen(false)}>
        {selectedItem && (
          <ItemDrawerForm
            defaultValues={{
              name: selectedItem.name,
              barcode: selectedItem.barcode ?? '',
              unit: selectedItem.unit ?? '',
            }}
            onSubmit={handleUpdate}
            submitting={updateSubmitting}
            formError={formError}
            title="Editar artículo"
            submitLabel="Guardar cambios"
          />
        )}
      </Drawer>
    </div>
  )
}
