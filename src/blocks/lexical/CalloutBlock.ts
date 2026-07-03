import type { Block } from 'payload'

// Inline Lexical block: a coloured callout box rendered inside an article.
// Variants map to Tailwind classes in CalloutRenderer.tsx — extending this
// list here REQUIRES adding the matching className branch in the renderer.
export const CalloutBlock: Block = {
  slug: 'callout',
  labels: { singular: 'შენიშვნა (Callout)', plural: 'შენიშვნები' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'ინფორმაცია (ცისფერი)', value: 'info' },
        { label: 'რჩევა (ვარდისფერი)', value: 'tip' },
        { label: 'გაფრთხილება (ყვითელი)', value: 'warning' },
        { label: 'მნიშვნელოვანი (ჟოლოსფერი)', value: 'important' },
      ],
    },
    { name: 'title', type: 'text', localized: true, admin: { description: 'სათაური (არასავალდებულო)' } },
    { name: 'body', type: 'textarea', required: true, localized: true },
  ],
}
