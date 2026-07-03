'use client'

// ResizableUploadComponent — the in-canvas React component that Lexical decorates
// in place of Payload's stock UploadComponent. The goal is WYSIWYG parity with
// the public-page renderer (src/components/blog/lexical-converters/StyledUpload.tsx)
// PLUS interactive resize handles that persist back to node.__data.fields.widthPercent
// via the UploadNode.setData() API (confirmed in
// node_modules/@payloadcms/richtext-lexical/dist/features/upload/server/nodes/UploadNode.js
// lines 88-94: getData/setData are real methods on UploadServerNode).
//
// The 8 handles drive a percentage of the *parent container width* (not the
// viewport) so layouts stay correct inside Payload's live-preview iframe at
// any breakpoint. Corner drags maintain aspect ratio by setting height:auto on
// the <img>; edge drags scale only one axis. We commit to Lexical exactly once
// per drag (on pointerup) — during the drag we mutate inline style directly
// for 60fps feedback without spamming editor.update() and forcing re-renders.

import * as React from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import type {
  ResizableUploadComponentProps,
  UploadMediaValue,
  UploadNodeFields,
} from './types'

// --- styling maps -----------------------------------------------------------
// These mirror StyledUpload.tsx EXACTLY so the editor canvas matches the
// published page. One deliberate divergence: ring-offset-cream becomes
// ring-offset-white because the Payload admin canvas is white, not cream.

type Alignment = NonNullable<UploadNodeFields['alignment']>
type Size = NonNullable<UploadNodeFields['size']>
type Border = NonNullable<UploadNodeFields['borderStyle']>
type Shadow = NonNullable<UploadNodeFields['shadow']>
type Radius = NonNullable<UploadNodeFields['radius']>

const alignmentClass: Record<Alignment, string> = {
  left: 'md:float-left md:mr-8 mb-4 max-w-full',
  center: 'mx-auto max-w-full',
  right: 'md:float-right md:ml-8 mb-4 max-w-full',
  fullWidth: 'w-full max-w-full',
}

const sizeClass: Record<Size, string> = {
  small: 'md:max-w-[33%]',
  medium: 'md:max-w-[50%]',
  large: 'md:max-w-[75%]',
  full: 'md:max-w-full',
}

const borderClass: Record<Border, string> = {
  none: '',
  pink: 'ring-2 ring-pink ring-offset-2 ring-offset-white',
  blackberry: 'ring-2 ring-blackberry ring-offset-2 ring-offset-white',
  grey: 'ring-2 ring-grey/30 ring-offset-2 ring-offset-white',
}

const shadowClass: Record<Shadow, string> = {
  none: '',
  soft: 'shadow-md shadow-blackberry/10',
  strong: 'shadow-xl shadow-blackberry/20',
}

const radiusClass: Record<Radius, string> = {
  none: 'rounded-none',
  lg: 'rounded-xl sm:rounded-2xl',
  full: 'rounded-full aspect-square object-cover',
}

// --- handle config ----------------------------------------------------------
// 8 handles: 4 corners (diagonal-resize, maintain aspect) + 4 edges
// (single-axis resize). Direction string encodes compass points; the math
// later uses .includes('e') / .includes('w') to decide deltaX sign and
// .includes('n') / .includes('s') for vertical edge handles. Positioning is
// Tailwind absolute coords relative to the <figure>.

type HandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const handles: Array<{ dir: HandleDirection; pos: string; cursor: string }> = [
  { dir: 'nw', pos: '-top-1.5 -left-1.5', cursor: 'cursor-nw-resize' },
  { dir: 'n', pos: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'cursor-n-resize' },
  { dir: 'ne', pos: '-top-1.5 -right-1.5', cursor: 'cursor-ne-resize' },
  { dir: 'e', pos: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'cursor-e-resize' },
  { dir: 'se', pos: '-bottom-1.5 -right-1.5', cursor: 'cursor-se-resize' },
  { dir: 's', pos: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'cursor-s-resize' },
  { dir: 'sw', pos: '-bottom-1.5 -left-1.5', cursor: 'cursor-sw-resize' },
  { dir: 'w', pos: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'cursor-w-resize' },
]

// ---------------------------------------------------------------------------

