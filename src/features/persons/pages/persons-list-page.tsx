import { useState, useContext, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'

import { Drawer } from '@/shared/components/drawer'
import { ActionDialog } from '@/shared/components/action-dialog'
import { useActionDialog } from '@/shared/hooks/use-action-dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AddContext } from '@/shared/layouts/app-layout'
import { useArchivePerson, useCreatePerson, usePersons, useUpdatePerson } from '@/features/persons/hooks'
import { toCreatePersonDTO, personToFormValues, type PersonFormValues } from '@/features/persons/schemas'
import { PersonDrawerForm } from '@/features/persons/components/person-drawer-form'
import type { Person } from '@/features/persons/types'

interface OutletCtx { searchValue: string }

const AVATAR_PALETTES = [
  ['#eaf1f7', '#2c6ea0'],
  ['#e9f3ec', '#2f9e6a'],
  ['#f5edda', '#b5851f'],
  ['#f3e9f0', '#9a4d84'],
  ['#eae9f5', '#5a52a0'],
]

function getInitials(person: Person) {
  return ((person.names[0] ?? '') + (person.surnames[0] ?? '')).toUpperCase()
}

function getAvatar(person: Person) {
  const palette = AVATAR_PALETTES[person.id % AVATAR_PALETTES.length]
  return { bg: palette[0], color: palette[1] }
}

export function PersonsListPage() {
  const { searchValue } = useOutletContext<OutletCtx>()
  const { data, loading, error, refetch } = usePersons()
  const { archivePerson } = useArchivePerson()
  const { createPerson, submitting: createSubmitting } = useCreatePerson()
  const { updatePerson, submitting: updateSubmitting } = useUpdatePerson()

  const { registerAddHandler } = useContext(AddContext)

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [formError, setFormError] = useState('')
  const { dialogProps, closeDialog, runWithDialog } = useActionDialog()

  useEffect(() => {
    return registerAddHandler(() => { setFormError(''); setCreateOpen(true) })
  }, [registerAddHandler])

  const filtered = searchValue
    ? data.filter(
        (p) =>
          `${p.names} ${p.surnames}`.toLowerCase().includes(searchValue.toLowerCase()) ||
          (p.dni && p.dni.toLowerCase().includes(searchValue.toLowerCase()))
      )
    : data

  async function handleCreate(values: PersonFormValues) {
    setFormError('')
    setCreateOpen(false)
    try {
      await runWithDialog({
        loading: 'Creando persona…',
        success: 'Persona creada',
        error: 'No se pudo crear la persona',
        action: async () => {
          const person = await createPerson(toCreatePersonDTO(values))
          if (!person) throw new Error('fail')
        },
      })
      refetch()
    } catch {
      /* dialog shows error */
    }
  }

  async function handleUpdate(values: PersonFormValues) {
    if (!selectedPerson) return
    setFormError('')
    setEditOpen(false)
    try {
      await runWithDialog({
        loading: 'Actualizando persona…',
        success: 'Persona actualizada',
        error: 'No se pudo actualizar la persona',
        action: async () => {
          const ok = await updatePerson(selectedPerson.id, toCreatePersonDTO(values))
          if (!ok) throw new Error('fail')
        },
      })
      refetch()
    } catch {
      /* dialog shows error */
    }
  }

  async function handleArchive() {
    if (!selectedPerson) return
    const ok = await archivePerson(selectedPerson.id)
    if (ok) {
      setDetailOpen(false)
      toast.success('Persona archivada')
      refetch()
    }
  }

  function openDetail(person: Person) {
    setSelectedPerson(person)
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
          {searchValue ? 'Sin resultados' : 'No hay personas registradas'}
        </div>
      ) : (
        <div>
          {filtered.map((person) => {
            const { bg, color } = getAvatar(person)
            const initials = getInitials(person)
            return (
              <button
                key={person.id}
                onClick={() => openDetail(person)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#fff',
                  border: '1.5px solid #e9edf2',
                  borderRadius: 18,
                  padding: '13px 15px',
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
                {/* Avatar */}
                <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 15, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color }}>
                  {initials}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#122433', lineHeight: 1.25, marginBottom: 3 }}>
                    {person.names} {person.surnames}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8a99a8' }}>
                    {[person.dni, person.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </div>
                </div>

                {/* Chevron */}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c3ccd6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6"/>
                </svg>
              </button>
            )
          })}
        </div>
      )}

      {/* Create person drawer */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)}>
        <PersonDrawerForm
          onSubmit={handleCreate}
          submitting={createSubmitting}
          formError={formError}
        />
      </Drawer>

      {/* Detail drawer */}
      <Drawer open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selectedPerson && (
          <div className="scrollarea" style={{ overflowY: 'auto', padding: '6px 22px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 16, background: getAvatar(selectedPerson).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: getAvatar(selectedPerson).color, fontSize: 16 }}>
                {getInitials(selectedPerson)}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.4px', lineHeight: 1.2 }}>
                  {selectedPerson.names} {selectedPerson.surnames}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8a99a8', marginTop: 3 }}>Persona registrada</div>
              </div>
            </div>

            {[
              { label: 'Cédula / DNI', value: selectedPerson.dni ?? '—' },
              { label: 'Teléfono', value: selectedPerson.phone ?? '—' },
              { label: 'Dirección', value: selectedPerson.address ?? '—' },
              { label: 'Notas', value: selectedPerson.notes ?? '—' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '13px 0', borderBottom: '1px solid #f0f3f6' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#8a99a8', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: '#243444', textAlign: 'right' }}>{f.value}</span>
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
        {selectedPerson && (
          <PersonDrawerForm
            defaultValues={personToFormValues(selectedPerson)}
            onSubmit={handleUpdate}
            submitting={updateSubmitting}
            formError={formError}
            title="Editar persona"
            submitLabel="Guardar cambios"
          />
        )}
      </Drawer>

      <ActionDialog {...dialogProps} onClose={closeDialog} />
    </div>
  )
}
