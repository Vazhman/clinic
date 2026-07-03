import type { GlobalConfig } from 'payload'

// Landing-page copy for /services. Previously the hero title/subtitle were
// next-intl strings with no CMS field — editors couldn't change them. This
// global makes that page's hero editable like every other page.
export const ServicesPage: GlobalConfig = {
  slug: 'services-page',
  label: 'სერვისების გვერდი',
  admin: {
    description: 'სერვისების გვერდის სათაური და ქვესათაური.',
    group: 'გვერდები',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', localized: true, label: 'გვერდის სათაური', admin: { description: 'სერვისების გვერდის მთავარი სათაური. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    { name: 'subtitle', type: 'text', localized: true, label: 'ქვესათაური', admin: { description: 'სათაურის ქვემოთ მცირე ტექსტი. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
  ],
}
