import { createServerFeature } from '@payloadcms/richtext-lexical'

/**
 * Server-side registration for the "Remove formatting" toolbar button.
 * Mirrors the pattern used by `resizable-upload/feature.ts` — this is the
 * only piece that goes into the `features` array in `src/payload.config.ts`
 * (and `ColumnsBlock.ts`'s cell editor).
 */
export const RemoveFormattingFeature = createServerFeature({
  key: 'removeFormatting',
  feature: {
    ClientFeature: '@/lexical/features/remove-formatting/feature.client#RemoveFormattingFeatureClient',
  },
})
