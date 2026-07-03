import type { Block } from 'payload'

// Inline Lexical block: a 2/3/4-column image grid. Each image is a Media
// upload + optional caption. Layout is decided by `columns`; styling
// (rounded corners, brand shadow) lives in GalleryRenderer.tsx.
export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'სურათების გალერეა', plural: 'გალერეები' },
  fields: [
    {
      name: 'columns',
      type: 'select',
      required: true,
      defaultValue: '3',
      options: [
        { label: '2 სვეტი', value: '2' },
        { label: '3 სვეტი', value: '3' },
        { label: '4 სვეტი', value: '4' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 12,
      labels: { singular: 'სურათი', plural: 'სურათები' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
  ],
}
