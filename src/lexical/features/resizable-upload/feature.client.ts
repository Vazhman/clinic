'use client'

import { createClientFeature, UploadNode } from '@payloadcms/richtext-lexical/client'

import { FloatingUploadToolbarPlugin } from './FloatingUploadToolbar'
import { ResizableUploadNode } from './ResizableUploadNode'

/**
 * Registers:
 *
 * 1. A Lexical node replacement — Payload's stock `UploadNode` is transparently
 *    swapped for our `ResizableUploadNode` on the admin canvas. The serialized
 *    `type` stays `'upload'`, so existing data round-trips unchanged.
 *
 *    NOTE: The `with` factory creates a fresh instance (no `key` argument) so
 *    Lexical assigns a new key. Re-using the original node's key triggers
 *    `$applyNodeReplacement` to throw — see lexical/Lexical.dev.js:12122.
 *
 * 2. The floating mini-toolbar plugin in the `floatingAnchorElem` slot — same
 *    slot Payload's InlineToolbar uses. Payload renders the plugin once per
 *    editor and passes `anchorElem` automatically.
 */
export const ResizableUploadFeatureClient = createClientFeature({
  nodes: [
    {
      replace: UploadNode,
      with: (node: UploadNode) =>
        new ResizableUploadNode({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: (node as any).__data,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          format: (node as any).__format,
        }),
      // Ensures Lexical's runtime assertion accepts our subclass.
      withKlass: ResizableUploadNode,
    },
  ],
  plugins: [
    {
      Component: FloatingUploadToolbarPlugin,
      position: 'floatingAnchorElem',
    },
  ],
})

// Default export preserved so consumers that prefer `#default` in the
// PayloadComponent string-path also work.
export default ResizableUploadFeatureClient
