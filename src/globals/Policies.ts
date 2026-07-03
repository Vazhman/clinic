import type { GlobalConfig } from 'payload'

// Dedicated, VISIBLE editing home for the two legal pages (Terms & Conditions
// and Privacy Policy). Lives in the admin sidebar under „გვერდები" so editors
// can find it — unlike the Pages collection, which is hidden from the nav.
//
// Each field is localized richText. The footer link + the public page
// (/policies/terms, /policies/privacy) appear ONLY when the field for that
// locale has real content — an empty field means no link and a 404, so nothing
// half-finished is ever shown to visitors. No drafts: a global doesn't need the
// version workflow here, and skipping it keeps the schema to two plain tables.
export const Policies: GlobalConfig = {
  slug: 'policies',
  label: 'წესები და პოლიტიკა (Policies)',
  admin: {
    group: 'გვერდები',
    description:
      'იურიდიული გვერდები. ჩააგდეთ ტექსტი შესაბამის ველში (ენა გადართეთ ფორმის ზემოთ — ge / en / ru) და შეინახეთ. ცარიელი ველი — ბმული საიტის ქვედა ნაწილში (footer) არ გამოჩნდება და გვერდი არ იხსნება.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'terms',
      label: 'წესები და პირობები (Terms & Conditions)',
      type: 'richText',
      localized: true,
      admin: {
        description:
          'სრული ტექსტი. გამოჩნდება footer-ის „წესები და პირობები" ბმულით. ცარიელის შემთხვევაში ბმული იმალება.',
      },
    },
    {
      name: 'privacy',
      label: 'კონფიდენციალურობის პოლიტიკა (Privacy Policy)',
      type: 'richText',
      localized: true,
      admin: {
        description:
          'სრული ტექსტი. გამოჩნდება footer-ის „კონფიდენციალურობის პოლიტიკა" ბმულით. ცარიელის შემთხვევაში ბმული იმალება.',
      },
    },
  ],
}
