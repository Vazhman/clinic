import type { GlobalConfig, Field } from 'payload'

// Navigation is now strictly single-purpose: it controls the EIGHT built-in
// top-level routes (home/about/services/doctors/checkups/health-library/blog/
// contact) plus the right-side CTA button. New menu entries pointing at
// custom Pages do NOT live here — admin toggles "Show in navigation" on the
// Page itself and it auto-appends to the menu (see getNavigation in
// src/lib/payload-data.ts).
//
// Lab Tests is deliberately NOT a fixed route: the navbar is already tight
// at this width, and lab-tests is reached via cross-links from Health Library,
// Services pages, the footer, and inline blog/page links. The /lab-tests
// route itself still exists and is in the sitemap.
//
// Each of the 8 routes is a fixed group with these fields:
//   - enabled     : on/off in the header
//   - label       : per-locale override; empty falls back to the next-intl
//                   translation key (`Navigation.<key>` in src/messages/{ge,en,ru}.json)
//   - order       : sort order (lower = leftmost)
//   - hasDropdown : enable a hover dropdown sub-menu under this link
//   - subLinks    : the dropdown entries (shown only when hasDropdown is on)
//
// Adding/removing standard routes requires a code change — there's no array
// for the admin to grow. This is intentional: the public site has hardcoded
// route files for each of these, so a "new menu entry" without a matching
// route would just 404. The dropdown sub-links, by contrast, are free-form —
// they can point anywhere (a service page, an external URL, …) because they're
// plain hrefs the editor types, not routes the framework has to own.
function routeGroup(name: string, label: string, defaultOrder: number): Field {
  return {
    name,
    type: 'group',
    label,
    fields: [
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: true,
        admin: { description: 'ნავიგაციაში ჩვენება' },
      },
      {
        name: 'label',
        type: 'text',
        localized: true,
        admin: {
          description: 'ნაგულისხმევი თარგმანის ნაცვლად საჩვენებელი ტექსტი (არასავალდებულო). ცარიელად დატოვებისას იყენებს თარგმანებს.',
        },
      },
      {
        name: 'order',
        type: 'number',
        defaultValue: defaultOrder,
        min: 0,
        admin: { description: 'რიგი მენიუში (უფრო დაბალი = პირველი).' },
      },
      // ── Dropdown sub-menu ──────────────────────────────────────────────
      // The checkbox is the on/off switch the editor asked for; the subLinks
      // array only appears once it's ticked (admin `condition`). The frontend
      // also gates on hasDropdown, so un-ticking hides the dropdown without
      // deleting the rows the editor already entered.
      {
        name: 'hasDropdown',
        type: 'checkbox',
        defaultValue: false,
        admin: {
          description: 'ჩამოსაშლელი ქვემენიუს ჩართვა — ამ ბმულზე კურსორის მიტანისას გამოჩნდება ქვებმულები. გამორთვისას ქვებმულები საიტზე იმალება, მაგრამ შენახული მონაცემები რჩება.',
        },
      },
      {
        name: 'subLinks',
        type: 'array',
        labels: { singular: 'ქვებმული', plural: 'ქვებმულები' },
        admin: {
          description: 'ჩამოსაშლელი მენიუს ბმულები. გამოჩნდება მხოლოდ მაშინ, თუ ზემოთ ჩართულია „ჩამოსაშლელი ქვემენიუ“.',
          condition: (_data, siblingData) => Boolean(siblingData?.hasDropdown),
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            localized: true,
            required: true,
            admin: { description: 'ბმულის ტექსტი (მაგ: „კარდიოლოგია“).' },
          },
          {
            name: 'href',
            type: 'text',
            required: true,
            admin: { description: 'მისამართი — შიდა (მაგ: /services/cardiology) ან სრული ბმული (https://…).' },
          },
        ],
      },
    ],
  }
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'ნავიგაცია',
  admin: {
    description: 'ჰედერის სტანდარტული მენიუ (7 ფიქსირებული გვერდი) + CTA ღილაკი. თითოეულ ბმულს შეუძლია ჰქონდეს ჩამოსაშლელი ქვემენიუ — ჩართეთ „ჩამოსაშლელი ქვემენიუ“ და დაამატეთ ქვებმულები. ⚠️ ცალკეული გვერდები (Pages) აქ აღარ ჩანს — ჩართეთ "Show in navigation" Pages-ში.',
    group: 'საიტის ელემენტები',
  },
  access: { read: () => true },
  fields: [
    // Legacy free-form menu array (Payload 3.x → pre-restructure). Hidden
    // from the admin UI but kept in the schema so `push: true` doesn't
    // detect a destructive change and prompt to drop the table (which holds
    // the seeded translation defaults). Safe to delete the DB columns
    // manually once you're confident the new structure is producing the
    // right menu and you don't need to roll back.
    {
      name: 'mainMenu',
      type: 'array',
      admin: { hidden: true },
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
        { name: 'isHighlighted', type: 'checkbox', defaultValue: false },
      ],
    },
    routeGroup('homeRoute', 'მთავარი (/)', 1),
    routeGroup('aboutRoute', 'ჩვენ შესახებ (/about)', 2),
    routeGroup('servicesRoute', 'სერვისები (/services)', 3),
    routeGroup('doctorsRoute', 'ექიმები (/doctors)', 4),
    routeGroup('checkupsRoute', 'შემოწმებები (/checkups)', 5),
    routeGroup('healthLibraryRoute', 'სამედიცინო ბიბლიოთეკა (/health-library)', 6),
    routeGroup('blogRoute', 'ბლოგი (/blog)', 7),
    routeGroup('contactRoute', 'კონტაქტი (/contact)', 8),
    {
      name: 'ctaButton',
      type: 'group',
      label: 'CTA ღილაკი',
      admin: { description: 'ნავიგაციის მარჯვენა მხარეს გამოყოფილი ღილაკი (მაგ: "ჯავშანი")' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'ღილაკის ტექსტი', admin: { description: 'ღილაკზე ნაჩვენები ტექსტი (მაგ: ჯავშანი)' } },
        { name: 'href', type: 'text', label: 'ღილაკის ბმული', admin: { description: 'სად გადავიდეს ღილაკი — შიდა (მაგ: /booking) ან სრული მისამართი (https://…)' } },
      ],
    },
  ],
}
