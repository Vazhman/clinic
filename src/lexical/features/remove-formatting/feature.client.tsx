'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical'

// Simple eraser glyph — matches the ~20x20 icon footprint Payload's own
// toolbar buttons use (see node_modules/@payloadcms/richtext-lexical's
// lexical/ui/icons/*). No external icon library is pulled in.
function RemoveFormattingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h7" />
      <path d="M14.5 4.5 20 10l-8.5 8.5H7L3 14.5Z" />
      <path d="m9 12 6 6" />
    </svg>
  )
}

/**
 * "Remove formatting" toolbar button — clears standard character-level
 * marks (bold/italic/underline/strikethrough/inline-code/sub/superscript)
 * and any inline style string from the selected text nodes.
 *
 * Scope note: colors/backgrounds applied via `TextStateFeature`'s own
 * dropdown are NOT touched here — that dropdown already exposes its own
 * "none" swatch to clear state, and TextState values live in Lexical's
 * per-node state map (not the `.style` string this button resets), so
 * clearing them needs the state's own stateConfig reference, which isn't
 * reachable from a generic, editor-agnostic feature like this one.
 */
export const RemoveFormattingFeatureClient = createClientFeature({
  toolbarFixed: {
    groups: [
      {
        key: 'removeFormatting',
        type: 'buttons',
        order: 60,
        items: [
          {
            key: 'removeFormatting',
            label: 'მოცილება ფორმატირების',
            ChildComponent: RemoveFormattingIcon,
            onSelect: ({ editor }) => {
              editor.update(() => {
                const selection = $getSelection()
                if (!$isRangeSelection(selection)) return
                for (const node of selection.getNodes()) {
                  if ($isTextNode(node)) {
                    node.setFormat(0)
                    node.setStyle('')
                  }
                }
              })
            },
          },
        ],
      },
    ],
  },
  toolbarInline: {
    groups: [
      {
        key: 'removeFormatting',
        type: 'buttons',
        order: 60,
        items: [
          {
            key: 'removeFormatting',
            label: 'მოცილება ფორმატირების',
            ChildComponent: RemoveFormattingIcon,
            onSelect: ({ editor }) => {
              editor.update(() => {
                const selection = $getSelection()
                if (!$isRangeSelection(selection)) return
                for (const node of selection.getNodes()) {
                  if ($isTextNode(node)) {
                    node.setFormat(0)
                    node.setStyle('')
                  }
                }
              })
            },
          },
        ],
      },
    ],
  },
})

export default RemoveFormattingFeatureClient
