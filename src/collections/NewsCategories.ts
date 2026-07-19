import type { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug'

// Admin-manageable replacement for the old hardcoded 4-option `category`
// select on News (see the hidden `category` field in News.ts for the legacy
// column kept for rollback safety). Editors add/rename/remove categories
// here and pick one per article via the `categoryRef` relationship field.
export const NewsCategories: CollectionConfig = {
  slug: 'news-categories',
  labels: { singular: 'სიახლის კატეგორია', plural: 'სიახლის კატეგორიები' },
  admin: {
    useAsTitle: 'name',
    description: 'სიახლეების კატეგორიები — დაამატეთ, გადაარქვით ან წაშალეთ საჭიროებისამებრ. სიახლის ფორმაში კატეგორია აირჩევა აქ შექმნილთაგან.',
    defaultColumns: ['name', 'slug', 'sortOrder', 'hidden'],
    group: 'კონტენტი',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      label: 'დასახელება',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField('news-categories', 'name', {
      description: 'ცარიელი დატოვებისას ავტომატურად შეიქმნება დასახელებიდან.',
    }),
    {
      name: 'sortOrder',
      label: 'რიგი',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'დალაგების რიგი კატეგორიების ჩამონათვალში (ნაკლები = პირველი).',
      },
    },
    {
      name: 'hidden',
      label: 'დამალვა ფილტრიდან',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'მონიშვნისას კატეგორია არ გამოჩნდება ბლოგის გვერდის ფილტრში. არსებული სტატიები არ იშლება და პირდაპირი ბმულით ხელმისაწვდომია — მხოლოდ ფილტრის ჩამონათვალიდან იმალება.',
      },
    },
  ],
}