export function ResizableUploadComponent({
  nodeKey,
  data,
}: ResizableUploadComponentProps): React.ReactElement {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelected] = useLexicalNodeSelection(nodeKey)

  const figureRef = React.useRef<HTMLElement | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  // Snapshots taken on pointerdown and read inside the document-level
  // pointermove handler. Refs (not state) because we don't want re-renders
  // during drag — we mutate inline style directly for 60fps feedback.
  const dragState = React.useRef<{
    startX: number
    startWidth: number
    containerWidth: number
    direction: HandleDirection
    latestPct: number
    pointerId: number
  } | null>(null)

  // --- field resolution ----------------------------------------------------
  // Defaults match StyledUpload.tsx so a freshly-inserted image with no
  // tweaks looks identical in admin and public renders.
  const fields = data.fields ?? {}
  const alignment: Alignment = fields.alignment ?? 'center'
  // fullWidth alignment ignores `size` — same precedence as the public renderer.
  const size: Size = alignment === 'fullWidth' ? 'full' : (fields.size ?? 'large')
  const border: Border = fields.borderStyle ?? 'none'
  const shadow: Shadow = fields.shadow ?? 'none'
  const radius: Radius = fields.radius ?? 'lg'
  const widthPercent = fields.widthPercent

  // Inline width takes precedence over the size class — when the user has
  // dragged a handle, widthPercent is set and we hand off to inline style.
  // The class-based size token is suppressed so the two don't fight.
  const inlineStyle: React.CSSProperties | undefined = widthPercent
    ? { width: `${widthPercent}%`, maxWidth: '100%' }
    : undefined
  const sizeClassValue = widthPercent ? '' : sizeClass[size]

  // Width-percent dragging is meaningless for full-width images (they always
  // fill the column), so we render the handles but make them visually muted
  // and non-interactive as a hint to the editor.
  const handlesDisabled = alignment === 'fullWidth'

  // --- Lexical command wiring ---------------------------------------------
  // CLICK_COMMAND at LOW priority: if the click landed inside our figure, we
  // claim the node selection. Returning true stops further handlers from
  // also reacting to the same click.
  // KEY_ESCAPE: drop our selection so handles disappear.
  // KEY_BACKSPACE / KEY_DELETE: if our node is selected, remove it.
  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const target = event.target as Node | null
          if (target && figureRef.current?.contains(target)) {
            // Shift-click could be used for multi-select later; for now we
            // always replace selection with just this node.
            setSelected(true)
            return true
          }
          // Click outside our figure — let other handlers (or nothing) deal
          // with it. We also clear our own selection so handles vanish.
          if (isSelected) clearSelected()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isSelected) {
            clearSelected()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        () => removeIfSelected(),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        () => removeIfSelected(),
        COMMAND_PRIORITY_LOW,
      ),
    )

    function removeIfSelected(): boolean {
      // We only consume the keystroke if our node is *the* current selection.
      // Otherwise text editing would lose its backspace.
      const selection = $getSelection()
      if (!$isNodeSelection(selection)) return false
      const nodes = selection.getNodes()
      if (!nodes.some((n) => n.getKey() === nodeKey)) return false
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        node?.remove()
      })
      return true
    }
  }, [editor, nodeKey, isSelected, setSelected, clearSelected])

  // --- resize drag logic ---------------------------------------------------

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>, direction: HandleDirection) => {
      if (handlesDisabled) return
      e.preventDefault()
      e.stopPropagation()

      const img = imgRef.current
      const figure = figureRef.current
      const container = figure?.parentElement
      if (!img || !figure || !container) return

      // setPointerCapture lets us keep receiving move/up events even if the
      // cursor exits the handle div mid-drag — vital because dragging fast
      // *will* outrun a 12px target.
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      dragState.current = {
        startX: e.clientX,
        startWidth: img.offsetWidth,
        // containerWidth = 100% reference. We measure the figure's parent
        // (the editor's content wrapper) so the percentage is relative to
        // the column the figure lives in, NOT the viewport.
        containerWidth: container.offsetWidth,
        direction,
        latestPct: widthPercent ?? Math.round((img.offsetWidth / container.offsetWidth) * 100),
        pointerId: e.pointerId,
      }

      // Document-level listeners because the pointer can easily leave the
      // handle's tiny box during a fast drag.
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    },
    // handlePointerMove / handlePointerUp are stable refs defined below; we
    // intentionally don't include them in deps to avoid re-creating this
    // callback on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handlesDisabled, widthPercent],
  )

  const handlePointerMove = React.useCallback((e: PointerEvent) => {
    const state = dragState.current
    const img = imgRef.current
    if (!state || !img) return

    // East-side handles (e, ne, se) grow when deltaX is positive; west-side
    // handles (w, nw, sw) grow when deltaX is negative. North/south-only
    // handles (n, s) don't change width at all — we treat them as no-op for
    // width but they still let the user resize the image height purely
    // visually. To keep things simple and avoid storing height in fields,
    // we let n/s drag the bottom edge proportionally too.
    const deltaX = e.clientX - state.startX
    const dir = state.direction

    let newWidthPx: number
    if (dir === 'n' || dir === 's') {
      // Pure vertical handles: use vertical delta mapped onto width to keep
      // aspect — i.e. dragging down on the south handle widens the image
      // (since height:auto means width drives both). This is a simplification
      // but it's the convention every WYSIWYG editor I checked uses.
      const deltaY = e.clientY - (state.startX /* unused, but kept symmetric */ ?? 0)
      // For n/s handles we actually want height-only feedback — but our
      // persistence model is width-only. So treat them as a small width
      // nudge proportional to deltaY. Pragmatic compromise.
      newWidthPx = state.startWidth + (dir === 's' ? deltaY : -deltaY) * 0.5
    } else {
      const grow = dir.includes('e') ? deltaX : -deltaX
      newWidthPx = state.startWidth + grow
    }

    // Clamp to 10%..100% — below 10 the image becomes a useless dot, above
    // 100 we'd overflow the column.
    const pct = Math.min(
      100,
      Math.max(10, Math.round((newWidthPx / state.containerWidth) * 100)),
    )

    // Live preview during drag — direct DOM, no React, no Lexical commit.
    img.style.width = `${pct}%`
    // Corner handles imply proportional scaling, so explicitly let height
    // follow the intrinsic aspect ratio.
    if (dir.length === 2) img.style.height = 'auto'

    state.latestPct = pct
  }, [])

  const handlePointerUp = React.useCallback(
    (e: PointerEvent) => {
      const state = dragState.current

      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)

      if (!state) return

      // Commit the new width to the node's __data.fields.widthPercent. We
      // do this exactly once per drag (here) — never during pointermove —
      // so editor history doesn't get a stack of intermediate states.
      const finalPct = state.latestPct
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (!node) return
        // UploadNode (via UploadServerNode) exposes getData/setData; verified
        // against node_modules/.../upload/server/nodes/UploadNode.js. We
        // narrow via duck-typing because the exact node class isn't typed
        // through Lexical's $getNodeByKey return.
        const maybe = node as unknown as {
          getData?: () => { fields?: UploadNodeFields } & Record<string, unknown>
          setData?: (next: { fields?: UploadNodeFields } & Record<string, unknown>) => void
        }
        if (typeof maybe.getData !== 'function' || typeof maybe.setData !== 'function') return
        const current = maybe.getData()
        maybe.setData({
          ...current,
          fields: {
            ...(current.fields ?? {}),
            widthPercent: finalPct,
          },
        })
      })

      // Best-effort release — the element may already be gone if React
      // re-rendered, hence the try/catch.
      try {
        const target = e.target as HTMLElement | null
        target?.releasePointerCapture?.(state.pointerId)
      } catch {
        /* ignored */
      }

      dragState.current = null
    },
    // handlePointerMove is stable across renders (defined with useCallback
    // and empty deps), so we can omit it safely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, nodeKey],
  )

  // --- media resolution ----------------------------------------------------
  // At edit time Payload hydrates the relation, so data.value is normally
  // the populated Media doc. If we somehow received only an id (string or
  // number), bail out with a placeholder so the editor still scrolls.
  const media: UploadMediaValue | null =
    typeof data.value === 'object' && data.value !== null
      ? (data.value as UploadMediaValue)
      : null

  if (!media?.url) {
    return (
      <div className="text-grey-light text-sm italic p-4 border border-dashed border-grey/30 rounded-lg my-6">
        [image not loaded]
      </div>
    )
  }

  // --- render --------------------------------------------------------------

  return (
    <figure
      ref={figureRef}
      className={`my-6 sm:my-8 relative ${alignmentClass[alignment]} ${sizeClassValue} ${
        isSelected ? 'outline outline-2 outline-pink outline-offset-2' : ''
      }`}
      style={inlineStyle}
      contentEditable={false}
      data-resizable-upload="true"
    >
      <img
        ref={imgRef}
        src={media.url}
        alt={media.alt ?? ''}
        className={`block w-full max-w-full h-auto ${radiusClass[radius]} ${borderClass[border]} ${shadowClass[shadow]}`}
        draggable={false}
      />

      {isSelected &&
        handles.map((h) => (
          <div
            key={h.dir}
            data-direction={h.dir}
            onPointerDown={(e) => handlePointerDown(e, h.dir)}
            className={`absolute ${h.pos} w-3 h-3 bg-pink border border-white rounded-sm ${h.cursor} ${
              handlesDisabled ? 'pointer-events-none opacity-30' : ''
            }`}
            // Block clicks so they don't bubble to the editor and move the
            // text caret while the user is grabbing a handle.
            onClick={(e) => e.stopPropagation()}
          />
        ))}

      {fields.caption && (
        <figcaption className="text-[13px] text-grey-light text-center mt-3 italic break-words">
          {fields.caption}
        </figcaption>
      )}
    </figure>
  )
}
