import type { GlobalConfig } from 'payload'

export const ContactPage: GlobalConfig = {
  slug: 'contact-page',
  label: 'საკონტაქტო გვერდი',
  admin: {
    description: 'საკონტაქტო გვერდის კონტენტის მართვა.',
    group: 'გვერდები',
  },
  access: { read: () => true },
  fields: [
    // NOT required: has a translation fallback on the public page; `required`
    // here would block saving the whole global until filled in all 3 languages.
    { name: 'title', type: 'text', localized: true, label: 'გვერდის სათაური', admin: { description: 'ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    {
      name: 'address',
      type: 'group',
      label: 'მისამართი',
      admin: { description: 'კლინიკის ფიზიკური მისამართი და რუკის კოორდინატები.' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'წარწერა', admin: { description: 'მისამართის ზემოთ წარწერა (მაგ: მისამართი)' } },
        // NOT required: localized + has a public-page fallback; `required` would
        // block saving the global until the address is filled in all 3 languages.
        { name: 'value', type: 'text', localized: true, label: 'მისამართი', admin: { description: 'ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი მისამართი.' } },
        { name: 'mapLatitude', type: 'number', label: 'რუკის განედი (latitude)', admin: { description: 'Google Maps განედი (მაგ: 41.7151)' } },
        { name: 'mapLongitude', type: 'number', label: 'რუკის გრძედი (longitude)', admin: { description: 'Google Maps გრძედი (მაგ: 44.8271)' } },
      ],
    },
    {
      name: 'phone',
      type: 'group',
      label: 'ტელეფონი',
      admin: { description: 'კლინიკის ძირითადი სატელეფონო ნომერი.' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'წარწერა', admin: { description: 'ნომრის ზემოთ წარწერა (მაგ: ცხელი ხაზი)' } },
        { name: 'value', type: 'text', required: true, label: 'ნომერი', admin: { description: 'დასარეკი ნომერი tel: ბმულისთვის (მაგ: +995422227171)' } },
        { name: 'display', type: 'text', admin: { description: 'საჩვენებელი ფორმატი (მაგ: +995 (0422) 227171)' } },
      ],
    },
    // Extra numbers (mobile, reception, ER…) — the admin asked for a way to
    // ADD phones, not just edit the single one. Rendered under the main
    // phone in the contact card on /contact and the home-page contact strip.
    {
      name: 'phones',
      type: 'array',
      label: 'დამატებითი ტელეფონები',
      labels: { singular: 'ნომერი', plural: 'ნომრები' },
      admin: {
        description: 'დამატებითი ნომრები (მაგ: მობილური, მისაღები). გამოჩნდება ძირითადი ტელეფონის ქვემოთ.',
      },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'წარწერა (მაგ: მობილური)' },
        { name: 'value', type: 'text', required: true, label: 'ნომერი', admin: { description: 'დასარეკი ნომერი (tel: ბმულისთვის), მაგ: +995555112233' } },
        { name: 'display', type: 'text', label: 'საჩვენებელი ფორმატი', admin: { description: 'ცარიელი = ნომერი როგორც არის' } },
      ],
    },
    {
      name: 'email',
      type: 'group',
      label: 'ელფოსტა',
      admin: { description: 'კლინიკის საკონტაქტო ელფოსტა.' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'წარწერა', admin: { description: 'ელფოსტის ზემოთ წარწერა (მაგ: ელფოსტა)' } },
        { name: 'value', type: 'email', required: true, label: 'ელფოსტის მისამართი', admin: { description: 'მაგ: info@khozrevanidze.ge' } },
      ],
    },
    {
      name: 'workingHours',
      type: 'group',
      label: 'სამუშაო საათები',
      admin: { description: 'კლინიკის მუშაობის განრიგი (სამუშაო დღეები და შაბათ-კვირა).' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: 'წარწერა', admin: { description: 'საათების ზემოთ წარწერა (მაგ: სამუშაო საათები)' } },
        // NOT required: localized + has a public-page fallback; `required` would
        // block saving the global until filled in all 3 languages.
        { name: 'weekdays', type: 'text', localized: true, label: 'სამუშაო დღეები', admin: { description: 'მაგ: ორშაბათი - პარასკევი: 09:00-18:00' } },
        { name: 'weekends', type: 'text', localized: true, label: 'შაბათ-კვირა', admin: { description: 'მაგ: შაბათი - კვირა: 09:30-17:00' } },
      ],
    },
    {
      // Hidden: not rendered anywhere on the public site — editing it had no
      // visible effect, which confused editors. Kept (hidden) so the column
      // isn't dropped; re-expose if a titled contact form is ever added.
      name: 'contactFormTitle',
      type: 'text',
      localized: true,
      admin: { hidden: true, description: 'საკონტაქტო ფორმის სათაური' },
    },
  ],
}
