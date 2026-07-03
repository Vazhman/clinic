import type { Field } from 'payload'

/**
 * Shared auto-generating slug field.
 *
 * Editors reported they couldn't create Pages/Doctors/News without hand-typing
 * a URL — the slug fields were `required` with no auto-generation. This field
 * is optional in the form: when left blank, a beforeValidate hook derives it
 * from the document's title-ish field (Georgian and Cyrillic transliterated to
 * Latin) and de-duplicates against existing docs by appending -2, -3, …
 *
 * Typing a slug by hand still works exactly as before (it wins over the
 * auto-generation; we only fill BLANK slugs).
 */

const KA_TO_LAT: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't', ი: 'i',
  კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh', რ: 'r', ს: 's',
  ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'gh', ყ: 'q', შ: 'sh', ჩ: 'ch', ც: 'ts',
  ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh', ჯ: 'j', ჰ: 'h',
}

const RU_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => KA_TO_LAT[ch] ?? RU_TO_LAT[ch] ?? ch)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function slugField(
  collectionSlug: string,
  sourceField: string,
  opts: { sidebar?: boolean; description?: string } = {},
): Field {
  return {
    name: 'slug',
    label: 'URL მისამართი',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      ...(opts.sidebar === false ? {} : { position: 'sidebar' as const }),
      description:
        opts.description ??
        'ცარიელი დატოვებისას ავტომატურად შეიქმნება სათაურიდან (ქართული ლათინურად გადაიწერება). ხელით ჩაწერაც შეიძლება.',
    },
    hooks: {
      beforeValidate: [
        async ({ value, data, req, originalDoc }) => {
          const typed = typeof value === 'string' ? value.trim() : ''
          if (typed) return slugify(typed) || typed

          // Keep the existing slug on updates that don't touch it.
          const existing = typeof originalDoc?.slug === 'string' ? originalDoc.slug : ''
          if (existing) return existing

          const source = data?.[sourceField]
          const base =
            (typeof source === 'string' && slugify(source)) ||
            `${collectionSlug}-${Date.now().toString(36)}`

          // De-duplicate: name, name-2, name-3, … (excluding this doc itself).
          let candidate = base
          for (let n = 2; n < 50; n++) {
            const clash = await req.payload.find({
              collection: collectionSlug as never,
              where: { slug: { equals: candidate } } as never,
              limit: 1,
              depth: 0,
            })
            const other = clash.docs[0] as { id?: unknown } | undefined
            if (!other || (originalDoc?.id != null && other.id === originalDoc.id)) break
            candidate = `${base}-${n}`
          }
          return candidate
        },
      ],
    },
    validate: (val: unknown) =>
      (typeof val === 'string' && val.length > 0) ||
      'URL ვერ შეიქმნა — შეიყვანეთ ხელით (ლათინური ასოები და დეფისი)',
  }
}
