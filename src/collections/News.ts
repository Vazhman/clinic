import type { CollectionConfig } from 'payload'
import { seoFields } from '../fields/seo'
import { localeHint } from '../fields/locale-hint'
import { slugField } from '../fields/slug'
import { syncPublishStatus } from './hooks/syncPublishStatus'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'სიახლე', plural: 'სიახლეები' },
  admin: {
    useAsTitle: 'title',
    description: 'სიახლეების და სტატიების მართვა. აქ შეგიძლიათ შექმნათ ბლოგ პოსტები.',
    defaultColumns: ['title', 'categoryRef', 'status', 'showOnHomepage', 'publishedDate'],
    group: 'კონტენტი',
  },
  // Anonymous REST reads only see published docs (the public REST API honours
  // ?draft=true unless access restricts it — unrestricted, unpublished drafts
  // would leak). Admins see everything; server-side getters use the local API
  // with overrideAccess, so the site's own queries are unaffected.
  access: { read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }) },
  versions: { drafts: true },
  // Keeps the custom `status` field (used by frontend queries) in sync with
  // Payload's native publish/draft state — see syncPublishStatus.ts for why
  // this exists (the "can't publish" bug reported in the CMS brief).
  hooks: { beforeChange: [syncPublishStatus] },
  fields: [
    // All fields live in tabs at the top of the main column — no sidebar.
    // Tab order matches the editor's workflow:
    //   1. კონტენტი  — write the article (default)
    //   2. პარამეტრები — set slug/category/date/status/homepage before publishing
    //   3. SEO       — fine-tune the Google preview (mostly auto-filled)
    localeHint,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'კონტენტი',
          description: 'სტატიის სათაური, სურათი და ძირითადი ტექსტი.',
          fields: [
            // Title renders as a headline (editorial-calm CSS in custom.scss
            // targets `.field-news-title`): bigger type, no resting border,
            // focus-ring on entry.
            {
              name: 'title',
              label: 'სათაური',
              type: 'text',
              required: true,
              localized: true,
              admin: { className: 'field-news-title' },
            },
            // Featured image stays in the main column so the upload field gets
            // its full-width UI with an obvious "Choose from existing" button
            // alongside "Upload new".
            {
              name: 'featuredImage',
              label: 'მთავარი სურათი',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'gallery',
              label: 'გალერეა',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'დამატებითი სურათები სტატიისთვის (არჩევითი) — ჩანს სტატიის ბოლოს, თუ დამატებულია.' },
            },
            // Body is the writing surface — no collapsible wrapper, no inner
            // card. The Lexical editor sits flush on the form background
            // (chrome stripped by custom.scss `.field-news-body`) so it feels
            // like a document, not a form field.
            {
              name: 'body',
              type: 'richText',
              localized: true,
              label: false,
              admin: {
                className: 'field-news-body',
                description: 'სლეში (/) ან „+" გახსნის მენიუს: სურათი, შენიშვნა, გალერეა.',
              },
            },
            // Builder retired — editors now write articles in the Lexical
            // field above. Kept hidden (not removed) so already-published
            // articles built with it keep rendering via the frontend's
            // puckData-first fallback in blog/[slug]/page.tsx.
            {
              name: 'puckData',
              type: 'json',
              label: false,
              admin: { hidden: true },
            },
          ],
        },
        {
          label: 'პარამეტრები',
          description: 'სტატიის URL, კატეგორია, თარიღი, გამოქვეყნების სტატუსი და მთავარ გვერდზე ჩვენების პარამეტრები.',
          fields: [
            // Two-column row: slug + category. Both are short identifier
            // fields and read better side-by-side than stacked.
            {
              type: 'row',
              fields: [
                // Auto-slug, but rendered in the main column (not sidebar)
                // to keep the two-column row layout of this tab.
                slugField('news', 'title', { sidebar: false, description: 'ცარიელი დატოვებისას ავტომატურად შეიქმნება სათაურიდან. ხელით ჩაწერაც შეიძლება (მაგ: my-article).' }),
                {
                  name: 'categoryRef',
                  label: 'კატეგორია',
                  type: 'relationship',
                  relationTo: 'news-categories',
                  required: true,
                  admin: {
                    description: 'კატეგორიების დამატება/რედაქტირება/წაშლა — "სიახლის კატეგორიები" სექციაში.',
                  },
                },
              ],
            },
            // Legacy fixed-4-option select (health-tips/clinic-news/medical-info/
            // announcements), superseded by `categoryRef` above (a real,
            // admin-manageable collection). Kept hidden + non-required, same as
            // Navigation.mainMenu / HomePage.heroDoctors, so the column and its
            // existing data survive untouched instead of forcing a destructive
            // schema change.
            {
              name: 'category',
              label: 'კატეგორია (ძველი)',
              type: 'select',
              admin: { hidden: true },
              options: [
                { label: 'ჯანმრთელობის რჩევები', value: 'health-tips' },
                { label: 'კლინიკის სიახლეები', value: 'clinic-news' },
                { label: 'სამედიცინო ინფორმაცია', value: 'medical-info' },
                { label: 'განცხადებები', value: 'announcements' },
              ],
            },
            {
              name: 'excerpt',
              label: 'მოკლე აღწერა',
              type: 'textarea',
              required: true,
              localized: true,
              maxLength: 300,
              admin: { description: 'მოკლე აღწერა — გამოჩნდება ბარათზე და SEO meta-description-ში (Google). მაქსიმუმ 300 სიმბოლო; დაიწერეთ მოკლედ და ნათლად, რადგან Google ამას აჩვენებს ძიების შედეგებში.' },
            },
            // Two-column row: author + published date. Same rationale as slug+category.
            {
              type: 'row',
              fields: [
                {
                  name: 'author',
                  label: 'ავტორი',
                  type: 'text',
                  localized: true,
                  admin: { description: 'ავტორის სახელი (არასავალდებულო)' },
                },
                {
                  name: 'publishedDate',
                  label: 'გამოქვეყნების თარიღი და დრო',
                  type: 'date',
                  required: true,
                  defaultValue: () => new Date().toISOString(),
                  admin: {
                    description: 'დროის არჩევა: თუ ახლავე უნდა გამოქვეყნდეს, დატოვე ავტომატურად შევსებული ახლანდელი დრო.',
                    date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
                  },
                },
              ],
            },
            {
              name: 'status',
              label: 'სტატუსი',
              type: 'select',
              required: true,
              defaultValue: 'draft',
              options: [
                { label: 'დრაფტი', value: 'draft' },
                { label: 'გამოქვეყნებული', value: 'published' },
              ],
              admin: {
                description: 'ავტომატურად სინქრონდება ზედა "Publish changes" / "Save Draft" ღილაკებთან — ხელით შეცვლა საჭირო აღარ არის.',
                readOnly: true,
              },
            },
            {
              name: 'tags',
              label: 'ტეგები',
              type: 'text',
              hasMany: true,
              localized: true,
              admin: { description: 'საკვანძო სიტყვები/ტეგები სტატიისთვის (თითოეული ველის შევსების შემდეგ დააჭირეთ Enter-ს ახლის დასამატებლად).' },
            },
            {
              name: 'featured',
              label: 'გამორჩეული სტატია',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'გამორჩეული სტატიები შეიძლება ცალკე გამოიყოს ბლოგის გვერდზე (მაგ. "რჩეული" ბლოკი) — განსხვავებულია "დამაგრებული"-საგან (რომელიც სორტირებას განსაზღვრავს) და "მთავარ გვერდზე გამოჩენა"-საგან (რომელიც საწყის გვერდზე აჩვენებს).',
              },
            },
            {
              name: 'pinned',
              label: 'დამაგრებული ბლოგზე',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'მონიშვნისას სტატია ბლოგის გვერდის თავში გამოჩნდება (თარიღის მიუხედავად).' },
            },
            {
              name: 'showOnHomepage',
              label: 'მთავარ გვერდზე გამოჩენა',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'მთავარ გვერდზე გამოჩენა' },
            },
            {
              name: 'homepageOrder',
              label: 'რიგი მთავარ გვერდზე',
              type: 'number',
              min: 0,
              defaultValue: 0,
              admin: {
                description: 'ჩვენების თანმიმდევრობა მთავარ გვერდზე (ნაკლები = პირველი)',
                condition: (data) => data?.showOnHomepage === true,
              },
            },
          ],
        },
        {
          label: 'SEO / ძიება',
          description: 'საძიებო სისტემების ოპტიმიზაცია — Google-ში როგორ გამოჩნდება სტატია.',
          fields: [
            seoFields({ titleSource: 'title', descriptionSource: 'excerpt', imageSource: 'featuredImage' }),
          ],
        },
      ],
    },
  ],
}
