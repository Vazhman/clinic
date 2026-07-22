import type { GlobalConfig } from 'payload'

const DEFAULT_LLMS_TXT = `# Khozrevanidze Clinic / ხოზრევანიძის კლინიკა

> Multi-profile medical clinic in Batumi, Georgia. Founded 2015 by Giorgi Khozrevanidze. ~45 staff. Serves patients in Georgian, English, and Russian.

## Location & Contact
- Address: Giorgi Brtskinvale Street, N81, Batumi, Adjara, Georgia, 6010
- Phone: +995 422 22 71 71
- Email: info@khozrevanidze.ge
- Website: https://www.khozrevanidze.ge
- Hours: Mon–Fri 09:00–18:00; Sat–Sun 09:30–17:00

## Specialties
- Cardiology / კარდიოლოგია
- Neurology / ნევროლოგია
- Gynecology / გინეკოლოგია
- Otolaryngology (ENT) / ოტორინოლარინგოლოგია
- General Surgery / ზოგადი ქირურგია
- Endocrinology / ენდოკრინოლოგია
- Psychiatry / ფსიქიატრია
- Pediatrics / პედიატრია
- Diagnostics: MRI, CT, Ultrasound, Endoscopy, X-Ray
- And more — see /services

## Booking
- Online booking: https://www.khozrevanidze.ge/ge/chawera (Georgian) / /en/booking (English) / /ru/zapis (Russian)
- Real-time slot availability via clinic's HIS

## Languages
- Georgian (ka) — primary
- English (en)
- Russian (ru)

## Key Pages
- About: /ge/shesakheb | /en/about | /ru/o-klinike
- Services: /ge/servisebi | /en/services | /ru/uslugi
- Doctors: /ge/eqimebi | /en/doctors | /ru/vrachi
- Blog/News: /ge/siaxleebi | /en/blog | /ru/novosti
- Contact: /ge/kontaqti | /en/contact | /ru/kontakty
`

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'საიტის პარამეტრები',
  admin: {
    group: 'საიტის ელემენტები',
    description: 'SEO, robots.txt, AI საძიებო სისტემების წვდომა, llms.txt და საძიებო სისტემების ვერიფიკაცია.',
  },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'ზოგადი SEO',
          description: 'ნაგულისხმევი მეტამონაცემები — გამოიყენება როცა კონკრეტულ გვერდს საკუთარი SEO ველები არ აქვს შევსებული.',
          fields: [
            {
              name: 'defaultMetaDescription',
              label: 'ნაგულისხმევი მეტა აღწერა',
              type: 'textarea',
              localized: true,
              maxLength: 160,
              admin: { description: 'გამოიყენება, როცა კონკრეტულ გვერდს საკუთარი SEO აღწერა არ აქვს. მაქს. 160 სიმბოლო.' },
            },
            {
              name: 'defaultOgImage',
              label: 'ნაგულისხმევი სურათი (OG)',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'სოციალურ ქსელებში გაზიარებისას ნაჩვენები ნაგულისხმევი სურათი, თუ გვერდს საკუთარი არ აქვს.' },
            },
            {
              name: 'twitterHandle',
              label: 'X (Twitter) ანგარიში',
              type: 'text',
              admin: { description: 'მაგ: @khozrevanidze — არასავალდებულო.' },
            },
          ],
        },
        {
          label: 'ვერიფიკაცია',
          description: 'საძიებო სისტემების კონსოლებიდან მიღებული ვერიფიკაციის კოდები.',
          fields: [
            {
              name: 'googleSiteVerification',
              label: 'Google Search Console კოდი',
              type: 'text',
              admin: { description: 'Google Search Console-ის მიერ გაცემული ვერიფიკაციის კოდი (მხოლოდ კოდი, არა მთლიანი meta tag).' },
            },
            {
              name: 'bingSiteVerification',
              label: 'Bing Webmaster კოდი',
              type: 'text',
              admin: { description: 'Bing Webmaster Tools-ის ვერიფიკაციის კოდი.' },
            },
            {
              name: 'yandexVerification',
              label: 'Yandex Webmaster კოდი',
              type: 'text',
              admin: { description: 'Yandex Webmaster-ის ვერიფიკაციის კოდი.' },
            },
          ],
        },
        {
          label: 'Robots.txt და AI',
          description: 'აკონტროლებს robots.txt-ს — რომელ საძიებო/AI ბოტებს აქვთ საიტის წაკითხვის უფლება.',
          fields: [
            {
              name: 'aiCrawlers',
              type: 'group',
              label: 'AI ბოტების დაშვება',
              admin: {
                description: 'ჩართული ბოტები საიტს AI ასისტენტების/საძიებო სისტემების პასუხებში გამოჩენის საშუალებას აძლევენ. ყველა ნაგულისხმევად ჩართულია.',
              },
              fields: [
                { name: 'gptBot', label: 'GPTBot (OpenAI)', type: 'checkbox', defaultValue: true },
                { name: 'chatGptUser', label: 'ChatGPT-User (OpenAI)', type: 'checkbox', defaultValue: true },
                { name: 'googleExtended', label: 'Google-Extended (Gemini)', type: 'checkbox', defaultValue: true },
                { name: 'claudeBot', label: 'ClaudeBot / anthropic-ai', type: 'checkbox', defaultValue: true },
                { name: 'perplexityBot', label: 'PerplexityBot', type: 'checkbox', defaultValue: true },
                { name: 'ccBot', label: 'CCBot (Common Crawl)', type: 'checkbox', defaultValue: true },
                { name: 'applebotExtended', label: 'Applebot-Extended', type: 'checkbox', defaultValue: true },
                { name: 'bytespider', label: 'Bytespider (ByteDance)', type: 'checkbox', defaultValue: true },
              ],
            },
            {
              name: 'extraRobotsRules',
              label: 'დამატებითი წესები',
              type: 'textarea',
              admin: {
                description: 'დამატებითი robots.txt ხაზები, დაემატება ფაილის ბოლოში ზუსტად ისე, როგორც ჩაწერთ (მოწინავე გამოყენებისთვის).',
              },
            },
          ],
        },
        {
          label: 'llms.txt',
          description: 'AI ასისტენტებისთვის განკუთვნილი /llms.txt ფაილი — საიტის მოკლე აღწერა მანქანურად წასაკითხი ფორმატით.',
          fields: [
            {
              name: 'enableLlmsTxt',
              label: 'llms.txt ჩართვა',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'llmsTxtContent',
              label: 'llms.txt შემცველობა',
              type: 'code',
              defaultValue: DEFAULT_LLMS_TXT,
              admin: {
                language: 'markdown',
                condition: (data) => data?.enableLlmsTxt !== false,
                description: 'Markdown ფორმატში. ცარიელის შემთხვევაში ავტომატურად გენერირდება მოკლე ნაგულისხმევი ვერსია კლინიკის სახელით და ძირითადი გვერდების ბმულებით.',
              },
            },
          ],
        },
        {
          label: 'Pixel და Analytics',
          description: 'Facebook/Meta Pixel და Google Analytics (ან სხვა ანალიტიკის) კოდები — ჩაისმება საიტის ყველა გვერდზე.',
          fields: [
            {
              name: 'pixelEnabled',
              label: 'Pixel-ის ჩართვა საიტზე',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'ჩართვისას ქვემოთ მითითებული Pixel კოდი აისახება საიტის ყველა გვერდზე. გამორთვისას კოდი საერთოდ არ იტვირთება, თუნდაც შენახული იყოს.',
              },
            },
            {
              name: 'pixelCode',
              label: 'Pixel კოდი (Meta/Facebook Pixel)',
              type: 'code',
              admin: {
                language: 'html',
                condition: (data) => data?.pixelEnabled === true,
                description: 'ჩასვით სრული <script> კოდი Facebook/Meta Pixel-იდან (Events Manager → Set up Pixel → Install code manually).',
              },
            },
            {
              name: 'analyticsEnabled',
              label: 'Analytics-ის ჩართვა საიტზე',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'ჩართვისას ქვემოთ მითითებული Analytics კოდი აისახება საიტის ყველა გვერდზე. გამორთვისას კოდი საერთოდ არ იტვირთება, თუნდაც შენახული იყოს.',
              },
            },
            {
              name: 'analyticsCode',
              label: 'Analytics კოდი (Google Analytics / GA4 / GTM)',
              type: 'code',
              admin: {
                language: 'html',
                condition: (data) => data?.analyticsEnabled === true,
                description: 'ჩასვით სრული <script> კოდი Google Analytics-იდან (GA4) ან Google Tag Manager-იდან.',
              },
            },
          ],
        },
        {
          label: 'AI ასისტენტი',
          description:
            'AI ჩატ-ასისტენტის დამატებითი ცოდნის ბაზა და კონფიგურაცია. ასისტენტის ჩართვა/გამორთვა: "ფუნქციების ჩართვა/გამორთვა" → "AI ასისტენტი".',
          fields: [
            {
              name: 'aiKnowledgeBase',
              label: 'დამატებითი ცოდნის ბაზა',
              type: 'textarea',
              localized: true,
              admin: {
                description:
                  'თავისუფალი ტექსტი (ფაქტები, პოლიტიკები, ხშირად დასმული კითხვები და ა.შ.), რომელსაც AI ასისტენტი გამოიყენებს პასუხების დასაზუსტებლად საიტის საკუთარი კონტენტის (გვერდები, სერვისები, ექიმები, სიახლეები) გარდა. არ ცვლის ასისტენტის უსაფრთხოების წესებს — მხოლოდ დამატებითი კონტექსტია.',
              },
            },
          ],
        },
        {
          label: 'TOP.GE / სტატისტიკა',
          description: 'TOP.GE ან სხვა მსგავსი სტატისტიკის/თვალთვალის სკრიპტი — ჩაისმება საიტის ყველა გვერდზე, ფუტერში.',
          fields: [
            {
              name: 'topGeEnabled',
              label: 'სკრიპტის ჩართვა საიტზე',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'ჩართვისას ქვემოთ მითითებული სკრიპტი აისახება საიტის ყველა გვერდზე. გამორთვისას სკრიპტი საერთოდ არ იტვირთება, თუნდაც კოდი შენახული იყოს.',
              },
            },
            {
              name: 'topGeScript',
              label: 'TOP.GE / სტატისტიკის სკრიპტი',
              type: 'code',
              admin: {
                language: 'html',
                condition: (data) => data?.topGeEnabled === true,
                description: 'ჩასვით სრული <script> კოდი TOP.GE-დან ან სხვა მსგავსი სერვისიდან.',
              },
            },
          ],
        },
      ],
    },
    // ── Legacy fields (kept for Postgres column/data safety, hidden from admin) ──
    {
      name: 'stats',
      type: 'group',
      label: 'სტატისტიკა',
      // Hidden — stats now live on the HomePage global (canonical source).
      // Field definition is kept so Postgres push:true doesn't drop the
      // table containing the seeded values. getStats() in payload-data.ts
      // reads HomePage first and falls back here.
      admin: { hidden: true, description: 'Legacy. Edit stats in HomePage instead.' },
      fields: [
        { name: 'patients', type: 'number', required: true, defaultValue: 15000, admin: { description: 'პაციენტების რაოდენობა (მაგ: 15000)' } },
        { name: 'doctors', type: 'number', required: true, defaultValue: 54, admin: { description: 'ექიმების რაოდენობა (მაგ: 54)' } },
        { name: 'operations', type: 'number', required: true, defaultValue: 5000, admin: { description: 'ოპერაციების რაოდენობა (მაგ: 5000)' } },
        { name: 'experience', type: 'number', required: true, defaultValue: 9, admin: { description: 'წლების გამოცდილება (მაგ: 9)' } },
      ],
    },
    // The `contact` group used to live here but duplicated ContactPage and
    // was never wired to the frontend. Removed to avoid editor confusion —
    // address/phone/email/hours are now edited via "გვერდები → საკონტაქტო გვერდი".
    // The underlying Postgres columns stay (push:false on Vercel); they're
    // simply no longer exposed in the admin schema.
    {
      name: 'lastDoctraSync',
      type: 'date',
      admin: {
        hidden: true,
        readOnly: true,
        description: 'ბოლო Doctra სინქრონიზაციის დრო — ავტომატურად განახლდება იმპორტის შემდეგ',
      },
    },
  ],
}
