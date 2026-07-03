import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'მთავარი გვერდი',
  admin: {
    description: 'მთავარი გვერდის კონტენტის მართვა: ჰერო სექცია, გალერეა, CTA ტექსტები, სტატისტიკის რიცხვები.',
    group: 'გვერდები',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'ჰერო სექცია',
      fields: [
        // NOT required: the public site has translation fallbacks for every
        // hero field, and `required` here blocked EVERY partial save of the
        // global until all four were typed in by hand (the admin couldn't
        // save stats or FAQ without first filling the hero).
        {
          name: 'headline',
          type: 'text',
          localized: true,
          admin: { description: 'მთავარი სათაური (ცარიელი = ნაგულისხმევი ტექსტი)' },
        },
        {
          name: 'subheadline',
          type: 'text',
          localized: true,
          admin: { description: 'ქვესათაური (ცარიელი = ნაგულისხმევი ტექსტი)' },
        },
        {
          name: 'bookButtonText',
          type: 'text',
          localized: true,
          admin: { description: 'ჯავშნის ღილაკის ტექსტი (ცარიელი = ნაგულისხმევი)' },
        },
        {
          // Hidden: the split-layout hero redesign removed the second
          // ("consultation") button, so this field is rendered nowhere —
          // editing it had no effect. Kept (hidden) so the column isn't dropped.
          name: 'consultButtonText',
          type: 'text',
          localized: true,
          admin: { hidden: true, description: 'კონსულტაციის ღილაკის ტექსტი (ამჟამად არ გამოიყენება)' },
        },
        {
          name: 'badgeText',
          type: 'text',
          localized: true,
          admin: { description: 'პატარა ტექსტი ზემოთ (მაგ: 2015 წლიდან მოქმედი)' },
        },
      ],
    },
    // Superseded by sectionVisibility.doctorsPreview below (same switch, but
    // localized — this one applied to all three languages at once and had no
    // per-language override). Hidden (not deleted) so push:true doesn't drop
    // the column; no longer read anywhere in page.tsx.
    {
      name: 'showDoctorCard',
      type: 'checkbox',
      label: 'ექიმების სექციის ჩვენება მთავარ გვერდზე (ძველი, არ გამოიყენება)',
      defaultValue: true,
      admin: { hidden: true },
    },
    // Per-section, per-language visibility switches. Each field is
    // `localized: true`, so the value is stored separately per locale — an
    // editor sets the content-locale picker (top of the admin form) to e.g.
    // English and toggles a checkbox OFF, and only /en hides that section;
    // /ge and /ru are unaffected. Defaults to true (visible) so existing
    // sites don't lose any section on first deploy of this field.
    {
      name: 'sectionVisibility',
      type: 'group',
      label: 'სექციების ჩვენება/დამალვა (თითო ენაზე ცალკე)',
      admin: {
        description:
          'გადართეთ ენა ზემოთ მარჯვენა კუთხეში (ge / en / ru) და შემდეგ ჩართეთ ან გამორთეთ სექცია — ცვლილება მხოლოდ იმ ენის ვერსიაზე გავრცელდება.',
      },
      fields: [
        { name: 'hero', type: 'checkbox', label: 'ჰერო სექცია', defaultValue: true, localized: true },
        { name: 'symptomNavigator', type: 'checkbox', label: 'სიმპტომების ნავიგატორი', defaultValue: true, localized: true },
        { name: 'stats', type: 'checkbox', label: 'სტატისტიკის მრიცხველი', defaultValue: true, localized: true },
        { name: 'servicesGrid', type: 'checkbox', label: 'სერვისების ბადე', defaultValue: true, localized: true },
        { name: 'doctorsPreview', type: 'checkbox', label: 'ჩვენი ექიმები', defaultValue: true, localized: true },
        { name: 'checkupCards', type: 'checkbox', label: 'საპაკეტო შემოწმებები (checkup packages)', defaultValue: true, localized: true },
        { name: 'news', type: 'checkbox', label: 'სიახლეები', defaultValue: true, localized: true },
        { name: 'reviews', type: 'checkbox', label: 'შეფასებები', defaultValue: true, localized: true },
        { name: 'faq', type: 'checkbox', label: 'ხშირად დასმული კითხვები (FAQ)', defaultValue: true, localized: true },
        { name: 'contactMap', type: 'checkbox', label: 'კონტაქტი / რუკა', defaultValue: true, localized: true },
      ],
    },
    // Legacy: hero doctor-card doctor picker. The card itself no longer
    // exists in the redesigned hero — hidden (not deleted) so push:true
    // doesn't drop the relationship rows.
    {
      name: 'heroDoctors',
      type: 'relationship',
      relationTo: 'doctors',
      hasMany: true,
      label: 'ჰერო ბარათის ექიმები',
      admin: { hidden: true },
    },
    {
      name: 'featuredDoctors',
      type: 'relationship',
      relationTo: 'doctors',
      hasMany: true,
      label: 'მთავარი გვერდის ექიმების სია',
      admin: {
        description:
          'აირჩიეთ რომელი ექიმები იყვნენ დაშვებული მთავარი გვერდის „ჩვენი ექიმები" სექციაში. ცარიელი დატოვებისას — ყველა ექიმი. შევსებისას მხოლოდ ამ სიის ექიმები გამოჩნდება (რამდენი და თანმიმდევრობა/შემთხვევითობა ქვემოთ პარამეტრებით იმართება).',
      },
    },
    {
      // Hidden: the home "Our doctors" section always shows exactly 3 (the
      // grid is designed for 3). The editable count confused editors and was
      // never a real requirement, so it's locked to 3 in code (page.tsx).
      // Kept (hidden, not deleted) so push:true doesn't drop the column.
      name: 'featuredDoctorCount',
      type: 'number',
      label: 'მთავარ გვერდზე ექიმების რაოდენობა',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: { hidden: true },
    },
    {
      name: 'randomizeFeaturedDoctors',
      type: 'checkbox',
      label: 'ექიმები შემთხვევითად აირჩეს',
      defaultValue: false,
      admin: {
        description:
          'ჩართვისას მთავარ გვერდზე ექიმები ყოველ ჩატვირთვაზე შემთხვევითად აირჩევა (აქტიური ექიმებიდან). გამორთულია — ნაჩვენებია განყოფილების ხელმძღვანელები ფიქსირებული რიგით.',
      },
    },
    {
      name: 'heroSlides',
      type: 'array',
      label: 'ჰერო კარუსელის სლაიდები',
      admin: {
        description:
          'მთავარი გვერდის ჰერო კარუსელი. თითო სლაიდს აქვს თავისი სურათი, სათაური, ქვესათაური და ღილაკი — ყველაფერი ერთად, თანმიმდევრობით იცვლება. (3–5 სლაიდი რეკომენდებულია)',
      },
      minRows: 0,
      maxRows: 8,
      labels: { singular: 'სლაიდი', plural: 'სლაიდები' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'სურათი',
          admin: { description: 'მარჯვენა მხარის სურათი — სრულ სიმაღლეზე, მარცხნივ თეთრ ფონში გადადის.' },
        },
        { name: 'headline', type: 'text', localized: true, label: 'სათაური', admin: { description: 'მთავარი ტექსტი (მარცხენა მხარეს). ცარიელი = ნაგულისხმევი ჰერო სათაური.' } },
        { name: 'subheadline', type: 'textarea', localized: true, label: 'ქვესათაური', admin: { description: 'სათაურის ქვემოთ მცირე ტექსტი.' } },
        { name: 'buttonLabel', type: 'text', localized: true, label: 'ღილაკის ტექსტი', admin: { description: 'ცარიელი დატოვებისას ღილაკი არ გამოჩნდება.' } },
        {
          name: 'buttonHref',
          type: 'text',
          label: 'ღილაკის ბმული',
          admin: { description: 'სად გადავიდეს ღილაკი — მაგ: /booking, /servisebi, /eqimebi/[slug], ან სრული მისამართი https://...' },
        },
        // ── Legacy fields (superseded by the manual fields above). Kept hidden
        //    so Payload's push:true doesn't drop their columns. ──────────────
        {
          name: 'type',
          type: 'select',
          defaultValue: 'image',
          admin: { hidden: true },
          options: [
            { label: 'სურათი', value: 'image' },
            { label: 'სიახლე / ბლოგი', value: 'news' },
            { label: 'ექიმი', value: 'doctor' },
            { label: 'სერვისი', value: 'service' },
          ],
        },
        { name: 'newsItem', type: 'relationship', relationTo: 'news', admin: { hidden: true } },
        { name: 'doctor', type: 'relationship', relationTo: 'doctors', admin: { hidden: true } },
        { name: 'service', type: 'relationship', relationTo: 'services', admin: { hidden: true } },
        { name: 'label', type: 'text', localized: true, admin: { hidden: true } },
      ],
    },
    {
      name: 'trustStrip',
      type: 'group',
      label: 'სანდოობის ზოლი',
      admin: { description: 'ჰერო სექციის ქვედა ნაწილი' },
      fields: [
        { name: 'rating', type: 'text', defaultValue: '4.9', label: 'შეფასება (ვარსკვლავები)', admin: { description: 'სანდოობის ზოლში ნაჩვენები ვარსკვლავური შეფასება (მაგ: 4.9)' } },
        {
          name: 'doctorCount',
          type: 'text',
          localized: true,
          admin: { description: 'მაგ: 54 ექიმი' },
        },
        {
          name: 'patientCount',
          type: 'text',
          localized: true,
          admin: { description: 'მაგ: 15,000+ პაციენტი' },
        },
      ],
    },
    {
      name: 'symptomNavigator',
      type: 'group',
      label: 'სიმპტომების ნავიგატორი',
      fields: [
        { name: 'title', type: 'text', localized: true, label: 'სათაური', admin: { description: 'სიმპტომების ნავიგატორის სათაური (მაგ: რა გაწუხებთ?)' } },
        { name: 'subtitle', type: 'text', localized: true, label: 'ქვესათაური', admin: { description: 'სათაურის ქვემოთ მცირე ტექსტი (მაგ: მოძებნეთ სიმპტომი და ვიპოვით სათანადო ექიმს)' } },
        {
          name: 'placeholder',
          type: 'text',
          localized: true,
          label: 'საძიებო ველის მინიშნება',
          admin: { description: 'საძიებო ველში ნაცრისფერი მინიშნება (placeholder), მაგ: მაგ: თავის ტკივილი' },
        },
      ],
    },
    // Fully editable stats list — number, suffix AND text per row, so the
    // client can show entirely different stats, not just change the numbers.
    // First row renders as the big featured stat. Empty list → the legacy
    // fixed five below keep rendering (back-compat).
    {
      name: 'statsList',
      type: 'array',
      label: 'სტატისტიკა (სრულად რედაქტირებადი)',
      maxRows: 6,
      labels: { singular: 'სტატისტიკა', plural: 'სტატისტიკები' },
      admin: {
        description:
          'მთავარ გვერდის რიცხვები — ტექსტიც და რიცხვიც თქვენია. პირველი რიგი არის დიდი, გამორჩეული სტატისტიკა (გადაათრიეთ რიგები გადასალაგებლად). ცარიელი დატოვებისას ძველი ფიქსირებული 5 რიცხვი გამოჩნდება.',
      },
      fields: [
        { name: 'value', type: 'number', required: true, min: 0, label: 'რიცხვი', admin: { description: 'მაგ: 15000 (ანიმაციით ითვლება ნულიდან)' } },
        { name: 'suffix', type: 'text', maxLength: 6, label: 'სუფიქსი', admin: { description: 'რიცხვის ბოლოში — მაგ: +, %, /7. ცარიელიც შეიძლება.' } },
        { name: 'label', type: 'text', required: true, localized: true, label: 'წარწერა', admin: { description: 'მაგ: ჩატარებული ოპერაცია' } },
      ],
    },
    // Legacy fixed stats (numbers only, labels hardcoded). Kept as the
    // fallback when statsList is empty; SiteSettings copy is the fallback
    // below that — getStats() in payload-data.ts walks the chain.
    {
      name: 'stats',
      type: 'group',
      label: 'სტატისტიკა (ძველი — მხოლოდ რიცხვები)',
      admin: { description: 'გამოიყენება მხოლოდ მაშინ, თუ ზემოთა სია ცარიელია. 0 ჩაწერისას ის რიცხვი საიტზე აღარ გამოჩნდება.' },
      fields: [
        { name: 'patients', type: 'number', defaultValue: 15000, admin: { description: 'პაციენტების რაოდენობა (მაგ: 15000)' } },
        { name: 'satisfiedPatients', type: 'number', defaultValue: 14000, admin: { description: 'კმაყოფილი პაციენტების რაოდენობა (მაგ: 14000)' } },
        { name: 'doctors', type: 'number', defaultValue: 54, admin: { description: 'ექიმების რაოდენობა (მაგ: 54)' } },
        { name: 'operations', type: 'number', defaultValue: 5000, admin: { description: 'ოპერაციების რაოდენობა (მაგ: 5000)' } },
        { name: 'experience', type: 'number', defaultValue: 9, admin: { description: 'წლების გამოცდილება (მაგ: 9)' } },
      ],
    },
    {
      name: 'faqs',
      type: 'array',
      label: 'ხშირად დასმული კითხვები (FAQ)',
      admin: {
        description:
          'მთავარ გვერდზე ნაჩვენები კითხვა-პასუხები. ასევე ქმნის FAQ structured data-ს Google-ისთვის და AI ძიებისთვის (ChatGPT, Perplexity). ცარიელი დატოვებისას სექცია არ გამოჩნდება. რეკომენდებულია 4–8 კითხვა (მაგ: სამუშაო საათები, ენები, ჯავშანი, გადახდა).',
      },
      labels: { singular: 'კითხვა', plural: 'კითხვები' },
      fields: [
        { name: 'question', type: 'text', required: true, localized: true, label: 'კითხვა' },
        { name: 'answer', type: 'textarea', required: true, localized: true, label: 'პასუხი' },
      ],
    },
  ],
}
