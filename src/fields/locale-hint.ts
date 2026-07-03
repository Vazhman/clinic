import type { Field } from 'payload'

/**
 * Drop this UI field at the top of any collection or global that has
 * localized fields. It renders a coloured banner showing the editor which
 * language version they're currently editing, so an empty `name` doesn't
 * read as "broken data" when it actually just hasn't been translated yet.
 */
export const localeHint: Field = {
  name: 'localeHint',
  type: 'ui',
  admin: {
    components: {
      Field: '/components/admin/LocaleHintBanner',
    },
  },
}
