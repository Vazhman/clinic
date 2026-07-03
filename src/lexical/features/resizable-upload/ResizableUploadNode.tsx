'use client'

import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { UploadNode } from '@payloadcms/richtext-lexical/client'
import type { EditorConfig, LexicalEditor } from 'lexical'
import * as React from 'react'
import type { JSX } from 'react'

// Lazy-load the canvas component (same pattern Payload uses for its stock
// UploadNode). Keeps the admin bundle smaller until an upload node mounts.
const ResizableUploadComponent = React.lazy(() =>
  import('./ResizableUploadComponent').then((m) => ({
    default: m.ResizableUploadComponent,
  })),
)

/**
 * Drop-in replacement for Payload's stock UploadNode. The serialized `type`
 * stays `'upload'` so existing data round-trips unchanged — we only override
 * `decorate()` to render our custom resizable canvas component.
 *
 * Registered via the Lexical node-replacement mechanism in `feature.client.ts`.
 */
export class ResizableUploadNode extends UploadNode {
  static override getType(): string {
    // Identical to parent — same serialized `type` string ensures round-trip.
    return 'upload'
  }

  static override clone(node: ResizableUploadNode): ResizableUploadNode {
    return new ResizableUploadNode({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (node as any).__data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      format: (node as any).__format,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key: (node as any).__key,
    })
  }

  /**
   * Inherits `importJSON` from `UploadNode`. The parent calls
   * `$createUploadNode(...)` → `$applyNodeReplacement(new UploadNode(...))`,
   * which routes through our registered replacement factory and returns a
   * `ResizableUploadNode`. No override needed.
   *
   * Likewise `exportJSON` is inherited unchanged — same `type: 'upload'`,
   * same fields/value/relationTo, so existing rows continue to deserialize.
   */

  override decorate(_editor?: LexicalEditor, _config?: EditorConfig): JSX.Element {
    return (
      <React.Suspense fallback={null}>
        <ResizableUploadComponent
          nodeKey={this.getKey()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={(this as any).__data}
        />
      </React.Suspense>
    )
  }
}

// Re-export for downstream consumers that need the serialized shape.
export type { SerializedUploadNode }
