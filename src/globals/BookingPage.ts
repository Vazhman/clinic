import type { GlobalConfig } from 'payload'

export const BookingPage: GlobalConfig = {
  slug: 'booking-page',
  label: 'ჯავშნის გვერდი',
  admin: {
    description: 'ონლაინ ჯავშნის გვერდის კონტენტის მართვა.',
    group: 'გვერდები',
  },
  access: { read: () => true },
  fields: [
    // NOT required: has a translation fallback on the public page; `required`
    // here would block saving the whole global until filled in all 3 languages.
    { name: 'title', type: 'text', localized: true, label: 'გვერდის სათაური', admin: { description: 'ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    { name: 'subtitle', type: 'text', localized: true, label: 'ქვესათაური', admin: { description: 'სათაურის ქვემოთ მცირე ტექსტი. ცარიელის შემთხვევაში გამოჩნდება ნაგულისხმევი ტექსტი.' } },
    {
      name: 'steps',
      type: 'group',
      label: 'ნაბიჯების ტექსტები',
      admin: { description: 'ჯავშნის ვიზარდის ნაბიჯების სათაურები, რომლებსაც პაციენტი ხედავს ეტაპობრივად. ცარიელის შემთხვევაში გამოიყენება ნაგულისხმევი ტექსტები.' },
      fields: [
        { name: 'selectService', type: 'text', localized: true, label: 'ნაბიჯი 1: სერვისის არჩევა', admin: { description: 'პირველი ნაბიჯის სათაური (მაგ: აირჩიეთ სერვისი)' } },
        { name: 'selectDoctor', type: 'text', localized: true, label: 'ნაბიჯი 2: ექიმის არჩევა', admin: { description: 'მეორე ნაბიჯის სათაური (მაგ: აირჩიეთ ექიმი)' } },
        { name: 'selectDate', type: 'text', localized: true, label: 'ნაბიჯი 3: თარიღის არჩევა', admin: { description: 'მესამე ნაბიჯის სათაური (მაგ: აირჩიეთ თარიღი)' } },
        { name: 'selectTime', type: 'text', localized: true, label: 'ნაბიჯი 4: დროის არჩევა', admin: { description: 'მეოთხე ნაბიჯის სათაური (მაგ: აირჩიეთ დრო)' } },
        { name: 'yourInfo', type: 'text', localized: true, label: 'ნაბიჯი 5: თქვენი მონაცემები', admin: { description: 'მეხუთე ნაბიჯის სათაური (მაგ: თქვენი მონაცემები)' } },
        { name: 'confirm', type: 'text', localized: true, label: 'ნაბიჯი 6: დადასტურება', admin: { description: 'მეექვსე ნაბიჯის სათაური (მაგ: დადასტურება)' } },
      ],
    },
    {
      name: 'form',
      type: 'group',
      label: 'ფორმის ტექსტები',
      admin: { description: 'ჯავშნის ფორმის ველების წარწერები და შეტყობინებები, რომლებსაც პაციენტი ხედავს. ცარიელის შემთხვევაში გამოიყენება ნაგულისხმევი ტექსტები.' },
      fields: [
        { name: 'fullName', type: 'text', localized: true, label: 'სრული სახელის ველი', admin: { description: 'სახელის ველის წარწერა (მაგ: სრული სახელი)' } },
        { name: 'phoneNumber', type: 'text', localized: true, label: 'ტელეფონის ველი', admin: { description: 'ტელეფონის ველის წარწერა (მაგ: ტელეფონის ნომერი)' } },
        { name: 'confirmButton', type: 'text', localized: true, label: 'დადასტურების ღილაკი', admin: { description: 'გაგზავნის ღილაკის ტექსტი (მაგ: ჯავშნის დადასტურება)' } },
        { name: 'successMessage', type: 'text', localized: true, label: 'წარმატების შეტყობინება', admin: { description: 'წარმატებული ჯავშნის შემდეგ ნაჩვენები ტექსტი (მაგ: თქვენი ჯავშანი მიღებულია)' } },
      ],
    },
  ],
}
