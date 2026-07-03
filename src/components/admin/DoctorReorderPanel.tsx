// src/components/admin/DoctorReorderPanel.tsx
'use client'

// beforeListTable button that opens a full-screen drag-and-drop overlay for
// setting the `displayOrder` field on every doctor at once. Portaled to
// document.body (same reasoning as PuckBuilderField: needs the full viewport,
// and must not nest inside Payload's list-view chrome). Ignores the list's
// current search/filter state on purpose — reordering always works against
// the full roster so nothing is accidentally left out of the sequence.
import React from 'react'
import { createPortal } from 'react-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { colors, spacing, radii, fontSizes } from './tokens'

type DoctorRow = {
  id: string | number
  name?: string | null
  specialty?: string | null
  photo?: { url?: string | null } | string | null
  displayOrder?: number | null
}

function photoUrl(photo: DoctorRow['photo']): string {
  if (photo && typeof photo === 'object') return photo.url ?? ''
  return ''
}

function SortableRow({ doctor }: { doctor: DoctorRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doctor.id })
  const url = photoUrl(doctor.photo)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.sm} ${spacing.md}`,
        background: colors.white,
        border: `1px solid ${colors.greyBorder}`,
        borderRadius: radii.md,
        marginBottom: spacing.sm,
      }}
    >
      <button
        type="button"
        className="clinic-focusable"
        {...attributes}
        {...listeners}
        aria-label="გადაადგილება"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'transparent',
          border: 'none',
          padding: 4,
          display: 'flex',
          color: colors.greyLightText,
          touchAction: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.3" />
          <circle cx="11" cy="3" r="1.3" />
          <circle cx="5" cy="8" r="1.3" />
          <circle cx="11" cy="8" r="1.3" />
          <circle cx="5" cy="13" r="1.3" />
          <circle cx="11" cy="13" r="1.3" />
        </svg>
      </button>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors.pinkSoft, flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: fontSizes.md,
            fontWeight: 600,
            color: colors.blackberryDark,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {doctor.name || '—'}
        </div>
        <div style={{ fontSize: fontSizes.xs, color: colors.greyText }}>{doctor.specialty || ''}</div>
      </div>
    </div>
  )
}

export default function DoctorReorderPanel() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [doctors, setDoctors] = React.useState<DoctorRow[]>([])
  const original = React.useRef<Map<string | number, number>>(new Map())

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  async function openPanel() {
    setOpen(true)
    setLoading(true)
    setError(null)
    try {
      // Matches the `where` clause `_getDoctors()` uses for the public
      // /doctors list (payload-data.ts) — the roster here is large (~200,
      // Doctra-synced) and most entries are hidden/inactive/duplicates that
      // never render publicly. Without this filter, dragging one of those
      // rows saves fine but produces zero visible change on the site.
      const res = await fetch(
        '/api/doctors?limit=1000&depth=1&sort=displayOrder,slug&where[inactive][not_equals]=true&where[showOnDoctorsPage][not_equals]=false',
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { docs?: DoctorRow[] }
      const docs = data.docs ?? []
      original.current = new Map(docs.map((d) => [d.id, d.displayOrder ?? 0]))
      setDoctors(docs)
    } catch {
      setError('ექიმების ჩატვირთვა ვერ მოხერხდა.')
    } finally {
      setLoading(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDoctors((items) => {
      const oldIndex = items.findIndex((d) => d.id === active.id)
      const newIndex = items.findIndex((d) => d.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const updates = doctors
        .map((d, i) => ({ id: d.id, displayOrder: i * 10 }))
        .filter((u) => original.current.get(u.id) !== u.displayOrder)
      await Promise.all(
        updates.map((u) =>
          fetch(`/api/doctors/${u.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ displayOrder: u.displayOrder }),
          }),
        ),
      )
      setOpen(false)
      window.location.reload()
    } catch {
      setError('შენახვა ვერ მოხერხდა, სცადეთ ხელახლა.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: `${spacing.md} ${spacing.lg}`, borderBottom: `1px solid ${colors.greyBorder}` }}>
      <button
        type="button"
        className="clinic-focusable"
        onClick={openPanel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing.xs,
          background: colors.white,
          color: colors.blackberry,
          border: `1px solid ${colors.blackberry}`,
          borderRadius: radii.xl,
          padding: `${spacing.xs} ${spacing.md}`,
          fontSize: fontSizes.sm,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.3" />
          <circle cx="11" cy="3" r="1.3" />
          <circle cx="5" cy="8" r="1.3" />
          <circle cx="11" cy="8" r="1.3" />
          <circle cx="5" cy="13" r="1.3" />
          <circle cx="11" cy="13" r="1.3" />
        </svg>
        ექიმების რიგის დალაგება
      </button>

      {open &&
        createPortal(
          <div className="clinic-reorder-overlay">
            <div className="clinic-reorder-overlay__header">
              <div>
                <strong style={{ color: colors.blackberry }}>ექიმების რიგის დალაგება</strong>
                <div style={{ fontSize: fontSizes.xs, color: colors.greyText }}>
                  მხოლოდ „ექიმები" გვერდზე ხილული ექიმები — დამალული/არააქტიური აქ არ ჩანს.
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                {error && <span style={{ color: colors.redError, fontSize: fontSizes.sm }}>{error}</span>}
                <button
                  type="button"
                  className="clinic-focusable"
                  onClick={save}
                  disabled={saving || loading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: radii.md,
                    border: `1px solid ${colors.blackberry}`,
                    background: saving ? colors.blackberryDark : colors.blackberry,
                    color: colors.white,
                    fontWeight: 700,
                    cursor: saving ? 'default' : 'pointer',
                  }}
                >
                  {saving ? 'ინახება…' : 'შენახვა'}
                </button>
                <button
                  type="button"
                  className="clinic-focusable"
                  onClick={() => setOpen(false)}
                  aria-label="დახურვა"
                  style={{
                    padding: '8px 12px',
                    borderRadius: radii.md,
                    border: `1px solid ${colors.greyBorder}`,
                    background: colors.white,
                    color: colors.blackberryDark,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="clinic-reorder-overlay__body">
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}>
                  <span className="clinic-spinner" style={{ width: 28, height: 28 }} />
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={doctors.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {doctors.map((d) => (
                      <SortableRow key={d.id} doctor={d} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
