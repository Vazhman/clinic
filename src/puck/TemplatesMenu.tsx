'use client'

import * as React from 'react'
import { usePuck, type Data } from '@puckeditor/core'
import { TEMPLATES } from './templates'

// Assign a fresh unique id to every node (and recurse into slot arrays) so a
// template can be inserted repeatedly without id collisions.
let counter = 0
function uid(type: string): string {
  counter += 1
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${type}-${rand}-${counter}`
}

type Node = { type: string; props: Record<string, unknown> }

function instantiate(nodes: Node[]): Node[] {
  return nodes.map((n) => {
    const props: Record<string, unknown> = { ...n.props, id: uid(n.type) }
    for (const [k, v] of Object.entries(props)) {
      if (
        Array.isArray(v) &&
        v.length > 0 &&
        v.every((it) => it && typeof it === 'object' && 'type' in it && 'props' in it)
      ) {
        props[k] = instantiate(v as Node[])
      }
    }
    return { type: n.type, props }
  })
}

type SavedTemplate = { id: string | number; name: string; data?: { content?: Node[] } }

const s = {
  btn: {
    padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff',
    color: '#3D3D3D', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  } as React.CSSProperties,
  menu: {
    position: 'fixed', top: 52, left: 16, zIndex: 2147483000,
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: 280, padding: 6,
    maxHeight: '75vh', overflowY: 'auto',
  } as React.CSSProperties,
  group: { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', padding: '8px 10px 4px' } as React.CSSProperties,
  item: {
    display: 'flex', flexDirection: 'column', gap: 2, width: '100%', textAlign: 'left',
    padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer',
  } as React.CSSProperties,
  savedRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px' } as React.CSSProperties,
  saveBtn: {
    width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 6,
    border: '1px solid #682149', background: '#682149', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  } as React.CSSProperties,
  del: {
    border: 'none', background: 'transparent', color: '#b91c1c', cursor: 'pointer', fontSize: 14, padding: '0 4px',
  } as React.CSSProperties,
}

// Rendered inside Puck's header override, so usePuck() is in context.
export function TemplatesMenu() {
  const { dispatch, appState } = usePuck()
  const [open, setOpen] = React.useState(false)
  const [saved, setSaved] = React.useState<SavedTemplate[]>([])

  const loadSaved = React.useCallback(async () => {
    try {
      const res = await fetch('/api/builder-templates?limit=100&depth=0&sort=-updatedAt', { credentials: 'include' })
      const json = (await res.json()) as { docs?: SavedTemplate[] }
      setSaved(json.docs ?? [])
    } catch {
      setSaved([])
    }
  }, [])

  React.useEffect(() => {
    if (open) loadSaved()
  }, [open, loadSaved])

  // Insert a template. If the canvas already has blocks, ask whether to REPLACE
  // the current layout or ADD the template below it — the old behaviour silently
  // appended every time, which was confusing. Empty canvas → just insert.
  const insert = (nodes: Node[]) => {
    const fresh = instantiate(nodes) as Data['content']
    const hasContent = (appState?.data?.content?.length ?? 0) > 0

    let mode: 'replace' | 'append' = 'replace'
    if (hasContent) {
      // OK = replace, Cancel = add below. (window.confirm is binary; labels make
      // the two outcomes explicit.)
      mode = window.confirm(
        'ჩავანაცვლო მიმდინარე განლაგება ამ შაბლონით?\n\n„OK“ — ჩანაცვლება (ძველი ბლოკები წაიშლება)\n„გაუქმება“ — დამატება არსებულის ბოლოში',
      )
        ? 'replace'
        : 'append'
    }

    dispatch({
      type: 'setData',
      recordHistory: true,
      data: (prev: Data) => ({
        ...prev,
        content: mode === 'replace' ? fresh : [...prev.content, ...fresh],
      }),
    })
    setOpen(false)
  }

  const saveCurrent = async () => {
    const content = appState?.data?.content ?? []
    if (content.length === 0) {
      window.alert('ჯერ დაამატეთ ბლოკები, შემდეგ შეინახეთ შაბლონად.')
      return
    }
    const name = window.prompt('შაბლონის სახელი:')
    if (!name) return
    try {
      await fetch('/api/builder-templates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data: { content } }),
      })
      await loadSaved()
    } catch {
      window.alert('შენახვა ვერ მოხერხდა.')
    }
  }

  const remove = async (id: string | number) => {
    if (!window.confirm('წავშალო ეს შაბლონი?')) return
    try {
      await fetch(`/api/builder-templates/${id}`, { method: 'DELETE', credentials: 'include' })
      await loadSaved()
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" style={s.btn} onClick={() => setOpen((v) => !v)}>
        📄 შაბლონები ▾
      </button>
      {open && (
        <div style={s.menu}>
          <div style={s.group}>ჩაშენებული</div>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              style={s.item}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => insert(t.blocks)}
            >
              <span style={{ fontWeight: 600, color: '#682149' }}>{t.label}</span>
              <span style={{ fontSize: 11, color: '#6B6B6B' }}>{t.description}</span>
            </button>
          ))}

          {saved.length > 0 && (
            <>
              <div style={s.group}>ჩემი შაბლონები</div>
              {saved.map((t) => (
                <div key={String(t.id)} style={s.savedRow}>
                  <button
                    type="button"
                    style={{ ...s.item, flex: 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => insert(t.data?.content ?? [])}
                  >
                    <span style={{ fontWeight: 600, color: '#682149' }}>{t.name}</span>
                  </button>
                  <button type="button" title="წაშლა" style={s.del} onClick={() => remove(t.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </>
          )}

          <button type="button" style={s.saveBtn} onClick={saveCurrent}>
            💾 მიმდინარე განლაგების შენახვა შაბლონად
          </button>
        </div>
      )}
    </div>
  )
}
