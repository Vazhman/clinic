import type { CollectionConfig } from 'payload'

import { seoFields } from '../fields/seo'
import { localeHint } from '../fields/locale-hint'
import { slugField } from '../fields/slug'
import { syncPublishStatus } from './hooks/syncPublishStatus'

// Pages was previously a heavy block-builder with 11 block types. For a
// clinic site the realistic use case is a handful of static info pages
// (Privacy, Terms, Insurance, Patient Rights, Careers) — a heading + a
// rich-text body covers all of them. The block builder duplicated
// functionality that already exists as hand-built routes (Hero, Stats,
// DoctorsGrid, Gallery, CTA) and made the editor pick between 11 cards
// every time they wanted to add a paragraph. The `body` Lexical field
// inherits the project-wide editor (image upload + callout + gallery
// inline blocks etc) from payload.config.ts, so admins can still drop
// images / callouts / galleries inside a page — they just don't have a
// top-level block selector anymore.
//
// The old `layout` column is kept (hidden) so Postgres push doesn't try
// to DROP the existing data. Future cleanup PR can remove it once we're
// sure nobody needs the historical block structure.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'გვერდი', plural: 'გვერდები' },
  admin: {
    useAsTitle: 'title',
    description: 'მარტივი სტატიკური გვერდები (Privacy, Terms, ბილინგი, კარიერა და ა.შ). სათაური + ტექსტი + (სურვილისამებრ) მენიუში ჩვენება. სტატუსით ("მონახაზი"/"გამოქვეყნებული") იმართება გვერდის ჩართვა/გამორთვა საიტზე.',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'კონტენტი',
    components: {
      beforeListTable: ['/components/admin/PageSettingsPanel'],
    },
  },
  access: {
    // REST/GraphQL read is restricted to authenticated admins. The public
    // site renders pages through the local API (getPayload, overrideAccess),
    // so /pages/[slug], footer legal links, sitemap, nav and chat are all
    // unaffected — this only blocks anonymous access to /api/pages.
    read: ({ req }) => Boolean(req.user),
    // create/update/delete already default to authenticated-only in Payload.
  },
  versions: { drafts: true },
  // Keeps the custom `status` field (used by frontend queries) in sync with
  // Payload's native publish/draft state — see syncPublishStatus.ts for why
  // this exists (the dual publish-gate bug: clicking native "Publish
  // changes" used to leave this collection's custom `status` untouched at
  // its 'draft' default, so the page stayed invisible on the frontend).
  hooks: { beforeChange: [syncPublishStatus] },
  fields: [
    localeHint,
    { name: 'title', label: 'სათაური', type: 'text', required: true, localized: true, admin: { description: 'გვერდის სათაური. გამოჩნდება ბრაუზერის ჩანართზე + breadcrumb-ში.' } },
    {
      name: 'body',
      label: 'ტექსტი',
      type: 'richText',
      localized: true,
      admin: {
        description: 'სრული ტექსტი. გამოიყენეთ "+" ღილაკი ან slash menu (/) სურათის, შენიშვნის (callout), გალერეის ჩასასმელად.',
      },
    },
    slugField('pages', 'title'),
    // Navigation auto-include — set in last session. Stays.
    {
      name: 'showInNav',
      label: 'მენიუში ჩვენება',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'ჩართვით ეს გვერდი ავტომატურად დაემატება საიტის ნავიგაციის მენიუს (გამოქვეყნებული გვერდებიდან).',
      },
    },
    {
      name: 'navOrder',
      label: 'რიგი მენიუში',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'მენიუში ჩვენების რიგი (უფრო დაბალი = პირველი).',
        condition: (data) => data?.showInNav === true,
      },
    },
    {
      name: 'navLabel',
      label: 'მენიუს ლეიბლი',
      type: 'text',
      localized: true,
      admin: {
        position: 'sidebar',
        description: 'მენიუში სათაურის ნაცვლად საჩვენებელი ტექსტი (არასავალდებულო).',
        condition: (data) => data?.showInNav === true,
      },
    },
    {
      name: 'status',
      label: 'სტატუსი',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'მონახაზი (საიტზე არ ჩანს)', value: 'draft' },
        { label: 'გამოქვეყნებული (ხილვადია საიტზე)', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'ავტომატურად სინქრონდება "Publish changes" / "Save Draft" ღილაკებთან — ხელით შეცვლა საჭირო აღარ არის.',
        readOnly: true,
      },
    },
    // Legacy block-builder field. Hidden from admin so editors aren't
    // confused, but kept in the schema so Postgres push doesn't try to
    // drop the column on existing Pages docs. Safe to delete in a future
    // migration once verified that no historical data is needed.
    {
      name: 'layout',
      type: 'json',
      admin: { hidden: true },
    },
    // Pages don't have a dedicated short description, so the title doubles as
    // the description fallback. Admin can override with custom copy.
    seoFields({ titleSource: 'title', descriptionSource: 'title' }),
  ],
}
