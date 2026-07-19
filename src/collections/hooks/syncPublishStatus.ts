import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Fixes the "dual publish-gate" bug: collections like Pages/News carry BOTH
 * Payload's native draft/publish system (`versions: { drafts: true }`, which
 * sets the hidden `_status` field to 'draft' | 'published' when the editor
 * clicks the native "Save Draft" / "Publish changes" buttons) AND an
 * independent custom `status` select field that the public-facing queries
 * actually filter on (`where: { status: { equals: 'published' } }`).
 *
 * Before this hook, clicking "Publish changes" only flipped `_status` —
 * the custom `status` field stayed at its default ('draft') until an editor
 * also remembered to flip a second, unrelated-looking dropdown by hand. The
 * document would save successfully with no error, yet stay invisible on the
 * frontend (404) — reproduced live: after "Publish changes", `_status` was
 * "published" but `status` was still "draft", and `/blog/<slug>` 404'd.
 *
 * Fix: every create/update, mirror the custom `status` field to whatever the
 * native `_status` says. By the time collection-level `beforeChange` hooks
 * run, Payload has already resolved `data._status` to the real outcome of
 * the action the editor took (explicit 'published' on Publish, forced
 * 'draft' when saving a draft — see
 * node_modules/payload/dist/collections/operations/utilities/update.js and
 * .../create.js), so reading it here is reliable and doesn't need to guess
 * at request query params.
 *
 * This makes the custom `status` field a read-only mirror driven by the
 * native publish button — editors only ever need to press one button, and
 * the two fields can never drift apart again. The field is left in the
 * schema (not removed) so existing `defaultColumns`, admin sorting/filtering
 * UI, and any other code reading `status` keep working unchanged.
 */
export const syncPublishStatus: CollectionBeforeChangeHook = ({ data }) => {
  if (data && typeof data._status === 'string') {
    data.status = data._status === 'published' ? 'published' : 'draft'
  }
  return data
}
