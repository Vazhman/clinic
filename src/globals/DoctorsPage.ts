import type { GlobalConfig } from 'payload'

// Landing-page copy for /doctors. Same rationale as ServicesPage — the hero
// title/subtitle were i18n-only with no CMS field; this makes them editable.
export const DoctorsPage: GlobalConfig = {
  slug: 'doctors-page',
  label: 'ექიმების გვერდი',
  admin: {
    description: 'ექიმების გვერდის სათაური და ქვესათაური.',
    group: 'გვერდები',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', localized: true, label: 'გვერდის სათაური', admin: { description: 'ექიმების გვერდის მთავარი სათაური. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    { name: 'subtitle', type: 'text', localized: true, label: 'ქვესათაური', admin: { description: 'სათაურის ქვემოთ მცირე ტექსტი. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    {
      name: 'showLanguages',
      type: 'checkbox',
      label: 'ენების ჩვენება',
      defaultValue: true,
      admin: {
        description:
          'ჩართულია — ექიმის პროფილზე და "ექიმები" გვერდის სიაში გამოჩნდება, რომელ ენებზე საუბრობს ექიმი (ველი „ცოდნა ენებში" ექიმის ბარათზე). გამორთვისას ეს ინფორმაცია იმალება ორივე გვერდზე, თუმცა ველი მაინც შეგიძლიათ შეავსოთ.',
      },
    },
  ],
}
