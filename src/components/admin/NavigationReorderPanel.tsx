// src/components/admin/NavigationReorderPanel.tsx
'use client'

// Global equivalent of DoctorReorderPanel/ServiceReorderPanel — Navigation
// has no list view (it's a single Global document), so this renders inline
// among the document controls (Save/Publish buttons) via
// admin.components.elements.beforeDocumentControls instead of beforeListTable.
// The 8 standard routes are fixed in code (see Navigation.ts / STANDARD_ROUTES
// in payload-data.ts) so, unlike doctors/services, there's nothing to fetch a
// list of — only the current `order`/`enabled`/`label` values per route group.
// `customLinks` (admin-managed free-form links) is a real array field instead —
// it's reordered via Payload's own built-in array drag-handle, directly in the
// edit form, so it isn't part of this fixed-route panel.
import React from 'react'
import { createPortal } from 'react-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { colors, spacing, radii, fontSizes } from './tokens'

// Mirrors STANDARD_ROUTES in src/lib/payload-data.ts. healthLibraryRoute is
// deliberately excluded — it's disabled there (commented out) so reordering
// it here would do nothing visible on the site.
const ROUTE_DEFS = [
  { key: 'homeRoute', label: 'მთავარი', href: '/' },
  { key: 'aboutRoute', label: 'ჩვენ შესახებ', href: '/about' },
  { key: 'servicesRoute', label: 'სერვისები', href: '/services' },
  { key: 'doctorsRoute', label: 'ექიმები', href: '/doctors' },
  { key: 'checkupsRoute', label: 'შემოწმებები', href: '/checkups' },
  { key: 'blogRoute', label: 'ბლოგი', href: '/blog' },
  { key: 'contactRoute', label: 'კონტაქტი', href: '/contact' },
  { key: 'labTestsRoute', label: 'ანალიზები', href: '/lab-tests' },
] as const

type RouteRow = {
  key: string
  label: string
  href: string
  raw: Record<string, unknown>
}

function SortableNavRow({ route }: { route: RouteRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: route.key })
  const enabled = route.raw.enabled !== false
  const customLabel = typeof route.raw.label === 'string' ? route.raw.label.trim() : ''

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.5 : enabled ? 1 : 0.55,
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
          {customLabel || route.label}
        </div>
        <div style={{ fontSize: fontSizes.xs, color: colors.greyText }}>{route.href}</div>
      </div>
      {!enabled && (
        <span
          style={{
            fontSize: fontSizes.xs,
            fontWeight: 700,
            color: colors.amberWarn,
            background: colors.amberWarnSoft,
            borderRadius: radii.sm,
            padding: '2px 8px',
            flexShrink: 0,
          }}
        >
          გამორთული
        </span>
      )}
    </div>
  )
}

export default function NavigationReorderPanel() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [routes, setRoutes] = React.useState<RouteRow[]>([])

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
      const res = await fetch('/api/globals/navigation?depth=0', { credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      const doc = (await res.json()) as Record<string, unknown>
      const rows = ROUTE_DEFS.map((def) => ({
        key: def.key,
        label: def.label,
        href: def.href,
        raw: (doc?.[def.key] as Record<string, unknown>) ?? {},
      })).sort((a, b) => {
        const oa = typeof a.raw.order === 'number' ? (a.raw.order as number) : 0
        const ob = typeof b.raw.order === 'number' ? (b.raw.order as number) : 0
        return oa - ob
      })
      setRoutes(rows)
    } catch {
      setError('ნავიგაციის ჩატვირთვა ვერ მოხერხდა.')
    } finally {
      setLoading(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setRoutes((items) => {
      const oldIndex = items.findIndex((r) => r.key === active.id)
      const newIndex = items.findIndex((r) => r.key === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      // Globals use POST (not PATCH) as their update verb in Payload's REST
      // API. Send each group back in full (spread `raw`) with only `order`
      // changed, so enabled/label/hasDropdown/subLinks survive untouched.
      const body: Record<string, unknown> = {}
      routes.forEach((r, i) => {
        body[r.key] = { ...r.raw, order: (i + 1) * 10 }
      })
      const res = await fetch('/api/globals/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(String(res.status))
      setOpen(false)
      window.location.reload()
    } catch {
      setError('შენახვა ვერ მოხერხდა, სცადეთ ხელახლა.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
        მენიუს რიგის დალაგება
      </button>

      {open &&
        createPortal(
          <div className="clinic-reorder-overlay">
            <div className="clinic-reorder-overlay__header">
              <div>
                <strong style={{ color: colors.blackberry }}>მენიუს რიგის დალაგება</strong>
                <div style={{ fontSize: fontSizes.xs, color: colors.greyText }}>
                  ჩავლებით დაალაგეთ ჰედერის ბმულები. Pages-დან ავტომატურად დამატებული ბმულები ყოველთვის ამათ შემდეგ ჩნდება.
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
                  <SortableContext items={routes.map((r) => r.key)} strategy={verticalListSortingStrategy}>
                    {routes.map((r) => (
                      <SortableNavRow key={r.key} route={r} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
