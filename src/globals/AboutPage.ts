import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'ჩვენ შესახებ',
  admin: {
    description: '"ჩვენ შესახებ" გვერდის კონტენტის მართვა.',
    group: 'გვერდები',
  },
  access: { read: () => true },
  fields: [
    // NOT required: each of these has a translation fallback on the public page,
    // and `required` on a global field blocks saving the WHOLE form until it's
    // filled in all 3 languages (see the same note in HomePage.ts hero).
    { name: 'title', type: 'text', localized: true, label: 'გვერდის სათაური', admin: { description: 'ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    { name: 'subtitle', type: 'text', localized: true, label: 'ქვესათაური', admin: { description: 'სათაურის ქვემოთ მცირე ტექსტი. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: 'მთავარი აღწერა',
      admin: { description: 'გვერდის ძირითადი ტექსტი. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'მთავარი სურათი', admin: { description: 'გვერდის ზედა ნაწილის (ჰერო) სურათი.' } },
    {
      name: 'ceo',
      type: 'group',
      label: 'CEO-ს მიმართვა',
      admin: { description: 'დირექტორის/CEO-ს მიმართვა და ფოტო. ცარიელად დატოვებისას სექცია არ გამოჩნდება.' },
      fields: [
        { name: 'name', type: 'text', localized: true, label: 'სახელი', admin: { description: 'მაგ: ვასილ ხოზრევანიძე' } },
        { name: 'role', type: 'text', localized: true, label: 'თანამდებობა', admin: { description: 'მაგ: დირექტორი / CEO' } },
        { name: 'photo', type: 'upload', relationTo: 'media', label: 'ფოტო', admin: { description: 'დირექტორის/CEO-ს ფოტო (მიმართვის გვერდით ნაჩვენები).' } },
        { name: 'message', type: 'textarea', localized: true, label: 'მიმართვის ტექსტი', admin: { description: 'დირექტორის/CEO-ს მისალმება/მიმართვა პაციენტებისადმი.' } },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      label: 'მთავარი მახასიათებლები',
      admin: { description: 'მაგ: ხარისხი, პროფესიონალიზმი, დაარსდა 2015...' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true, label: 'სათაური', admin: { description: 'მახასიათებლის სათაური (მაგ: მაღალი ხარისხი)' } },
        { name: 'text', type: 'textarea', required: true, localized: true, label: 'ტექსტი', admin: { description: 'სათაურის ქვემოთ მცირე აღწერა (მაგ: თანამედროვე აპარატურა და გამოცდილი ექიმები)' } },
        { name: 'icon', type: 'text', label: 'ხატულა', admin: { description: 'ემოჯი ან ხატულა (მაგ: ✓)' } },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'სტატისტიკა',
      admin: { description: 'მაგ: დაარსდა 2015, 40 საწოლი...' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true, label: 'წარწერა', admin: { description: 'რას აღნიშნავს რიცხვი (მაგ: დაარსდა)' } },
        { name: 'value', type: 'text', required: true, localized: true, label: 'მნიშვნელობა', admin: { description: 'თავად რიცხვი/მნიშვნელობა (მაგ: 2015)' } },
        { name: 'description', type: 'textarea', localized: true, label: 'აღწერა', admin: { description: 'მოკლე წინადადება რიცხვის ქვეშ (მაგ: დაარსების წელი).' } },
      ],
    },
  ],
}
