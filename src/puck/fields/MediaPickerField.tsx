'use client'

import * as React from 'react'
import { FieldLabel } from '@puckeditor/core'
import type { MediaRef } from '../types'

// A visual image picker (Puck `custom` field). Replaces Puck's generic
// `external` table field, which was a poor fit for choosing images. Shows the
// selected thumbnail + a button that opens an inline grid of Media-collection
// thumbnails fetched from Payload's REST API. Clicking a thumbnail selects it.

type MediaDoc = {
  id: string | number
  url?: string | null
  alt?: string | null
  filename?: string | null
  sizes?: { thumbnail?: { url?: string | null } } | null
}

const thumbOf = (m: MediaDoc): string => m.sizes?.thumbnail?.url || m.url || ''

const styles = {
  btn: {
    padding: '6px 12px', borderRadius: 6, border: '1px solid #682149',
    background: '#682149', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  } as React.CSSProperties,
  ghost: {
    padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd',
    background: '#fff', color: '#3D3D3D', cursor: 'pointer', fontSize: 13,
  } as React.CSSProperties,
  panel: {
    marginTop: 8, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa',
  } as React.CSSProperties,
}

function MediaPickerInput({
  value,
  onChange,
  label,
}: {
  value?: MediaRef | null
  onChange: (v: MediaRef | null) => void
  label: string
}) {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<MediaDoc[]>([])
  const [loading, setLoading] = React.useState(false)
  const [q, setQ] = React.useState('')

  const load = React.useCallback(async (query: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '60', depth: '0' })
      if (query) params.set('where[filename][contains]', query)
      const res = await fetch(`/api/media?${params.toString()}`, { credentials: 'include' })
      const json = (await res.json()) as { docs?: MediaDoc[] }
      setItems(json.docs ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => load(q), 200)
    return () => clearTimeout(t)
  }, [open, q, load])

  const pick = (m: MediaDoc) => {
    onChange({ id: m.id, url: m.url ?? '', alt: m.alt ?? '', width: null, height: null })
    setOpen(false)
  }

  return (
    <FieldLabel label={label}>
      {value?.url ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
          <button type="button" style={styles.btn} onClick={() => setOpen((v) => !v)}>შეცვლა</button>
          <button type="button" style={styles.ghost} onClick={() => onChange(null)}>წაშლა</button>
        </div>
      ) : (
        <button type="button" style={styles.btn} onClick={() => setOpen((v) => !v)}>🖼 აირჩიეთ სურათი</button>
      )}

      {open && (
        <div style={styles.panel}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="ძებნა ფაილის სახელით…"
              style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 6 }}
            />
            <button type="button" style={styles.ghost} onClick={() => setOpen(false)}>დახურვა</button>
          </div>
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#6B6B6B' }}>იტვირთება…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#6B6B6B' }}>სურათები ვერ მოიძებნა</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 300, overflow: 'auto' }}>
              {items.filter((m) => m.url).map((m) => (
                <button
                  key={String(m.id)}
                  type="button"
                  title={m.alt ?? m.filename ?? ''}
                  onClick={() => pick(m)}
                  style={{ padding: 0, border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', background: '#fff' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbOf(m)} alt={m.alt ?? ''} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </FieldLabel>
  )
}

// Factory returning a Puck `custom` field bound to a MediaRef value.
export function mediaPickerField(opts: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    render: ({ value, onChange }: { value?: MediaRef | null; onChange: (v: MediaRef | null) => void }) => (
      <MediaPickerInput value={value} onChange={onChange} label={opts.label ?? 'სურათი'} />
    ),
  }
}
