'use client'

import '@/puck/puck-blocks.css'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useField, useForm, useDocumentInfo } from '@payloadcms/ui'
import { Puck, type Data } from '@puckeditor/core'
import { config } from '@/puck/config'
import { EMPTY_PUCK_DATA } from '@/puck/empty-data'
import { lexicalToTiptap } from '@/puck/lexical-to-tiptap'
import { BuilderLocaleContext } from '@/puck/locale-context'
import { TemplatesMenu } from '@/puck/TemplatesMenu'
import { BUILDER_LOCALES, type BuilderLocale } from '@/puck/types'
import { colors } from './tokens'
import { LayoutIcon, CheckIcon } from './icons'

// Custom Field for the unlocalized `puckData` JSON field.
//
// Why a portal: a Payload edit screen IS a <form>. Puck renders its own
// <form> for the fields panel; a <form> inside a <form> is invalid HTML and
// throws a hydration error. So we render Puck through createPortal into
// document.body — it leaves Payload's form in the DOM, while React context
// (useField, locale) still flows through the portal so saving + the language
// switch keep working. As a full-screen overlay it also gives Puck the room
// it needs (the in-column embed overflowed and scrolled the page).
//
// Puck is UNCONTROLLED: we seed `data` once after the form initializes and
// push edits OUT via onChange -> setValue. The overlay covers Payload's own
// Save button, so the builder's "Save & close" calls Payload's submit()
// directly — closing without saving would lose the layout.
export const PuckBuilderField: React.FC<{ path?: string }> = ({ path = 'puckData' }) => {
  const { value, setValue, formInitializing } = useField<Data>({ path })
  const { submit } = useForm()
  const { id: docId } = useDocumentInfo()
  const [locale, setLocale] = React.useState<BuilderLocale>('ge')
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const seededRef = React.useRef(false)

  // Persist via Payload's form submit (saves the whole News doc, incl.
  // puckData), then close. If required fields elsewhere (title/slug) are
  // empty, Payload surfaces its own validation errors.
  const saveAndClose = async () => {
    setSaving(true)
    try {
      await submit()
      setOpen(false)
    } catch {
      window.alert('შენახვა ვერ მოხერხდა. შეამოწმეთ სავალდებულო ველები („სათაური“, „URL მისამართი“) პარამეტრების ტაბში.')
    } finally {
      setSaving(false)
    }
  }

  const [initialData, setInitialData] = React.useState<Data | null>(null)
  React.useEffect(() => {
    if (formInitializing || initialData !== null) return

    // 1. The doc already has a builder layout → load it so the editor MODIFIES
    //    the existing design (not a blank canvas).
    const existing = value as Data | undefined
    if (existing && typeof existing === 'object' && Array.isArray(existing.content) && existing.content.length > 0) {
      setInitialData(existing)
      return
    }

    // 2. No builder layout yet, but the article may have classic Lexical `body`
    //    content (e.g. imported/seeded posts). Seed the builder from it — fetch
    //    all locales so the page that's already live shows up in the builder,
    //    editable, instead of opening empty. First builder-save then promotes
    //    puckData to the source of truth.
    let cancelled = false
    ;(async () => {
      if (docId) {
        try {
          const res = await fetch(`/api/news/${docId}?locale=all&depth=0`, { credentials: 'include' })
          if (res.ok) {
            const doc = await res.json()
            const body = doc?.body as Record<string, unknown> | undefined
            const seeded: Record<string, unknown> = {}
            for (const loc of ['ge', 'en', 'ru'] as const) {
              const tt = lexicalToTiptap(body?.[loc])
              if (tt) seeded[loc] = tt
            }
            if (!cancelled && Object.keys(seeded).length > 0) {
              setInitialData({
                content: [{ type: 'RichText', props: { id: `rt-${Date.now()}`, content: seeded } }],
                root: {},
              } as Data)
              return
            }
          }
        } catch {
          /* fall through to an empty canvas */
        }
      }
      if (!cancelled) setInitialData(EMPTY_PUCK_DATA)
    })()
    return () => {
      cancelled = true
    }
  }, [formInitializing, initialData, value, docId])

  // Lock the page scroll behind the overlay while it's open.
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const content = (initialData ?? (value && typeof value === 'object' ? (value as Data) : null))?.content
  const blockCount = Array.isArray(content) ? content.length : 0

  // Custom header: GE/EN/RU edit-language switch + a Done button that closes
  // the overlay. Replaces Puck's default header (whose Publish button we don't
  // use — Payload's Save persists the field).
  const Header = React.useMemo(() => {
    function HeaderImpl() {
      return (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid #eee', background: colors.white,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <strong style={{ color: colors.blackberry }}>ბილდერი</strong>
            <TemplatesMenu />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div role="group" aria-label="Edit language" style={{ display: 'flex', gap: 4 }}>
              {BUILDER_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="clinic-focusable"
                  onClick={() => setLocale(l)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer',
                    background: l === locale ? colors.pink : colors.white,
                    color: l === locale ? colors.white : '#3D3D3D', fontWeight: 600,
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Close lives in the always-on-top fixed button (see overlay)
                so it can never be trapped behind Puck's canvas. */}
          </div>
        </div>
      )
    }
    return HeaderImpl
  }, [locale])

  const overrides = React.useMemo(() => ({ header: Header, headerActions: () => <></> }), [Header])
  const metadata = React.useMemo(() => ({ locale }), [locale])

  return (
    <div className="puck-builder-trigger">
      <button
        type="button"
        className="puck-open-btn clinic-focusable"
        onClick={() => setOpen(true)}
        disabled={!initialData}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <LayoutIcon size={16} /> ბილდერის გახსნა
      </button>
      <span className="puck-block-count">{blockCount} ბლოკი</span>

      {open && initialData &&
        createPortal(
          <div className="puck-overlay">
            {/* Always-on-top controls — above Puck's canvas so the editor can
                never trap the user. Save & close persists via Payload submit;
                a separate close exits without saving. */}
            <div style={{ position: 'fixed', top: 8, right: 12, zIndex: 2147483000, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="clinic-focusable"
                onClick={saveAndClose}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${colors.blackberry}`,
                  background: saving ? '#9a6a85' : colors.blackberry, color: colors.white,
                  cursor: saving ? 'default' : 'pointer', fontWeight: 700,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                }}
              >
                {saving ? 'ინახება…' : <><CheckIcon size={16} /> შენახვა და დახურვა</>}
              </button>
              <button
                type="button"
                className="clinic-focusable"
                onClick={() => setOpen(false)}
                title="დახურვა შენახვის გარეშე"
                aria-label="დახურვა შენახვის გარეშე"
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                  background: colors.white, color: '#3D3D3D', cursor: 'pointer', fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                }}
              >
                ✕
              </button>
            </div>
            <BuilderLocaleContext.Provider value={locale}>
              <Puck
                config={config}
                data={initialData}
                iframe={{ enabled: false }}
                metadata={metadata}
                onChange={(next: Data) => {
                  if (!seededRef.current) {
                    // Puck's mount normalization commit: sync without marking
                    // the Payload form dirty. Real edits after this dirty it.
                    seededRef.current = true
                    setValue(next, true)
                    return
                  }
                  setValue(next)
                }}
                overrides={overrides}
              />
            </BuilderLocaleContext.Provider>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default PuckBuilderField
