import type { CollectionConfig } from 'payload'
import { seoFields } from '../fields/seo'
import { localeHint } from '../fields/locale-hint'
import { slugField } from '../fields/slug'

export const Doctors: CollectionConfig = {
  slug: 'doctors',
  labels: { singular: 'ექიმი', plural: 'ექიმები' },
  // Matches the public /doctors page order (payload-data.ts _getDoctors)
  // and the reorder panel's own sort, so the admin list reflects drag order.
  defaultSort: ['displayOrder', 'slug'],
  admin: {
    useAsTitle: 'name',
    description: 'ექიმების პროფილების მართვა. ფოტო, ბიოგრაფია, სპეციალიზაცია.',
    defaultColumns: ['name', 'specialty', 'isDepartmentHead', 'showOnDoctorsPage', 'inactive', 'viewLive'],
    group: 'კონტენტი',
    pagination: { defaultLimit: 10 },
    components: {
      beforeListTable: ['/components/admin/DoctorListFilters', '/components/admin/DoctorReorderPanel'],
      edit: {
        beforeDocumentControls: ['/components/admin/DoctorViewLiveButton'],
      },
    },
  },
  access: {
    read: () => true,
    // Doctors are owned by Doctra (the HIS): new doctors normally arrive only
    // via the Doctra sync (`/api/import-doctra`), which runs through the
    // Local API (`payload.create`) and bypasses access control regardless of
    // `create` here. Admin bulk-delete is intentionally allowed (2026-07-22)
    // so the roster can be wiped and rebuilt from a Doctra re-sync — anything
    // without a `doctraId` will NOT come back and is lost for good.
    create: () => false,
  },
  fields: [
    // ── List-only virtual field: "view live" external-link icon ─────────
    // UI fields don't store data — this only renders as a list-view cell via
    // the Cell component below. Disabled in edit form (no Field component).
    {
      name: 'viewLive',
      type: 'ui',
      label: ' ',
      admin: {
        components: {
          Cell: '/components/admin/DoctorRowActions',
        },
      },
    },
    localeHint,
    // ── Sidebar fields (Payload places these in the right sidebar) ────────
    slugField('doctors', 'name'),
    {
      name: 'doctraId',
      label: 'Doctra ექიმის ID',
      type: 'text',
      unique: true,
      admin: { position: 'sidebar', description: 'Doctra API ექიმის ID — დაკავშირებულია ჩაწერის სისტემასთან. UUID ფორმატი, მაგ: 123e4567-e89b-12d3-a456-426614174000.' },
      validate: (value: string | string[] | null | undefined) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true
        const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        if (typeof value === 'string' && uuid.test(value.trim())) return true
        return 'არასწორი ფორმატი — Doctra ექიმის ID უნდა იყოს UUID, მაგ: 123e4567-e89b-12d3-a456-426614174000.'
      },
    },
    {
      name: 'doctraBranchId',
      label: 'Doctra განყოფილების ID',
      type: 'text',
      admin: { position: 'sidebar', description: 'Doctra განყოფილების ID — პროფილზე ხელმისაწვდომი დროების საჩვენებლად. UUID ფორმატი, მაგ: 123e4567-e89b-12d3-a456-426614174000.' },
      validate: (value: string | string[] | null | undefined) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true
        const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        if (typeof value === 'string' && uuid.test(value.trim())) return true
        return 'არასწორი ფორმატი — Doctra განყოფილების ID უნდა იყოს UUID, მაგ: 123e4567-e89b-12d3-a456-426614174000.'
      },
    },
    { name: 'inactive', label: 'არააქტიური', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'მონიშვნისას ექიმი დამალულია საიტზე და ჩაწერის ფორმაში (ჩანაწერი არ წაიშლება)' } },
    {
      name: 'bookingEnabled',
      label: 'ჩაწერა ჩართულია',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'მონიშვნისას — ექიმის გვერდზე გამოჩნდება "ჯავშანი" ღილაკი და კალენდარი. გათიშე იმ ექიმებისთვის, ვისაც Doctra-ში დროები არ აქვს ან რომელიც დროებით არ იღებს პაციენტს. გვერდი მაინც ხილვადია — მხოლოდ ჯავშნის ღილაკი იმალება.',
      },
    },
    {
      name: 'showOnDoctorsPage',
      label: 'ჩვენება ექიმების გვერდზე',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        // List column renders an interactive toggle (DoctorVisibilityToggle) so
        // editors can show/hide a doctor straight from the list — used to
        // publish newly-synced doctors, which arrive hidden (see
        // /api/import-doctra). The sidebar checkbox here is the edit-view control.
        components: { Cell: '/components/admin/DoctorVisibilityToggle' },
        description: 'ჩართულია — ექიმი ჩანს „ექიმები" გვერდის სიაში. გამორთვისას — ექიმი იმალება ამ სიიდან, მაგრამ მისი პროფილი მაინც ხელმისაწვდომია პირდაპირი ბმულით და ჩაწერის სისტემაში (Booking) კვლავ ჩანს, თუ ჩაწერა ჩართულია. ⚠️ Doctra-დან ახლად სინქრონიზებული ექიმები იწყებენ დამალულად — გადართეთ სიის ფერადი ღილაკით რომ გამოჩნდნენ. (მთავარი გვერდის „ჩვენი ექიმები" სექცია ცალკე იმართება — „მთავარი გვერდის ექიმების სია" ველით.)',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      label: 'ბოლო განახლება',
      admin: {
        position: 'sidebar',
        description: 'ექიმის ინფორმაციის ბოლო განახლების თარიღი — გამოჩნდება პროფილის გვერდზე',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
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
        description: 'განსაზღვრავს თანმიმდევრობას "ექიმები" გვერდზე — გამოიყენეთ სიის თავზე "რიგის დალაგება" ღილაკი (ჩავლება/dragdrop), ხელით შეცვლა არ არის საჭირო.',
      },
    },

    // ── Main column: tabs ─────────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'იდენტობა',
          description: 'სახელი და ფოტო — პირველი რაც პაციენტი ხედავს',
          fields: [
            { name: 'name', label: 'სახელი', type: 'text', required: true, localized: true },
            {
              name: 'photo',
              label: 'ფოტო',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'რეკომენდებული ზომა: 1200×1500px (პორტრეტული 4:5 პროპორცია). ' +
                  'სურათი ავსებს ჩარჩოს მთლიანად — თუ პროპორცია 4:5-ისგან განსხვავდება, გვერდები ან ზედა/ქვედა ნაწილი შეიძლება მოიჭრას (განსაკუთრებით მაღალ/განიერ ფოტოებზე), ამიტომ სასურველია თავიდანვე 4:5 პროპორციის ფოტოს ატვირთვა.',
              },
            },
          ],
        },
        {
          label: 'პროფილი',
          description: 'სპეციალიზაცია, ბიოგრაფია, კვალიფიკაცია',
          fields: [
            { name: 'specialty', label: 'სპეციალობა', type: 'text', required: true, localized: true },
            // access.read: personal contact details imported from the HIS must
            // not be exposed through the public REST API (/api/doctors) — only
            // authenticated admins see them. The public site never renders
            // these (mapDoctorDoc omits them), and server-side getters use the
            // local API with overrideAccess, so nothing on the site changes.
            { name: 'phone', label: 'ტელეფონი', type: 'text', access: { read: ({ req }) => Boolean(req.user) }, admin: { description: 'ექიმის ტელეფონი (Doctra-დან). რედაქცია სავალდებულო არ არის — საიტზე ჩვენების გადაწყვეტილება ცალკეა.' } },
            { name: 'email', label: 'ელფოსტა', type: 'email', access: { read: ({ req }) => Boolean(req.user) }, admin: { description: 'ექიმის ელფოსტა (Doctra-დან). იხილე phone-ის შენიშვნა.' } },
            { name: 'biography', label: 'ბიოგრაფია', type: 'richText', localized: true, admin: { description: 'ექიმის ბიოგრაფია და გამოცდილება' } },
            {
              name: 'qualifications',
              label: 'კვალიფიკაცია',
              type: 'array',
              admin: { description: 'აკადემიური ხარისხები და სერტიფიკატები' },
              // Same reasoning as specializations — required:true blocked
              // PATCH updates when a qualifications row exists in only one
              // locale. Public site already filters empties.
              fields: [{ name: 'qualification', label: 'კვალიფიკაცია', type: 'text', localized: true }],
            },
            {
              name: 'specializations',
              label: 'სპეციალიზაციები',
              type: 'array',
              admin: { description: 'სამედიცინო სპეციალიზაციები' },
              // `required: true` removed — array rows can exist with text
              // missing in one locale (common after partial translation),
              // and the public site already filters out empty values in
              // payload-data.ts. Keeping `required` made PATCH updates
              // (e.g. uploading a photo) fail full-doc validation.
              fields: [{ name: 'specialization', label: 'სპეციალიზაცია', type: 'text', localized: true }],
            },
            { name: 'experienceYears', label: 'გამოცდილება (წლები)', type: 'number', min: 0, defaultValue: 0, admin: { description: 'სამუშაო გამოცდილება წლებში' } },
            {
              name: 'languagesSpoken',
              label: 'ცოდნა ენებში',
              type: 'array',
              fields: [{
                name: 'language',
                label: 'ენა',
                type: 'select',
                required: true,
                options: [
                  { label: 'ქართული 🇬🇪 / Georgian', value: 'ka' },
                  { label: 'English 🇬🇧', value: 'en' },
                  { label: 'Русский 🇷🇺 / Russian', value: 'ru' },
                  { label: 'Türkçe 🇹🇷 / Turkish', value: 'tr' },
                  { label: 'Deutsch 🇩🇪 / German', value: 'de' },
                  { label: 'Français 🇫🇷 / French', value: 'fr' },
                  { label: 'Español 🇪🇸 / Spanish', value: 'es' },
                  { label: 'Italiano 🇮🇹 / Italian', value: 'it' },
                  { label: 'עברית 🇮🇱 / Hebrew', value: 'he' },
                  { label: 'العربية 🇸🇦 / Arabic', value: 'ar' },
                  { label: 'Azərbaycanca 🇦🇿 / Azerbaijani', value: 'az' },
                  { label: 'Հայերեն 🇦🇲 / Armenian', value: 'hy' },
                  { label: 'Українська 🇺🇦 / Ukrainian', value: 'uk' },
                  { label: 'فارسی 🇮🇷 / Persian', value: 'fa' },
                  { label: '中文 🇨🇳 / Chinese', value: 'zh' },
                ],
              }],
            },
            { name: 'isDepartmentHead', type: 'checkbox', defaultValue: false, label: 'განყოფილების ხელმძღვანელი', admin: { description: 'მონიშნულია — ეს ექიმი მონიშნულია განყოფილების ხელმძღვანელად: გამოჩნდება სიის თავში (წინ სხვებზე) და პროფილზე მიენიჭება სპეციალური ნიშანი (badge).' } },
          ],
        },
        {
          label: 'SEO',
          description: 'საძიებო სისტემებისთვის (Google) — სურვილისამებრ',
          fields: [
            seoFields({
              titleSource: 'name',
              titleSecondarySource: 'specialty',
              // Doctors don't have a single short description; biography is rich
              // text and would need extracting. Use specialty as a safe textarea
              // placeholder — admins almost always want a custom description.
              descriptionSource: 'specialty',
              imageSource: 'photo',
            }),
          ],
        },
      ],
    },
  ],
}
