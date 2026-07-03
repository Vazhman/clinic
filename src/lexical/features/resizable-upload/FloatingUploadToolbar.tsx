'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isNodeSelection,
  $getNodeByKey,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type NodeKey,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { UploadNode, setFloatingElemPosition } from '@payloadcms/richtext-lexical/client'

import type {
  UploadAlignment,
  UploadBorder,
  UploadShadow,
  UploadRadius,
  UploadNodeFields,
} from './types'

// We deliberately mirror the skeleton of Payload's own InlineToolbarPlugin
// (node_modules/@payloadcms/richtext-lexical/dist/features/toolbars/inline/client/Toolbar/index.js):
// same lifecycle, same setFloatingElemPosition call, same drag-hide pattern.
// The difference is the trigger — InlineToolbar reacts to a RangeSelection
// over text, we react to a NodeSelection over a single UploadNode. So we
// position ourselves against the image's DOM rect (getElementByKey) instead
// of a DOM range rect.

const ALIGNMENT_OPTIONS: { value: UploadAlignment; label: string; title: string }[] = [
  { value: 'left', label: '⬅', title: 'Float left, text wraps right' },
  { value: 'center', label: '◼', title: 'Center, no text wrap' },
  { value: 'right', label: '➡', title: 'Float right, text wraps left' },
  { value: 'fullWidth', label: '⬛⬛', title: 'Full column width' },
]

const WIDTH_PRESETS = [25, 33, 50, 66, 75, 100] as const

const BORDER_OPTIONS: { value: UploadBorder; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'pink', label: 'Pink' },
  { value: 'blackberry', label: 'Blackberry' },
  { value: 'grey', label: 'Grey' },
]

const SHADOW_OPTIONS: { value: UploadShadow; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'strong', label: 'Strong' },
]

const RADIUS_OPTIONS: { value: UploadRadius; label: string }[] = [
  { value: 'none', label: 'Sharp' },
  { value: 'lg', label: 'Rounded' },
  { value: 'full', label: 'Circle' },
]

