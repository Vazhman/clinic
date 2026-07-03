import type { CollectionConfig } from 'payload'

// Editor-saved builder layouts. Editors press "Save as template" in the Puck
// builder; the current layout's blocks are stored here as JSON and listed in
// the Templates menu for reuse. Read is public so the menu can fetch via REST;
// create/delete require an authenticated admin (Payload's default).
export const BuilderTemplates: CollectionConfig = {
  slug: 'builder-templates',
  labels: { singular: 'შაბლონი', plural: 'შენახული შაბლონები' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    group: 'კონტენტი',
    description: 'ბილდერში შენახული განლაგების შაბლონები. იქმნება „შაბლონად შენახვა“ ღილაკით.',
    // Hidden from the sidebar — this is a backing store for the News builder's
    // "Save as template" feature, not a place to edit content. Editors save/load
    // templates from inside the builder; nothing to do here directly.
    hidden: true,
  },
  access: { read: () => true },
  fields: [
    { name: 'name', label: 'სახელი', type: 'text', required: true },
    // The Puck layout: { content: [...blocks] }. Edited only via the builder.
    { name: 'data', label: 'მონაცემები', type: 'json', required: true, admin: { hidden: true } },
  ],
}
