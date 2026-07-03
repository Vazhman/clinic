import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'ფუტერი',
  admin: {
    description: 'საიტის ქვედა ნაწილის (ფუტერის) კონტენტის მართვა.',
    group: 'საიტის ელემენტები',
  },
  access: { read: () => true },
  fields: [
    { name: 'description', type: 'textarea', localized: true, label: 'კლინიკის აღწერა', admin: { description: 'კლინიკის მოკლე აღწერა ფუტერში (ლოგოს გვერდით ნაჩვენები მცირე ტექსტი)' } },
    {
      name: 'quickLinks',
      type: 'array',
      label: 'სწრაფი ბმულები',
      admin: { description: 'ფუტერში ნაჩვენები ბმულების სია (მაგ: სერვისები, ექიმები, კონტაქტი).' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true, label: 'წარწერა', admin: { description: 'ბმულის ტექსტი (მაგ: სერვისები)' } },
        { name: 'href', type: 'text', required: true, label: 'ბმული', admin: { description: 'ბმული (მაგ: /services)' } },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'სოციალური ქსელები',
      admin: { description: 'ფუტერში ნაჩვენები სოციალური ქსელების იკონები და ბმულები.' },
      fields: [
        { name: 'platform', type: 'select', required: true, label: 'პლატფორმა', admin: { description: 'აირჩიეთ სოციალური ქსელი (განსაზღვრავს იკონას).' }, options: [
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'TikTok', value: 'tiktok' },
        ]},
        { name: 'url', type: 'text', required: true, label: 'ბმული', admin: { description: 'გვერდის სრული მისამართი (მაგ: https://facebook.com/...)' } },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
      label: 'საავტორო უფლებების ტექსტი',
      admin: {
        // Left to the dynamic fallback by default so the year auto-updates.
        // The placeholder shows editors exactly what will appear when blank,
        // so the input is never a mystery — without freezing the year.
        placeholder: '© 2026 ხოზრევანიძის კლინიკა. ყველა უფლება დაცულია.',
        description:
          'ცარიელის შემთხვევაში ავტომატურად ჩაიწერება მიმდინარე წელი (იხ. ნაცრისფერი მაგალითი ველში). შეავსეთ მხოლოდ თუ გსურთ განსხვავებული ტექსტი — ამ შემთხვევაში წელი ხელით უნდა განაახლოთ.',
      },
    },
    { name: 'whatsappNumber', type: 'text', label: 'WhatsApp ნომერი', admin: { description: 'WhatsApp ნომერი (მაგ: 995422227171)' } },
    // Moved to SiteSettings ("TOP.GE / სტატისტიკა" tab) alongside the other
    // SEO/tracking fields, with an on/off toggle. Kept here, hidden, purely so
    // push:true doesn't drop the Postgres column / any legacy saved value.
    {
      name: 'topGeScript',
      label: 'TOP.GE / სტატისტიკის სკრიპტი',
      type: 'code',
      admin: {
        language: 'html',
        hidden: true,
      },
    },
  ],
}
