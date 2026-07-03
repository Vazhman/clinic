import type { CollectionConfig } from 'payload'
import { seoFields } from '../fields/seo'
import { localeHint } from '../fields/locale-hint'
import { slugField } from '../fields/slug'

// Lab Tests is a content library, NOT a bookable catalog. The point is SEO:
// give every test the clinic performs its own URL with editorial-quality
// content so patient queries ("რა არის სისხლის ანალიზი", "blood test for
// thyroid", etc.) land on khozrevanidze.ge instead of a competitor.
//
// The rich-text sections mirror Mayo Clinic's tests-procedures layout —
// each section answers a discrete patient question, which is exactly what
// AI Overviews / Featured Snippets surface. Don't merge them into one big
// body field; the section structure is itself an SEO feature.
//
// Cross-link relationships (relatedServices / relatedDoctors / relatedTests)
// are what turn this from "30 orphan articles" into a topical hub — the
// frontend Service/Doctor/Checkup pages query in the OTHER direction so a
// test added by the editor is automatically linked from its specialty page
// without anyone touching nav config.
//
// ADMIN UX: every field carries a Georgian `label` and the editor is split
// into tabs (ძირითადი / შინაარსი / კავშირები / SEO) — same convention as
// Doctors.ts. Tabs here are UNNAMED (presentational only), and `label`s are
// pure UI, so neither touches field names or DB columns: no migration needed.
export const LabTests: CollectionConfig = {
  slug: 'lab-tests',
  labels: { singular: 'ანალიზი', plural: 'ანალიზები' },
  admin: {
    useAsTitle: 'title',
    description: 'ლაბორატორიული ანალიზების ბიბლიოთეკა — Mayo Clinic-ის სტილით. ყოველი ანალიზი = ერთი გვერდი (/lab-tests/<slug>). SEO-ისთვის: ჩაწერეთ აღწერა, მომზადება, შედეგების ინტერპრეტაცია სამივე ენაზე.',
    defaultColumns: ['title', 'slug', 'category', 'published', 'updatedAt'],
    group: 'კონტენტი',
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    localeHint,

    // ── Sidebar: classification, review trail & publishing ─────────────────
    slugField('lab-tests', 'title'),
    {
      name: 'category',
      label: 'კატეგორია',
      type: 'select',
      required: true,
      defaultValue: 'biochemistry',
      admin: { position: 'sidebar', description: 'ანალიზის ჯგუფი — ფილტრისთვის /lab-tests-ის სიის გვერდზე.' },
      options: [
        { label: 'ჰემატოლოგია (Hematology)', value: 'hematology' },
        { label: 'ბიოქიმია (Biochemistry)', value: 'biochemistry' },
        { label: 'ჰორმონები (Hormones)', value: 'hormones' },
        { label: 'ინფექციები (Infections)', value: 'infections' },
        { label: 'იმუნოლოგია (Immunology)', value: 'immunology' },
        { label: 'გენეტიკა (Genetics)', value: 'genetics' },
        { label: 'პრენატალური (Prenatal)', value: 'prenatal' },
        { label: 'შარდის ანალიზი (Urinalysis)', value: 'urinalysis' },
        { label: 'კარდიოლოგია (Cardiology markers)', value: 'cardiology' },
        { label: 'ონკომარკერები (Oncology markers)', value: 'oncology' },
        { label: 'სხვა (Other)', value: 'other' },
      ],
    },
    {
      name: 'reviewedBy',
      label: 'გადახედა ექიმმა',
      type: 'relationship',
      relationTo: 'doctors',
      admin: {
        position: 'sidebar',
        description: 'ექიმი, რომელმაც გადახედა ამ ანალიზის აღწერა. ⚠️ სამედიცინო (YMYL) შინაარსი გამოქვეყნებამდე უნდა გადახედოს ექიმმა. Google-ის YMYL შინაარსისთვის ვაჩვენებთ "გადახედილია Dr. X-ის მიერ" გვერდზე + structured data-ში.',
      },
    },
    {
      name: 'lastReviewed',
      label: 'ბოლო გადახედვის თარიღი',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'ბოლო გადახედვის თარიღი. განაახლეთ ყოველ ჯერზე, როცა ექიმი ხელახლა გადახედავს ტექსტს. ჩანს გვერდზე ("ბოლო განახლება: ...") — სანდოობის სიგნალი (YMYL).',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },
    {
      name: 'published',
      label: 'გამოქვეყნებული',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'მონიშნულია — ჩანს საიტზე. ⚠️ სამედიცინო (YMYL) შინაარსი ჯერ ექიმმა უნდა გადახედოს — გამოაქვეყნეთ მხოლოდ ექიმის გადახედვის შემდეგ. ახალი ანალიზი იწყება მონიშნულის გარეშე, შევსებისა და გადახედვის შემდეგ ჩართეთ.',
      },
    },

    // ── Main column: tabs ──────────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'ძირითადი',
          description: 'ანალიზის სახელი, სინონიმები და მოკლე აღწერა — ჩანს სიის ბარათზე და ძიებაში.',
          fields: [
            {
              name: 'title',
              label: 'ანალიზის სახელი',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'ანალიზის სრული სახელი (მაგ: სისხლის საერთო ანალიზი / Complete Blood Count). გვერდის H1 + SEO meta title-ის საფუძველი.' },
            },
            {
              name: 'aliases',
              label: 'ალტერნატიული სახელები',
              type: 'array',
              localized: true,
              labels: { singular: 'სინონიმი', plural: 'სინონიმები' },
              admin: {
                description: 'ალტერნატიული სახელები — სინონიმები (მაგ: "CBC", "ჰემოგრამა"). რაც მეტ სინონიმს დაამატებთ, მით უკეთ მოიძებნება ეს ანალიზი საიტის ძიებაში და Google-ში (Google ხედავს, რომ ეს გვერდი მოიცავს რამდენიმე საძიებო ფრაზას).',
              },
              fields: [{ name: 'alias', label: 'სახელი', type: 'text' }],
            },
            {
              name: 'summary',
              label: 'მოკლე აღწერა',
              type: 'textarea',
              required: true,
              localized: true,
              admin: {
                description: '1–2 წინადადება. ჩანს: (1) სიის ბარათზე /lab-tests-ზე, (2) SEO meta description-ად. დაიწერეთ პაციენტისთვის გასაგებად.',
              },
            },
          ],
        },
        {
          label: 'შინაარსი',
          description: 'Mayo Clinic-ის სტილის სექციები — თითო პასუხობს პაციენტის კონკრეტულ კითხვას. შეავსეთ სამივე ენაზე.',
          fields: [
            {
              name: 'overview',
              label: 'ზოგადი მიმოხილვა',
              type: 'richText',
              localized: true,
              admin: { description: 'ზოგადი მიმოხილვა: რა არის ეს ანალიზი და რას ზომავს.' },
            },
            {
              name: 'whyDone',
              label: 'რატომ ინიშნება',
              type: 'richText',
              localized: true,
              admin: { description: 'რატომ ინიშნება: კლინიკური ჩვენებები, რომელ შემთხვევებში ენიშნება პაციენტს.' },
            },
            {
              name: 'preparation',
              label: 'მომზადება',
              type: 'richText',
              localized: true,
              admin: { description: 'როგორ მოვემზადოთ: შიმშილით აღება, წყლის მიღება, მედიკამენტების შეჩერება, დროის ფანჯარა.' },
            },
            {
              name: 'whatToExpect',
              label: 'რას ველოდეთ',
              type: 'richText',
              localized: true,
              admin: { description: 'როგორ ტარდება: სისხლის აღების პროცესი, ხანგრძლივობა, შეგრძნებები, შესაძლო რისკები.' },
            },
            {
              name: 'interpretation',
              label: 'ინტერპრეტაცია',
              type: 'richText',
              localized: true,
              admin: { description: 'შედეგების ინტერპრეტაცია: ნორმის ფარგლები, რას ნიშნავს გადახრები, რა შემდეგი ნაბიჯი ხდება.' },
            },
          ],
        },
        {
          label: 'კავშირები',
          description: 'ჯვარედინი ბმულები — ამ ანალიზს ავტომატურად აკავშირებს სერვისების, ექიმებისა და სხვა ანალიზების გვერდებთან.',
          fields: [
            {
              name: 'relatedServices',
              label: 'სერვისები',
              type: 'relationship',
              relationTo: 'services',
              hasMany: true,
              admin: { description: 'რომელ კლინიკურ მიმართულებას უკავშირდება ეს ანალიზი. გვერდი ავტომატურად მიებმება ამ სერვისების გვერდებიდან.' },
            },
            {
              name: 'relatedDoctors',
              label: 'ექიმები',
              type: 'relationship',
              relationTo: 'doctors',
              hasMany: true,
              admin: { description: 'ექიმები, რომლებიც ხშირად ნიშნავენ ამ ანალიზს. გვერდი ავტომატურად მიებმება ამ ექიმების პროფილებიდან.' },
            },
            {
              name: 'relatedTests',
              label: 'ანალიზები',
              type: 'relationship',
              relationTo: 'lab-tests',
              hasMany: true,
              admin: { description: 'მონათესავე ანალიზები — გვერდის ბოლოს ნაჩვენები "ასევე ნახე" ბლოკში.' },
            },
          ],
        },
        {
          label: 'SEO',
          description: 'საძიებო სისტემებისთვის (Google) — სურვილისამებრ. ცარიელი ველები ავტომატურად ივსება.',
          fields: [
            seoFields({ titleSource: 'title', descriptionSource: 'summary' }),
          ],
        },
      ],
    },
  ],
}
