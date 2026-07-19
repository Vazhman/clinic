import type { Payload } from 'payload'

// `CollectionConfig.admin.hidden` only ever receives `{ user }` synchronously
// (payload/dist/collections/config/types.d.ts) — it cannot read a Global from
// the DB itself. To gate a collection's admin nav/routes on the
// `feature-toggles` global, we mirror its value into this in-memory cache:
// populated once via payload.config.ts's `onInit`, then kept fresh by
// FeatureToggles.ts's `afterChange` hook (fires immediately on save, so the
// same "change is instant" behavior the global's own admin description
// already promises for the public frontend also applies to the admin nav).
export const featureTogglesCache: { labTests: boolean } = {
  labTests: true,
}

export async function refreshFeatureTogglesCache(payload: Payload): Promise<void> {
  try {
    const toggles = await payload.findGlobal({ slug: 'feature-toggles' })
    featureTogglesCache.labTests = toggles?.labTests !== false
  } catch (err) {
    // Best-effort cache warm at cold start — e.g. the table doesn't exist
    // yet on a freshly `push`-ed local DB. Must never crash onInit (and
    // therefore the whole admin panel); fails open to the default (visible)
    // and self-corrects on the global's own afterChange hook once saved.
    payload.logger.warn(`feature-toggles cache warm failed, defaulting to visible: ${String(err)}`)
  }
}
