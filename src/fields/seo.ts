import type { Field } from 'payload'

/**
 * Sibling fields that the SEO group reads from when admin leaves
 * meta title / description / OG image empty. The custom field
 * components surface the auto-fallback as the input's placeholder so
 * editors see what will actually be used in search results.
 */
export type SeoFieldsOptions = {
  /** Sibling text field used as fallback for `metaTitle` (e.g. 'name', 'title'). */
  titleSource: string
  /** Sibling text/textarea used as fallback for `metaDescription` (e.g. 'shortDescription', 'excerpt'). */
  descriptionSource: string
  /** Optional sibling upload used as fallback for `ogImage` (e.g. 'image', 'featuredImage'). */
  imageSource?: string
  /**
   * Optional second sibling text appended to the title fallback. Used by
   * Doctors where the title formula is `<name> — <specialty> | <clinic>`.
   */
  titleSecondarySource?: string
}

/**
 * Builds the shared SEO field group. Pass which sibling fields drive the
 * auto-fallback preview so each collection (Services, Doctors, News, Pages)
 * can wire its own title/description/image sources.
 */
export function seoFields(options: SeoFieldsOptions): Field {
  const { titleSource, descriptionSource, imageSource, titleSecondarySource } = options

  return {
    name: 'seo',
    type: 'group',
    label: 'SEO',
    admin: {
      description: 'საძიებო სისტემების ოპტიმიზაცია',
    },
    fields: [
      {
        name: 'metaTitle',
        type: 'text',
        label: 'მეტა სათაური',
        localized: true,
        maxLength: 60,
        admin: {
          description: 'დატოვეთ ცარიელი ავტომატური გენერაციისთვის. მაქს. 60 სიმბოლო.',
          components: {
            Field: {
              path: '/components/admin/SeoPlaceholderField',
              clientProps: {
                kind: 'title',
                titleSource,
                titleSecondarySource: titleSecondarySource ?? null,
                descriptionSource,
              },
            },
          },
        },
      },
      {
        name: 'metaDescription',
        type: 'textarea',
        label: 'მეტა აღწერა',
        localized: true,
        maxLength: 160,
        admin: {
          description: 'დატოვეთ ცარიელი excerpt-ის გამოსაყენებლად. მაქს. 160 სიმბოლო.',
          components: {
            Field: {
              path: '/components/admin/SeoPlaceholderField',
              clientProps: {
                kind: 'description',
                titleSource,
                titleSecondarySource: titleSecondarySource ?? null,
                descriptionSource,
              },
            },
          },
        },
      },
      {
        name: 'ogImage',
        type: 'upload',
        label: 'სოციალური ქსელის სურათი (OG)',
        relationTo: 'media',
        admin: {
          description: imageSource
            ? `სოციალური ქსელებისთვის სურათი. დატოვეთ ცარიელი — გამოყენდება "${imageSource}" ველი.`
            : 'სოციალური ქსელებისთვის სურათი. დატოვეთ ცარიელი featured image-ის გამოსაყენებლად.',
        },
      },
      {
        name: 'noIndex',
        type: 'checkbox',
        label: 'ინდექსირების აკრძალვა',
        defaultValue: false,
        admin: {
          description: 'ჩართვით ეს გვერდი არ მოხვდება Google-ის ძიებაში.',
        },
      },
    ],
  }
}
