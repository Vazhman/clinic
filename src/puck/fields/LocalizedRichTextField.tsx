'use client'

import * as React from 'react'
import { FieldLabel } from '@puckeditor/core'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { tiptapExtensions, type JSONContent } from '../tiptap'
import { useBuilderLocale } from '../locale-context'
import type { Loc } from '../types'

type MediaDoc = {
  id: string | number
  url?: string | null
  alt?: string | null
  sizes?: { thumbnail?: { url?: string | null } } | null
}

const tBtn = (active: boolean): React.CSSProperties => ({
  padding: '2px 8px', marginRight: 4, borderRadius: 4,
  border: '1px solid #ddd', background: active ? '#DD64A6' : '#fff',
  color: active ? '#fff' : '#3D3D3D', cursor: 'pointer',
})

function Toolbar({ editor }: { editor: Editor | null }) {
  const [picker, setPicker] = React.useState(false)
  const [items, setItems] = React.useState<MediaDoc[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!picker) return
    let cancelled = false
    setLoading(true)
    fetch('/api/media?limit=60&depth=0', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { docs?: MediaDoc[] }) => {
        if (!cancelled) setItems(j.docs ?? [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [picker])

  if (!editor) return null

  const imgActive = editor.isActive('image')
  const insert = (m: MediaDoc) => {
    const src = m.url ?? ''
    if (src) {
      editor.chain().focus().insertContent({ type: 'image', attrs: { src, alt: m.alt ?? '', align: 'left' } }).run()
    }
    setPicker(false)
  }
  const setAlign = (align: 'left' | 'center' | 'right') =>
    editor.chain().focus().updateAttributes('image', { align }).run()

  return (
    <div style={{ marginBottom: 6, position: 'relative' }}>
      <button type="button" style={tBtn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button type="button" style={tBtn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>i</button>
      <button type="button" style={tBtn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• list</button>
      <button type="button" style={tBtn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. list</button>
      <button type="button" style={tBtn(editor.isActive('link'))} onClick={() => {
        const url = window.prompt('URL') || ''
        if (url) editor.chain().focus().setLink({ href: url }).run()
        else editor.chain().focus().unsetLink().run()
      }}>link</button>
      <button type="button" style={tBtn(picker)} onClick={() => setPicker((v) => !v)}>🖼 სურათი</button>

      {imgActive && (
        <>
          <span style={{ margin: '0 6px', color: '#ccc' }}>|</span>
          <span style={{ fontSize: 11, color: '#6B6B6B', marginRight: 4 }}>მდებარეობა:</span>
          <button type="button" title="მარცხნივ (ტექსტი მარჯვნივ)" style={tBtn(false)} onClick={() => setAlign('left')}>◀</button>
          <button type="button" title="ცენტრში" style={tBtn(false)} onClick={() => setAlign('center')}>◼</button>
          <button type="button" title="მარჯვნივ (ტექსტი მარცხნივ)" style={tBtn(false)} onClick={() => setAlign('right')}>▶</button>
        </>
      )}

      {picker && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 2147483000,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', padding: 8, width: 380, maxHeight: 320, overflowY: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: 12, textAlign: 'center', color: '#6B6B6B' }}>იტვირთება…</div>
          ) : items.filter((m) => m.url).length === 0 ? (
            <div style={{ padding: 12, textAlign: 'center', color: '#6B6B6B' }}>სურათები ვერ მოიძებნა</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {items.filter((m) => m.url).map((m) => (
                <button key={String(m.id)} type="button" onClick={() => insert(m)} style={{ padding: 0, border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.sizes?.thumbnail?.url || m.url || ''} alt={m.alt ?? ''} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Inner editor keyed by locale so switching language remounts with that
// language's content (TipTap is uncontrolled after init).
function RichTextEditor({ value, onChange }: { value: JSONContent | undefined; onChange: (j: JSONContent) => void }) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value ?? { type: 'doc', content: [] },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
  })
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function LocalizedRichTextInput({
  value, onChange, label,
}: {
  value?: Loc<JSONContent>
  onChange: (v: Loc<JSONContent>) => void
  label: string
}) {
  const locale = useBuilderLocale()
  const current = value?.[locale]
  const set = (next: JSONContent) => onChange({ ...(value ?? {}), [locale]: next })
  return (
    <FieldLabel label={`${label} (${locale.toUpperCase()})`}>
      <RichTextEditor key={locale} value={current} onChange={set} />
    </FieldLabel>
  )
}

export function localizedRichTextField(opts: { label: string }) {
  return {
    type: 'custom' as const,
    render: ({ value, onChange }: { value?: Loc<JSONContent>; onChange: (v: Loc<JSONContent>) => void }) => (
      <LocalizedRichTextInput value={value} onChange={onChange} label={opts.label} />
    ),
  }
}
