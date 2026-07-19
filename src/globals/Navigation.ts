import type { GlobalConfig, Field } from 'payload'

// Navigation controls the NINE built-in top-level routes (home/about/
// services/doctors/checkups/health-library/blog/contact/lab-tests) plus the
// right-side CTA button, and (via `customLinks` below) an admin-managed list
// of arbitrary extra links. New menu entries pointing at custom Pages do NOT
// live here — admin toggles "Show in navigation" on the Page itself and it
// auto-appends to the menu (see getNavigation in src/lib/payload-data.ts).
//
// Each of the 9 routes is a fixed group with these fields:
//   - enabled     : on/off in the header
//   - label       : per-locale override; empty falls back to the next-intl
//                   translation key (`Navigation.<key>` in src/messages/{ge,en,ru}.json)
//   - order       : sort order (lower = leftmost)
//   - hasDropdown : enable a hover dropdown sub-menu under this link
//   - subLinks    : the dropdown entries (shown only when hasDropdown is on)
//
// Adding/removing one of these 9 standard routes requires a code change —
// there's no array for the admin to grow, since the public site has a
// hardcoded route file for each of them and a "new menu entry" without a
// matching route would just 404. `labTestsRoute`'s `enabled` checkbox is also
// gated by the global `labTests` Feature Toggle (src/globals/FeatureToggles.ts)
// — if that whole feature is off site-wide, the nav link disappears too even
// when this checkbox says "on" (see NAV_KEY_TO_TOGGLE in payload-data.ts).
//
// `customLinks` (below) is the free-form escape hatch: admin can add/remove
// rows pointing anywhere (a service page, an external URL, …) since they're
// plain hrefs the editor types, not routes the framework has to own. Each
// row's position in the array is its display order (drag to reorder), and
// each has its own `enabled` checkbox — same on/off principle as the 9 fixed
// routes. Custom links render after the fixed routes and before auto-included
// Pages.
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
        admin: {
          hidden: true,
          description: 'რიგი მენიუში (უფრო დაბალი = პირველი). გამოიყენეთ ზემოთ „მენიუს რიგის დალაგება" ღილაკი (ჩავლება/drag-and-drop) — ხელით შეცვლა არ არის საჭირო.',
        },
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
    description: 'ჰედერის სტანდარტული მენიუ (9 ფიქსირებული გვერდი) + დამატებითი ბმულები + CTA ღილაკი. თითოეულ ბმულს შეუძლია ჰქონდეს ჩამოსაშლელი ქვემენიუ — ჩართეთ „ჩამოსაშლელი ქვემენიუ“ და დაამატეთ ქვებმულები. ახალი ბმულის დასამატებლად გამოიყენეთ ქვემოთ „დამატებითი ბმულები“ სექცია. ⚠️ ცალკეული გვერდები (Pages) აქ აღარ ჩანს — ჩართეთ "Show in navigation" Pages-ში.',
    group: 'საიტის ელემენტები',
    components: {
      elements: {
        beforeDocumentControls: ['/components/admin/NavigationReorderPanel'],
      },
    },
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
    routeGroup('labTestsRoute', 'ანალიზები (/lab-tests)', 9),
    {
      name: 'customLinks',
      type: 'array',
      label: 'დამატებითი ბმულები',
      labels: { singular: 'ბმული', plural: 'ბმულები' },
      admin: {
        description:
          'თავისუფალი ბმულების სია — დაამატეთ ნებისმიერი ახალი ბმული მენიუში, ზემოთ არსებული 9 ფიქსირებული გვერდის გარდა. თითოეულს აქვს ჩართვა/გამორთვის ღილაკი, ისევე როგორც ფიქსირებულ ბმულებს. რიგები გამოჩნდება იმ თანმიმდევრობით, რომლითაც ჩამონათვალშია — გადაათრიეთ ასწორება/დასალაგებლად.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'ჩართვა/გამორთვა — გამორთვისას ბმული ქრება მენიუდან, მაგრამ რჩება შენახული.' },
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
          admin: { description: 'ბმულის ტექსტი მენიუში (მაგ: „აქციები“).' },
        },
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: { description: 'მისამართი — შიდა (მაგ: /promotions) ან სრული ბმული (https://…).' },
        },
      ],
    },
    {
      name: 'ctaButton',
      type: 'group',
      label: 'CTA ღილაკი',
      admin: { description: 'ნავიგაციის მარჯვენა მხარეს გამოყოფილი ღილაკი (მაგ: "ჯავშანი")' },
      fields: [
        { name: 'enabled', type: 'checkbox', label: 'ღილაკის ჩვენება', defaultValue: true, admin: { description: 'ჩართვა/გამორთვა — გამორთვისას ღილაკი ქრება ჰედერიდან (დესქტოფსა და მობილურზე), მაგრამ ტექსტი/ბმული რჩება შენახული.' } },
        { name: 'label', type: 'text', localized: true, label: 'ღილაკის ტექსტი', admin: { description: 'ღილაკზე ნაჩვენები ტექსტი (მაგ: ჯავშანი)' } },
        { name: 'href', type: 'text', label: 'ღილაკის ბმული', admin: { description: 'სად გადავიდეს ღილაკი — შიდა (მაგ: /booking) ან სრული მისამართი (https://…)' } },
      ],
    },
  ],
}
