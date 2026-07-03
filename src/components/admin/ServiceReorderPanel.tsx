// src/components/admin/ServiceReorderPanel.tsx
'use client'

// beforeListTable button that opens a full-screen drag-and-drop overlay for
// setting the `displayOrder` field on every service at once. Mirrors
// DoctorReorderPanel.tsx. Pinned services (pinned + pinnedOrder) always float
// to the top on the public site regardless of displayOrder — this panel only
// controls relative order among the rest, so it lists and reorders every
// service together (pinned rows included) but only affects displayOrder.
import React from 'react'
import { createPortal } from 'react-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { colors, spacing, radii, fontSizes } from './tokens'

type ServiceRow = {
  id: string | number
  name?: string | null
  category?: string | null
  pinned?: boolean | null
  image?: { url?: string | null } | string | null
  displayOrder?: number | null
}

function imageUrl(image: ServiceRow['image']): string {
  if (image && typeof image === 'object') return image.url ?? ''
  return ''
}

function SortableRow({ service }: { service: ServiceRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id })
  const url = imageUrl(service.image)

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
        <img src={url} alt="" style={{ width: 36, height: 36, borderRadius: radii.md, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: radii.md, background: colors.pinkSoft, flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
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
          {service.name || '—'}
        </div>
        <div style={{ fontSize: fontSizes.xs, color: colors.greyText }}>{service.category || ''}</div>
      </div>
      {service.pinned && (
        <span
          style={{
            fontSize: fontSizes.xs,
            fontWeight: 600,
            color: colors.blackberry,
            background: colors.pinkSoft,
            borderRadius: radii.xl,
            padding: '3px 10px',
            flexShrink: 0,
          }}
        >
          დამაგრებული
        </span>
      )}
    </div>
  )
}

export default function ServiceReorderPanel() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [services, setServices] = React.useState<ServiceRow[]>([])
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
      const res = await fetch('/api/services?limit=1000&depth=1&sort=displayOrder,slug', { credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { docs?: ServiceRow[] }
      const docs = data.docs ?? []
      original.current = new Map(docs.map((d) => [d.id, d.displayOrder ?? 0]))
      setServices(docs)
    } catch {
      setError('სერვისების ჩატვირთვა ვერ მოხერხდა.')
    } finally {
      setLoading(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setServices((items) => {
      const oldIndex = items.findIndex((d) => d.id === active.id)
      const newIndex = items.findIndex((d) => d.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const updates = services
        .map((d, i) => ({ id: d.id, displayOrder: i * 10 }))
        .filter((u) => original.current.get(u.id) !== u.displayOrder)
      await Promise.all(
        updates.map((u) =>
          fetch(`/api/services/${u.id}`, {
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
        სერვისების რიგის დალაგება
      </button>

      {open &&
        createPortal(
          <div className="clinic-reorder-overlay">
            <div className="clinic-reorder-overlay__header">
              <strong style={{ color: colors.blackberry }}>სერვისების რიგის დალაგება</strong>
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
                  <SortableContext items={services.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {services.map((d) => (
                      <SortableRow key={d.id} service={d} />
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
