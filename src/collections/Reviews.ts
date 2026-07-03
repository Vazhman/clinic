import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'შეფასება', plural: 'შეფასებები' },
  admin: {
    useAsTitle: 'author',
    description: 'პაციენტების შეფასებების მართვა. ორი გზა: (1) ხელით დამატება — დააჭირე "ახლის შექმნა" (Create New) და ჩაწერე ავტორი, ტექსტი და შეფასება (მაგ. Google Maps-დან კოპირებული). (2) Google-დან ავტომატური სინქი — Dashboard-ის "Google შეფასებები" ღილაკით (ჩამოაქვს მხოლოდ 5 ყველაზე რელევანტური, ხშირად იგივე). \'გამოქვეყნებული\' ჩექბოქსი აკონტროლებს რა გამოჩნდეს საიტზე.',
    defaultColumns: ['author', 'rating', 'published', 'source', 'date'],
    group: 'კონტენტი',
  },
  access: { read: () => true },
  fields: [
    { name: 'author', label: 'ავტორი', type: 'text', required: true, localized: true, admin: { description: 'შემფასებლის სახელი — ისე, როგორც გამოჩნდება საიტზე.' } },
    { name: 'rating', label: 'შეფასება', type: 'number', required: true, min: 1, max: 5, admin: { description: 'შეფასება 1-დან 5-მდე. 1 = ცუდი, 5 = შესანიშნავი.' } },
    { name: 'text', label: 'შეფასების ტექსტი', type: 'textarea', required: true, localized: true, admin: { description: 'შეფასების სრული ტექსტი. Google Maps-დან კოპირებისას ჩასვი იქ დაწერილი ტექსტი.' } },
    { name: 'date', label: 'თარიღი', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { description: 'შეფასების თარიღი. ხელით დამატებისას ავტომატურად ივსება დღევანდელით — შეგიძლია შეცვალო.' } },
    {
      name: 'source',
      label: 'წყარო',
      type: 'select',
      required: true,
      defaultValue: 'internal',
      admin: { description: 'საიდან მოვიდა შეფასება. ხელით დამატებისას დატოვე "ხელით დამატებული".' },
      options: [
        { label: 'Google (ავტომატური სინქი)', value: 'google' },
        { label: 'ხელით დამატებული', value: 'internal' },
      ],
    },
    {
      name: 'published',
      label: 'გამოქვეყნებული',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'მონიშნულია — ჩანს საიტზე. გაუქმებულია — დამალულია.',
      },
    },
    // ── Google-only metadata (used by /api/sync-google-reviews) ───────────
    {
      name: 'googleReviewId',
      label: 'Google შეფასების ID',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Google-დან სინქის ID. ცარიელია "internal" შეფასებებზე.',
      },
    },
    {
      name: 'authorPhotoUrl',
      label: 'ავტორის ფოტოს URL',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'მომხმარებლის ფოტოს URL Google-დან (ავტომატური).',
      },
    },
  ],
}
