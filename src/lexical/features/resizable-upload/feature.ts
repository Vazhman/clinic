import { createServerFeature } from '@payloadcms/richtext-lexical'

/**
 * Server-side feature factory — the only piece that goes into the `features`
 * array in `src/payload.config.ts` (wired by a separate step).
 *
 * The `ClientFeature` string-path follows the Payload `PayloadComponent`
 * convention used by Payload's own UploadFeature:
 *
 *   '@payloadcms/richtext-lexical/client#UploadFeatureClient'
 *
 * The `#<exportName>` suffix names the export to pluck off the module — we
 * use the named `ResizableUploadFeatureClient` export from `feature.client.ts`.
 *
 * The leading `@/` uses the project's TS path alias (`@/*` → `./src/*`,
 * configured in `tsconfig.json`) — Payload's import map honours this alias
 * via Next.js' module resolution.
 */
export const ResizableUploadFeature = createServerFeature({
  key: 'resizableUpload',
  feature: {
    ClientFeature: '@/lexical/features/resizable-upload/feature.client#ResizableUploadFeatureClient',
  },
})