export function FloatingUploadToolbarPlugin({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext()

  // We track the selected upload node's key, its `fields` payload, and its
  // element-format flag separately. Splitting them lets the toolbar mount/
  // unmount based on `activeNodeKey` alone while the input/popover state
  // stays in sync without forcing a re-render when an unrelated editor
  // update fires.
  const [activeNodeKey, setActiveNodeKey] = React.useState<NodeKey | null>(null)
  const [activeFields, setActiveFields] = React.useState<UploadNodeFields | null>(null)
  const toolbarRef = React.useRef<HTMLDivElement | null>(null)

  // Hide-on-drag: Lexical fires no events while the user drags a resize
  // handle on the figure, so the toolbar would otherwise stay visible and
  // overlap the drag preview. Listening at the document level lets us
  // detect the mousedown anywhere on the resizable figure (marked via
  // data-resizable-upload="true" by the sibling ResizableUploadComponent)
  // and dim until mouseup.
  const [draggingHide, setDraggingHide] = React.useState(false)

  // Caption is editable inline. We hold a local string so typing stays
  // smooth (no per-keystroke editor update), then commit on blur or Enter.
  // The local copy is reseeded whenever the selected node changes so that
  // switching between images shows each one's caption.
  const [captionDraft, setCaptionDraft] = React.useState('')
  const lastSeededKeyRef = React.useRef<NodeKey | null>(null)

  // Style popover open/closed. The popover lives anchored to its trigger
  // inside the toolbar so positioning is "good enough" without another
  // round of setFloatingElemPosition calls.
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  // updateToolbar runs inside editor.getEditorState().read(). It decides
  // whether the toolbar should be visible (single UploadNode selected) and
  // pulls the latest fields. We do NOT position here — positioning is a
  // layout concern handled by the effect below once React has rendered the
  // toolbar with the new dimensions.
  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection()
    if (!$isNodeSelection(selection)) {
      setActiveNodeKey(null)
      setActiveFields(null)
      return
    }
    const nodes = selection.getNodes()
    if (nodes.length !== 1) {
      setActiveNodeKey(null)
      setActiveFields(null)
      return
    }
    const node = nodes[0]
    if (!(node instanceof UploadNode)) {
      setActiveNodeKey(null)
      setActiveFields(null)
      return
    }
    const key = node.getKey()
    setActiveNodeKey(key)
    // getData() returns the full UploadData blob — we only consume `fields`,
    // and we widen to `any` because the project's per-image extra fields
    // (alignment, borderStyle, …) live on the JsonObject side of Payload's
    // type and aren't reflected in the published .d.ts.
    const data = (node as unknown as { getData: () => { fields?: UploadNodeFields } }).getData?.()
    setActiveFields(data?.fields ?? {})
  }, [])

  // Wire updateToolbar to the editor: every state mutation runs it once,
  // and selection-change commands run it eagerly so clicking an image
  // updates the toolbar synchronously rather than waiting on the next
  // state flush.
  React.useEffect(() => {
    editor.getEditorState().read(() => {
      updateToolbar()
    })
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          editor.getEditorState().read(() => {
            updateToolbar()
          })
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateToolbar])

  // Seed the caption draft from the node fields, but only when the
  // *selected* node changes — not on every fields patch — otherwise the
  // input would jump back to the saved value mid-typing.
  React.useEffect(() => {
    if (activeNodeKey !== lastSeededKeyRef.current) {
      lastSeededKeyRef.current = activeNodeKey
      setCaptionDraft(activeFields?.caption ?? '')
      setPopoverOpen(false)
    }
  }, [activeNodeKey, activeFields])

  // Positioning. setFloatingElemPosition writes a transform onto the
  // floating element so we don't manually compute top/left here. We re-run
  // it whenever the selected key changes (new image) and on window/scroll
  // events so the toolbar tracks the image as the user scrolls. We don't
  // depend on activeFields here because field changes don't move the
  // image — they only restyle it, and the image's element rect won't have
  // moved by the time setFloatingElemPosition reads it.
  const reposition = React.useCallback(() => {
    if (!activeNodeKey || !toolbarRef.current) return
    const el = editor.getElementByKey(activeNodeKey)
    if (!el) return
    const rect = el.getBoundingClientRect()
    setFloatingElemPosition({
      anchorElem,
      floatingElem: toolbarRef.current,
      targetRect: rect,
      horizontalPosition: 'center',
      verticalGap: 8,
    })
  }, [activeNodeKey, anchorElem, editor])

  React.useEffect(() => {
    reposition()
  }, [reposition, activeFields])

  React.useEffect(() => {
    if (!activeNodeKey) return
    const scrollerElem = anchorElem.parentElement
    const onChange = () => reposition()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    if (scrollerElem) scrollerElem.addEventListener('scroll', onChange)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      if (scrollerElem) scrollerElem.removeEventListener('scroll', onChange)
    }
  }, [activeNodeKey, anchorElem, reposition])

  // Drag-hide listener. We attach to the document so the user can start a
  // drag anywhere on the figure (including its corner handles). The
  // toolbar itself opts out — we don't hide for mousedowns originating in
  // our own UI, otherwise clicking a chip would briefly blank the toolbar.
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (toolbarRef.current && toolbarRef.current.contains(target)) return
      if (target.closest('[data-resizable-upload="true"]')) {
        setDraggingHide(true)
      }
    }
    const onUp = () => setDraggingHide(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  // Patch helper — every mutation goes through here so we never forget to
  // wrap the change in editor.update() and never accidentally clobber
  // other field values. UploadNode stores its data as one object on
  // `__data`, and setData replaces the whole thing, so we have to spread
  // both the outer data and its inner fields.
  const patchFields = React.useCallback(
    (patch: Partial<UploadNodeFields>) => {
      if (!activeNodeKey) return
      editor.update(() => {
        const node = $getNodeByKey(activeNodeKey)
        if (!node) return
        const writable = node as unknown as {
          getData?: () => { fields?: UploadNodeFields; [k: string]: unknown }
          setData?: (data: { fields: UploadNodeFields; [k: string]: unknown }) => void
        }
        if (!writable.getData || !writable.setData) return
        const d = writable.getData()
        writable.setData({ ...d, fields: { ...(d?.fields ?? {}), ...patch } })
      })
    },
    [editor, activeNodeKey],
  )

  const setAlignment = (a: UploadAlignment) => patchFields({ alignment: a })
  const setWidth = (pct: number) => patchFields({ widthPercent: pct })
  const clearWidth = () => patchFields({ widthPercent: undefined })
  const setBorder = (b: UploadBorder) => patchFields({ borderStyle: b })
  const setShadow = (s: UploadShadow) => patchFields({ shadow: s })
  const setRadius = (r: UploadRadius) => patchFields({ radius: r })
  const commitCaption = () => patchFields({ caption: captionDraft })
  const deleteImage = () => {
    if (!activeNodeKey) return
    editor.update(() => {
      const node = $getNodeByKey(activeNodeKey)
      node?.remove()
    })
  }

  if (!activeNodeKey) return null

  const alignment: UploadAlignment = activeFields?.alignment ?? 'center'
  const widthPercent = activeFields?.widthPercent
  const borderStyle: UploadBorder = activeFields?.borderStyle ?? 'none'
  const shadow: UploadShadow = activeFields?.shadow ?? 'none'
  const radius: UploadRadius = activeFields?.radius ?? 'lg'
  const widthDisabled = alignment === 'fullWidth'

  // Class tokens are factored out so the JSX stays scannable. Active state
  // uses pink-on-white to match the project's brand palette (see
  // tailwind config in CLAUDE.md).
  const btnBase =
    'inline-flex items-center justify-center h-7 min-w-7 px-2 text-[12px] font-medium rounded text-blackberry hover:bg-pink/10 transition-colors'
  const btnActive = 'bg-pink text-white hover:bg-pink'
  const divider = 'w-px h-5 bg-blackberry/10'

  const toolbar = (
    <div
      ref={toolbarRef}
      // We render absolutely because setFloatingElemPosition writes a
      // translate() transform; the top/left:0 are placeholders so the
      // transform has a stable origin to push from.
      className={`absolute flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg shadow-lg ring-1 ring-blackberry/10 z-50 ${
        draggingHide ? 'opacity-0 pointer-events-none' : ''
      }`}
      style={{ top: 0, left: 0 }}
      // Clicking the toolbar should NOT collapse the NodeSelection, which
      // would happen if focus moved off the editor. preventDefault on
      // mousedown keeps the selection intact.
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        // Inputs and textareas still need their native focus behaviour,
        // otherwise the caption field can't be typed into.
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
      }}
    >
      {/* Alignment toggles */}
      <div className="flex items-center gap-0.5">
        {ALIGNMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            className={`${btnBase} ${alignment === opt.value ? btnActive : ''}`}
            onClick={() => setAlignment(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <span className={divider} />

      {/* Width preset chips. Disabled visually when fullWidth alignment is
          active because width is ignored in that mode. */}
      <div
        className={`flex items-center gap-0.5 ${
          widthDisabled ? 'opacity-30 pointer-events-none' : ''
        }`}
        aria-disabled={widthDisabled}
      >
        {WIDTH_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            title={`Set width to ${pct}%`}
            className={`${btnBase} text-[11px] ${widthPercent === pct ? btnActive : ''}`}
            onClick={() => setWidth(pct)}
          >
            {pct}
          </button>
        ))}
        <button
          type="button"
          title="Clear width override (use size preset)"
          className={`${btnBase} text-[14px]`}
          onClick={clearWidth}
        >
          ⟲
        </button>
      </div>

      <span className={divider} />

      {/* Style popover. Keeping it in a relative wrapper lets the dropdown
          position itself directly underneath the trigger without another
          floating-position calculation. */}
      <div className="relative">
        <button
          type="button"
          title="Style options (border, shadow, radius)"
          className={`${btnBase} ${popoverOpen ? btnActive : ''}`}
          onClick={() => setPopoverOpen((v) => !v)}
        >
          ⚙
        </button>
        {popoverOpen && (
          <div
            className="absolute top-full left-0 mt-2 min-w-[180px] flex flex-col gap-2 p-2 bg-white rounded-lg shadow-lg ring-1 ring-blackberry/10 z-50"
            onMouseDown={(e) => {
              // The wrapper's onMouseDown preventDefault on the outer
              // toolbar already runs first; we still stop propagation
              // here so clicks inside the popover don't bubble back to
              // the editor root and steal selection.
              e.stopPropagation()
            }}
          >
            <RadioRow
              label="Border"
              value={borderStyle}
              options={BORDER_OPTIONS}
              onChange={(v) => setBorder(v as UploadBorder)}
            />
            <RadioRow
              label="Shadow"
              value={shadow}
              options={SHADOW_OPTIONS}
              onChange={(v) => setShadow(v as UploadShadow)}
            />
            <RadioRow
              label="Corners"
              value={radius}
              options={RADIUS_OPTIONS}
              onChange={(v) => setRadius(v as UploadRadius)}
            />
          </div>
        )}
      </div>

      <span className={divider} />

      {/* Caption input. We don't propagate keys to the editor because
          Enter/Backspace inside the field would otherwise trigger Lexical
          commands (newline, delete-node) on the selected image. */}
      <input
        type="text"
        value={captionDraft}
        onChange={(e) => setCaptionDraft(e.target.value)}
        onBlur={commitCaption}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            commitCaption()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        placeholder="Caption…"
        className="h-7 w-44 px-2 text-[12px] border border-blackberry/10 rounded focus:border-pink focus:outline-none"
      />

      <span className={divider} />

      {/* Delete. Confirm-on-click is intentionally absent — Lexical's
          undo stack restores the node instantly with Ctrl+Z, so a
          confirm dialog would be more annoying than protective. */}
      <button
        type="button"
        title="Delete image"
        className={`${btnBase} text-[14px]`}
        onClick={deleteImage}
      >
        🗑
      </button>
    </div>
  )

  // anchorElem is the host that Payload mounts the editor into; portaling
  // here keeps the toolbar inside the editor's stacking context so it
  // never gets clipped by sticky toolbars further up the tree.
  return createPortal(toolbar, anchorElem)
}

// Inline radio row used inside the style popover. Pulled out so the
// markup above stays linear. Buttons (not native radios) so we can paint
// the active state with the same brand classes as the rest of the
// toolbar instead of relying on a browser default look.
function RadioRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-blackberry/70 w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-0.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`inline-flex items-center justify-center h-6 px-1.5 text-[11px] font-medium rounded text-blackberry hover:bg-pink/10 ${
              value === opt.value ? 'bg-pink text-white hover:bg-pink' : ''
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
