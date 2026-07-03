/**
 * Individual (single-condition) check-ups — the "targeted" catalogue shown on
 * /checkups below the audience tiers.
 *
 * Source: the clinic's `ჩექაფები.rar` spreadsheets (folder „ინდივიდუალური").
 * Test lists are transcribed verbatim from those sheets and kept Georgian-only,
 * exactly like the 9 audience packages in the CMS (en/ru fall back to ge). The
 * sheets carry no prices, so these render as "Price on request" — same as the
 * audience packages until the client supplies prices.
 *
 * These are intentionally a static catalogue (not Payload `checkup-packages`):
 * they have no audience/tier, rarely change, and keeping them out of the
 * collection avoids polluting the persona filter. If the client later wants to
 * edit them in the CMS, they can be migrated into `checkup-packages` with
 * audience+tier left null.
 */

export type IndividualCheckup = {
  /** Stable slug — used as React key and (later) deep-link anchor. */
  id: string
  name: { ge: string; en: string; ru: string }
  blurb: { ge: string; en: string; ru: string }
  /** Body-system key → drives the card icon. */
  system: 'digestive' | 'heart' | 'metabolic' | 'lungs' | 'blood' | 'urinary' | 'thyroid' | 'liver' | 'bone'
  /** Included tests/consultations, Georgian (mirrors CMS package test lists). */
  tests: string[]
}

