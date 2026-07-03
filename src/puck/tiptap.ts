import { StarterKit } from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { generateHTML } from '@tiptap/html'
import type { JSONContent } from '@tiptap/core'

// Image node extended with an `align` attribute (left | center | right). The
// align renders to a class so CSS can float it and let text wrap around it —
// the natural "drop an image and text flows around it" behaviour, done INSIDE
// the text flow (not as a separate block).
const FloatImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-align') || 'center',
        renderHTML: (attrs: { align?: string }) => ({
          'data-align': attrs.align ?? 'center',
          class: `pk-inline-img pk-inline-img--${attrs.align ?? 'center'}`,
        }),
      },
    }
  },
})

// StarterKit v3 already bundles Link (configured here to avoid a duplicate-
// extension error). Image is added separately as FloatImage.
//
// One extension list shared by the editor (LocalizedRichTextField) and the
// server renderer, so what editors type renders identically on the page.
export const tiptapExtensions = [
  StarterKit.configure({
    heading: { levels: [3, 4] },
    link: {
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener', class: 'text-pink underline' },
    },
  }),
  FloatImage.configure({ inline: false, allowBase64: false }),
]

// Render stored TipTap JSON to a sanitized HTML string on the server. We
// generate from structured JSON (not stored HTML) so no raw user HTML is
// ever injected.
export function richTextToHtml(json: JSONContent | undefined | null): string {
  if (!json) return ''
  try {
    return generateHTML(json, tiptapExtensions)
  } catch {
    return ''
  }
}

export type { JSONContent }
