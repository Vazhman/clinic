import { createServerFeature } from '@payloadcms/richtext-lexical'

/**
 * WordPress "Text" tab equivalent — a toggler button (rendered above the
 * editing canvas) that opens a drawer with a fully editable HTML textarea.
 * Mirrors the `remove-formatting` / `resizable-upload` convention: this
 * server file is the only piece that goes into a `features` array; the
 * actual plugin lives in `feature.client.tsx`.
 */
export const HtmlSourceFeature = createServerFeature({
  key: 'htmlSource',
  feature: {
    ClientFeature: '@/lexical/features/html-source/feature.client#HtmlSourceFeatureClient',
  },
})