export const INDIVIDUAL_CHECKUPS: IndividualCheckup[] = [
  {
    id: 'gastro',
    name: { ge: 'გასტროენტეროლოგიური ჩექაპი', en: 'Gastroenterology check-up', ru: 'Гастроэнтерологический чек-ап' },
    blurb: { ge: 'კუჭ-ნაწლავის სრული შეფასება', en: 'Complete digestive-system work-up', ru: 'Полное обследование ЖКТ' },
    system: 'digestive',
    tests: [
      'გასტროენტეროლოგის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'ღვიძლის ფუნქციური სინჯები',
      'ამილაზა',
      'ლიპაზა',
      'პარაზიტები და ჰელმინტები (ფეკალიები)',
      'ჰელიკობაქტერია (ბიოფსია)',
      'ეზოფაგოგასტროდუოდენოსკოპია',
      'კოლონოსკოპია',
      'ანესთეზიოლოგიური მომსახურება',
      'მუცლის ღრუს ექოსკოპია',
      'მუცლის ღრუს კტ',
    ],
  },
  {
    id: 'cardiovascular',
    name: { ge: 'გულ-სისხლძარღვთა სისტემის ჩექაპი', en: 'Cardiovascular check-up', ru: 'Сердечно-сосудистый чек-ап' },
    blurb: { ge: 'გულისა და სისხლძარღვების შეფასება', en: 'Heart and vascular assessment', ru: 'Оценка сердца и сосудов' },
    system: 'heart',
    tests: [
      'კარდიოლოგის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'გლუკოზა უზმოზე',
      'ლიპიდური სპექტრი',
      'კოაგულოგრამა',
      'კრეატინინი',
      'ელექტროლიტები',
      'ელექტროკარდიოგრაფია',
      'ექოკარდიოგრაფია',
      'ტრედმილი (დატვირთვის ტესტი)',
      'საძილე არტერიების დოპლერი',
    ],
  },
  {
    id: 'diabetes',
    name: { ge: 'დიაბეტის სკრინინგი', en: 'Diabetes screening', ru: 'Скрининг диабета' },
    blurb: { ge: 'შაქრიანი დიაბეტის ადრეული გამოვლენა', en: 'Early detection of diabetes', ru: 'Раннее выявление диабета' },
    system: 'metabolic',
    tests: [
      'ენდოკრინოლოგის კონსულტაცია',
      'ჰომა-ინდექსი',
      'გლიკოზირებული ჰემოგლობინი',
      'კრეატინინი',
      'შარდის საერთო ანალიზი',
    ],
  },
  {
    id: 'metabolic',
    name: { ge: 'მეტაბოლური ჯანმრთელობა', en: 'Metabolic health', ru: 'Метаболическое здоровье' },
    blurb: { ge: 'ნივთიერებათა ცვლის სრული სურათი', en: 'A full picture of your metabolism', ru: 'Полная картина обмена веществ' },
    system: 'metabolic',
    tests: [
      'ენდოკრინოლოგის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'ჰომა-ინდექსი',
      'გლიკოზირებული ჰემოგლობინი',
      'ლიპიდური ცვლა',
      'ღვიძლის ფუნქციური სინჯები',
      'ფარისებრი ჯირკვლის ფუნქციური კვლევა',
      'ვიტამინი B12',
      'კოაგულოგრამა',
      'შარდის საერთო ანალიზი',
      'მუცლის ღრუს ექოსკოპია',
      'ფარისებრი ჯირკვლის ექოსკოპია',
    ],
  },
  {
    id: 'smokers',
    name: { ge: 'მწეველთა ჯანმრთელობა', en: "Smoker's health", ru: 'Здоровье курильщика' },
    blurb: { ge: 'ფილტვებისა და გულის რისკის შეფასება', en: 'Lung and heart risk for smokers', ru: 'Оценка риска для лёгких и сердца' },
    system: 'lungs',
    tests: [
      'თერაპევტის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'ლიპიდური სპექტრი',
      'გულმკერდის კტ',
      'სპირომეტრია',
    ],
  },
  {
    id: 'anemia',
    name: { ge: 'რკინადეფიციტური ანემია', en: 'Iron-deficiency anemia', ru: 'Железодефицитная анемия' },
    blurb: { ge: 'რკინის დეფიციტისა და ანემიის დიაგნოსტიკა', en: 'Diagnosing iron deficiency & anemia', ru: 'Диагностика дефицита железа и анемии' },
    system: 'blood',
    tests: [
      'თერაპევტის / ჰემატოლოგის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'ანემიის პროფილი',
      'ფოლიუმის მჟავა',
      'ვიტამინი B12',
      'მაგნიუმი',
    ],
  },
  {
    id: 'urinary',
    name: { ge: 'საშარდე სისტემის გამოკვლევა', en: 'Urinary system check-up', ru: 'Обследование мочевыделительной системы' },
    blurb: { ge: 'საშარდე გზების შეფასება', en: 'Urinary tract assessment', ru: 'Оценка мочевыводящих путей' },
    system: 'urinary',
    tests: [
      'უროლოგის კონსულტაცია',
      'შარდის საერთო ანალიზი',
      'კრეატინინი',
      'შარდმჟავა',
      'PSA FREE / TOTAL',
      'ნაცხის აღება',
      'ნაცხის მიკროსკოპია (ურეთრა)',
      'საშარდე სისტემის ექოსკოპია',
    ],
  },
  {
    id: 'thyroid',
    name: { ge: 'ფარისებრი ჯირკვლის გამოკვლევა', en: 'Thyroid check-up', ru: 'Обследование щитовидной железы' },
    blurb: { ge: 'ფარისებრი ჯირკვლის ფუნქციის შემოწმება', en: 'Thyroid function screening', ru: 'Проверка функции щитовидной железы' },
    system: 'thyroid',
    tests: [
      'ენდოკრინოლოგის კონსულტაცია',
      'TSH',
      'FT3',
      'FT4',
      'Anti-Tg',
      'Anti-TPO',
      'ელექტროლიტები',
      'ფარისებრი ჯირკვლის ექოსკოპია',
    ],
  },
  {
    id: 'liver',
    name: { ge: 'ღვიძლის ფუნქციური გამოკვლევა', en: 'Liver function check-up', ru: 'Функциональное обследование печени' },
    blurb: { ge: 'ღვიძლის ფუნქციის სრული შეფასება', en: 'Complete liver-function assessment', ru: 'Полная оценка функции печени' },
    system: 'liver',
    tests: [
      'გასტროენტეროლოგის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'ღვიძლის ფუნქციური სინჯები',
      'C რეაქტიული ცილა',
      'კოაგულოგრამა',
      'D-დიმერი',
      'B ჰეპატიტი',
      'C ჰეპატიტი',
      'მუცლის ღრუს ექოსკოპია',
    ],
  },
  {
    id: 'musculoskeletal',
    name: { ge: 'ძვალ-სახსროვანი სისტემის გამოკვლევა', en: 'Musculoskeletal check-up', ru: 'Обследование опорно-двигательной системы' },
    blurb: { ge: 'ძვლებისა და სახსრების ჯანმრთელობა', en: 'Bone and joint health', ru: 'Здоровье костей и суставов' },
    system: 'bone',
    tests: [
      'ორთოპედ-ტრავმატოლოგის კონსულტაცია',
      'სისხლის საერთო ანალიზი',
      'ელექტროლიტები',
      'საერთო კალციუმი',
      'ტუტე ფოსფატაზა',
      'ვიტამინი D3',
      'რენტგენოგრაფია (საჭიროების მიხედვით)',
    ],
  },
]
