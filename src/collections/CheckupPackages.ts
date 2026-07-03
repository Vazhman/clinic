import type { CollectionConfig } from 'payload'
import { localeHint } from '../fields/locale-hint'

export const CheckupPackages: CollectionConfig = {
  slug: 'checkup-packages',
  labels: { singular: 'ჩექაფ პაკეტი', plural: 'ჩექაფ პაკეტები' },
  admin: { useAsTitle: 'name', description: 'ჩექაფ პაკეტების მართვა: წინასწარ შედგენილი ანალიზებისა და სერვისების კომპლექტები, რომლებიც საიტზე ბარათების სახით ჩანს. თითო პაკეტში მიუთითეთ ფასი, ვალუტა და ჩართული სერვისები/გამოკვლევები.', defaultColumns: ['name', 'price', 'isFeatured'], group: 'კონტენტი' },
  access: { read: () => true },
  fields: [
    localeHint,
    { name: 'name', label: 'სახელი', type: 'text', required: true, localized: true },
    { name: 'description', label: 'აღწერა', type: 'text', required: true, localized: true },
    { name: 'price', label: 'ფასი', type: 'number', required: true, min: 0, admin: { description: 'ფასი არჩეულ ვალუტაში (მხოლოდ რიცხვი, ვალუტის სიმბოლოს გარეშე). მაგ: 250' } },
    {
      name: 'currency',
      label: 'ვალუტა',
      type: 'text',
      required: true,
      defaultValue: 'GEL',
      admin: { description: 'ვალუტის კოდი — დაშვებულია მხოლოდ: GEL (ლარი), USD (დოლარი), EUR (ევრო).' },
      validate: (value: string | string[] | null | undefined) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true
        const allowed = ['GEL', 'USD', 'EUR']
        if (typeof value === 'string' && allowed.includes(value.trim().toUpperCase())) return true
        return 'არასწორი ვალუტა — დაშვებულია მხოლოდ: GEL, USD, EUR.'
      },
    },
    {
      name: 'includedServices',
      label: 'ჩართული სერვისები',
      type: 'array',
      required: false,
      admin: { description: 'ჩექაფ-პაკეტში ჩართული სერვისები — სიიდან აირჩიე ნაცვლად ხელით ჩაწერისა' },
      fields: [
        {
          // Localized free text (NOT a relationship): the included items are
          // procedures/tests ("Complete Blood Count", "Echocardiography"…), which
          // are not docs in the Services (departments) collection. The relationship
          // variant left `service_id` empty, so the lists rendered blank — the real
          // names live in the localized text column, which this reads.
          name: 'service',
          label: 'სერვისი',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: 'გამოკვლევის/სერვისის სახელი (თითო სტრიქონი, თითო ენაზე).' },
        },
      ],
    },
    { name: 'isFeatured', label: 'გამოკვეთილი', type: 'checkbox', defaultValue: false },
    {
      name: 'phone',
      label: 'საკონტაქტო ტელეფონი',
      type: 'text',
      admin: {
        description: 'ამ პაკეტის საკონტაქტო ნომერი — გამოჩნდება პაკეტის დეტალებში "დარეკვის" ღილაკზე. ცარიელი დატოვების შემთხვევაში გამოჩნდება საიტის ზოგადი საკონტაქტო ნომერი.',
      },
    },
    {
      name: 'audience',
      label: 'ვისთვის (პერსონა)',
      type: 'select',
      options: [
        { label: 'ქალი', value: 'woman' },
        { label: 'კაცი', value: 'man' },
        { label: 'ბავშვი', value: 'child' },
      ],
      admin: { description: 'რომელ პერსონაში გამოჩნდეს. ცარიელი = ჩანს ყველა პერსონაში.' },
    },
    {
      name: 'tier',
      label: 'დონე',
      type: 'select',
      options: [
        { label: 'საბაზისო (GENERAL)', value: 'economy' },
        { label: 'გაფართოებული (ADVANCED)', value: 'standard' },
        { label: 'პრემიუმი (PREMIUM)', value: 'premium' },
      ],
      admin: { description: 'პაკეტის დონე — GENERAL / ADVANCED / PREMIUM.' },
    },
    {
      name: 'includedTests',
      label: 'ჩართული გამოკვლევები',
      type: 'array',
      admin: { description: 'ცალკეული ანალიზი/გამოკვლევა — თითო სტრიქონი. გამოჩნდება დეტალების ფანჯარაში.' },
      fields: [{ name: 'test', label: 'გამოკვლევა', type: 'text', required: true, localized: true }],
    },
  ],
}
