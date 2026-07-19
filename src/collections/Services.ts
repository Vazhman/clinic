import type { CollectionConfig } from 'payload'
import { seoFields } from '../fields/seo'
import { localeHint } from '../fields/locale-hint'
import { slugField } from '../fields/slug'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'სერვისი', plural: 'სერვისები' },
  admin: {
    useAsTitle: 'name',
    description: 'კლინიკის სერვისების და განყოფილებების მართვა.',
    defaultColumns: ['name', 'slug', 'icon', 'featured', 'pinned'],
    group: 'კონტენტი',
    components: {
      beforeListTable: ['/components/admin/ServiceReorderPanel'],
    },
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [
      // Enforces "only one featured service at a time" — marking a service
      // featured automatically un-marks whichever one held it before, so
      // editors never end up with two purple/featured cards on /services.
      async ({ data, req, originalDoc }) => {
        if ((data as { featured?: boolean | null } | undefined)?.featured !== true) return data
        await req.payload.update({
          collection: 'services',
          where: originalDoc?.id
            ? { and: [{ featured: { equals: true } }, { id: { not_equals: originalDoc.id } }] }
            : { featured: { equals: true } },
          data: { featured: false },
          req,
          overrideAccess: true,
        })
        return data
      },
    ],
  },
  fields: [
    localeHint,
    { name: 'name', label: 'სახელი', type: 'text', required: true, localized: true },
    slugField('services', 'name'),
    {
      name: 'featured',
      label: 'გამორჩეული',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'მონიშვნისას ეს სერვისი გამოჩნდება პირველ ადგილას, დიდ გამორჩეულ (purple) ბარათად "სერვისების" გვერდზე (/services). ერთდროულად მხოლოდ ერთი სერვისი შეიძლება იყოს გამორჩეული — სხვის მონიშვნისას წინა ავტომატურად მოიხსნება.',
      },
    },
    {
      name: 'pinned',
      label: 'დამაგრებული',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'მონიშვნისას სერვისი გამოჩნდება სიის და მთავარი გვერდის თავში (სხვა სერვისებზე წინ).',
      },
    },
    {
      name: 'pinnedOrder',
      label: 'დამაგრების რიგი',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'დამაგრებულ სერვისებს შორის რიგი (ნაკლები = პირველი).',
        condition: (data) => data?.pinned === true,
      },
    },
    {
      name: 'displayOrder',
      label: 'რიგითობა',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        hidden: true,
        description: 'განსაზღვრავს თანმიმდევრობას დაუმაგრებელ სერვისებს შორის — გამოიყენეთ სიის თავზე "რიგის დალაგება" ღილაკი (ჩავლება/dragdrop). დამაგრებული სერვისები ყოველთვის იქნებიან თავში, "დამაგრების რიგის" მიხედვით.',
      },
    },
    {
      name: 'doctraBranchId',
      label: 'Doctra განყოფილების ID',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Doctra განყოფილების ID — დააკოპირეთ Doctra-ს ადმინიდან. საჭიროა ჩაწერისთვის (booking). UUID ფორმატი, მაგ: 123e4567-e89b-12d3-a456-426614174000. თუ Doctra-ს არ იყენებთ — დატოვეთ ცარიელი.',
      },
      validate: (value: string | string[] | null | undefined) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true
        const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        if (typeof value === 'string' && uuid.test(value.trim())) return true
        return 'არასწორი ფორმატი — Doctra განყოფილების ID უნდა იყოს UUID, მაგ: 123e4567-e89b-12d3-a456-426614174000. დატოვეთ ცარიელი, თუ Doctra-ს არ იყენებთ.'
      },
    },
    {
      name: 'category',
      label: 'კატეგორია',
      type: 'select',
      admin: { position: 'sidebar', description: 'ჩაწერის გვერდზე კატეგორიის ფილტრი' },
      options: [
        { label: 'კარდიოლოგია', value: 'cardiology' },
        { label: 'ნევროლოგია', value: 'neurology' },
        { label: 'ქირურგია', value: 'surgery' },
        { label: 'პედიატრია', value: 'pediatric' },
        { label: 'დიაგნოსტიკა', value: 'diagnostics' },
        { label: 'სხვა', value: 'other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'shortDescription',
      label: 'მოკლე აღწერა',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: '1 წინადადება (მოკლე ფრაზა). ჩანს 3 ადგილზე: (1) სერვისების სიის ბარათზე /services-ზე, (2) მთავარი გვერდის სერვისების ბადეზე, (3) სერვისის გვერდის ჰერო-სათაურის ქვეშ /services/<slug>. ასევე SEO meta description-ად Google-ისთვის.',
      },
    },
    {
      // Was `textarea` — upgraded to the project-wide Lexical editor
      // (inherited from payload.config.ts, same toolbar as Doctors/Pages/News)
      // for full rich-text parity per the CMS brief. NOTE: existing rows
      // written while this was a textarea store a plain string in this
      // column; ServiceDescription.tsx defensively falls back to plain-text
      // rendering for those until re-saved through the new richText field
      // (or a one-time migration wraps the legacy string in a minimal
      // Lexical paragraph — see migration note in Services.ts history).
      name: 'description',
      label: 'სრული აღწერა',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'სრული აღწერა — რამდენიმე წინადადება ან აბზაცი. ჩანს მხოლოდ ერთ ადგილზე: სერვისის გვერდის სხეულში /services/<slug>, ჰერო-სათაურის ქვემოთ. სიის ბარათებზე და მთავარ გვერდზე არ ჩანს.',
      },
    },
    {
      name: 'icon',
      label: 'ხატულა',
      type: 'select',
      required: true,
      // Data shape stays as a plain string select so the frontend's
      // ServiceIcon.tsx keeps working unchanged. The custom Field component
      // below renders a visual grid of icon previews so the editor can pick
      // by appearance instead of guessing from a text label.
      options: [
        { label: 'გული', value: 'heart' },
        { label: 'ტვინი', value: 'brain' },
        { label: 'ბავშვი', value: 'baby' },
        { label: 'ნერვული სისტემა', value: 'brain-circuit' },
        { label: 'ლაბორატორია', value: 'flask' },
        { label: 'ყური', value: 'ear' },
        { label: 'მაკრატელი', value: 'scissors' },
        { label: 'პულსი', value: 'activity' },
      ],
      admin: {
        components: {
          Field: '/components/admin/IconPicker',
        },
      },
    },
    { name: 'image', label: 'სურათი', type: 'upload', relationTo: 'media' },
    seoFields({ titleSource: 'name', descriptionSource: 'shortDescription', imageSource: 'image' }),
  ],
}
