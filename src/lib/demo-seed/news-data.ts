// Demo news content, adapted from the live khozrevanidze.ge news archive
// (allnews.php). 15 curated articles across all four categories, authored in
// ge / en / ru. `imageUrl` points at each article's real image on the live
// site; the seeder downloads it (placeholder fallback on failure).
//
// This is editorial demo content — faithful to the source articles but
// rewritten for the new site, not a verbatim copy.
import type { NewsSeed } from './types'

export const newsSeed: NewsSeed[] = [
  // ── 1. Vitamin B12 ──────────────────────────────────────────────────────
  {
    slug: 'vitamin-b12-functions-and-deficiency',
    category: 'health-tips',
    publishedDate: '2026-04-15',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/%E1%83%9112%20%E1%83%95%E1%83%94%E1%83%91.png',
    showOnHomepage: true,
    homepageOrder: 0,
    imageAlt: {
      ge: 'ვიტამინი B12-ის წყაროები',
      en: 'Sources of vitamin B12',
      ru: 'Источники витамина B12',
    },
    title: {
      ge: 'ვიტამინი B12 — ფუნქციები, წყაროები და დეფიციტის ნიშნები',
      en: 'Vitamin B12 — Functions, Sources and Signs of Deficiency',
      ru: 'Витамин B12 — функции, источники и признаки дефицита',
    },
    excerpt: {
      ge: 'რატომ არის B12 სასიცოცხლოდ მნიშვნელოვანი, რა იწვევს მის დეფიციტს და როგორ ამოვიცნოთ პირველი ნიშნები.',
      en: 'Why B12 is vital, what causes deficiency, and how to recognise the early signs.',
      ru: 'Почему B12 жизненно важен, что вызывает его дефицит и как распознать первые признаки.',
    },
    body: {
      ge: [
        { p: 'ვიტამინი B12 (კობალამინი) მონაწილეობს ორგანიზმის რამდენიმე საკვანძო პროცესში. მისი დეფიციტი წლების განმავლობაში შეუმჩნევლად ვითარდება, რადგან ღვიძლი მარაგს 3–5 წლის განმავლობაში ინახავს.' },
        { h2: 'რატომ არის B12 მნიშვნელოვანი' },
        { ul: [
          'დნმ-ის სინთეზი და უჯრედების დაყოფა',
          'სისხლის წითელი უჯრედების ნორმალური მომწიფება და ქსოვილების ჟანგბადით მომარაგება',
          'ნერვული ბოჭკოების დამცავი გარსის (მიელინის) მთლიანობის შენარჩუნება',
        ] },
        { h2: 'დეფიციტის მიზეზები' },
        { ul: [
          'არასრულფასოვანი კვება (განსაკუთრებით მკაცრი ვეგანური დიეტა დანამატის გარეშე)',
          'შეწოვის დარღვევა — კუჭის ლორწოვანის ატროფია, „შინაგანი ფაქტორის" დეფიციტი, ნაწლავის პათოლოგიები',
          'ზოგიერთი მედიკამენტის ხანგრძლივი მიღება (მეტფორმინი, პროტონული ტუმბოს ინჰიბიტორები)',
        ] },
        { h2: 'სიმპტომები' },
        { p: 'ქრონიკული დაღლილობა, თავბრუსხვევა, კიდურების დაბუჟება და „ჭიანჭველების" შეგრძნება, მეხსიერების გაუარესება. დიაგნოზი დასტურდება სისხლის ანალიზით.' },
        { h2: 'როგორ შევავსოთ მარაგი' },
        { p: 'B12-ის საუკეთესო წყაროა ცხოველური პროდუქტები — ხორცი, თევზი, ზღვის პროდუქტები, რძის ნაწარმი და კვერცხი. რისკ-ჯგუფში მყოფმა პირებმა პერიოდულად უნდა გაიარონ სკრინინგი ექიმის მეთვალყურეობით.' },
      ],
      en: [
        { p: 'Vitamin B12 (cobalamin) takes part in several key processes in the body. A deficiency develops silently over years because the liver stores a 3–5 year reserve.' },
        { h2: 'Why B12 matters' },
        { ul: [
          'DNA synthesis and cell division',
          'Normal maturation of red blood cells and oxygen supply to tissues',
          'Maintaining the integrity of myelin, the protective sheath of nerve fibres',
        ] },
        { h2: 'Causes of deficiency' },
        { ul: [
          'Inadequate diet (especially a strict vegan diet without supplements)',
          'Absorption disorders — gastric lining atrophy, lack of "intrinsic factor", intestinal pathology',
          'Long-term use of some medications (metformin, proton-pump inhibitors)',
        ] },
        { h2: 'Symptoms' },
        { p: 'Chronic fatigue, dizziness, numbness and a "pins and needles" sensation in the limbs, and impaired memory. The diagnosis is confirmed with a blood test.' },
        { h2: 'How to restore your levels' },
        { p: 'The best sources of B12 are animal products — meat, fish, seafood, dairy and eggs. People in a risk group should be screened periodically under medical supervision.' },
      ],
      ru: [
        { p: 'Витамин B12 (кобаламин) участвует в нескольких ключевых процессах организма. Дефицит развивается незаметно годами, поскольку печень хранит запас на 3–5 лет.' },
        { h2: 'Почему B12 важен' },
        { ul: [
          'Синтез ДНК и деление клеток',
          'Нормальное созревание эритроцитов и снабжение тканей кислородом',
          'Сохранение целостности миелина — защитной оболочки нервных волокон',
        ] },
        { h2: 'Причины дефицита' },
        { ul: [
          'Неполноценное питание (особенно строгая веганская диета без добавок)',
          'Нарушение всасывания — атрофия слизистой желудка, нехватка «внутреннего фактора», патологии кишечника',
          'Длительный приём некоторых препаратов (метформин, ингибиторы протонной помпы)',
        ] },
        { h2: 'Симптомы' },
        { p: 'Хроническая усталость, головокружение, онемение и ощущение «мурашек» в конечностях, ухудшение памяти. Диагноз подтверждается анализом крови.' },
        { h2: 'Как восполнить запас' },
        { p: 'Лучшие источники B12 — продукты животного происхождения: мясо, рыба, морепродукты, молочные продукты и яйца. Людям из группы риска следует периодически проходить скрининг под наблюдением врача.' },
      ],
    },
  },

  // ── 2. Lumbar disc herniation ───────────────────────────────────────────
  {
    slug: 'lumbar-disc-herniation',
    category: 'medical-info',
    publishedDate: '2026-03-27',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/mix%20mix.png',
    imageAlt: {
      ge: 'წელის მალთაშუა დისკის თიაქარი',
      en: 'Lumbar intervertebral disc herniation',
      ru: 'Грыжа межпозвонкового диска поясницы',
    },
    title: {
      ge: 'რა არის წელის მალთაშუა დისკის თიაქარი?',
      en: 'What Is a Lumbar Disc Herniation?',
      ru: 'Что такое грыжа межпозвонкового диска поясницы?',
    },
    excerpt: {
      ge: 'მალთაშუა დისკის თიაქრის სიმპტომები, დიაგნოსტიკა და თანამედროვე მკურნალობის მეთოდები.',
      en: 'Symptoms, diagnosis and modern treatment options for a herniated disc.',
      ru: 'Симптомы, диагностика и современные методы лечения грыжи диска.',
    },
    body: {
      ge: [
        { p: 'ხერხემლის მალებს შორის განლაგებულია მალთაშუა დისკოები — ერთგვარი ამორტიზატორები. თითოეული შედგება ბოჭკოვანი გარე რგოლისა და გელისებრი ბირთვისგან. როდესაც ბირთვი გარეთ გამოიწევს, ვითარდება თიაქარი.' },
        { h2: 'სიმპტომები' },
        { ul: [
          'წელის ტკივილი, რომელიც ფეხში ვრცელდება',
          'დაბუჟება ან „ჭიანჭველების" შეგრძნება',
          'კუნთების სისუსტე',
        ] },
        { h2: 'დიაგნოსტიკა' },
        { p: 'თიაქრის ზუსტი ლოკალიზაციისა და ზომის დასადგენად გამოიყენება მაგნიტურ-რეზონანსული ტომოგრაფია (MRI).' },
        { h2: 'მკურნალობა' },
        { p: 'პაციენტთა 80–90%-ისთვის კონსერვატიული მკურნალობა ეფექტურია: ანთების საწინააღმდეგო პრეპარატები, ფიზიოთერაპია და სამკურნალო ბლოკადები. ოპერაცია განიხილება მაშინ, თუ 4–6 კვირის კონსერვატიული მკურნალობა შედეგს არ იძლევა — უპირატესობა ენიჭება მინიმალურად ინვაზიურ, მიკროსკოპულ ან ენდოსკოპიურ მეთოდებს.' },
      ],
      en: [
        { p: 'Between the vertebrae sit intervertebral discs that act as shock absorbers. Each has a fibrous outer ring and a gel-like nucleus. When the nucleus pushes outward, a herniation develops.' },
        { h2: 'Symptoms' },
        { ul: [
          'Lower-back pain that radiates into the leg',
          'Numbness or a "pins and needles" sensation',
          'Muscle weakness',
        ] },
        { h2: 'Diagnosis' },
        { p: 'Magnetic resonance imaging (MRI) is used to determine the exact location and size of the herniation.' },
        { h2: 'Treatment' },
        { p: 'For 80–90% of patients conservative treatment is effective: anti-inflammatory medication, physical therapy and therapeutic blocks. Surgery is considered when 4–6 weeks of conservative care fail — minimally invasive microscopic or endoscopic techniques are preferred.' },
      ],
      ru: [
        { p: 'Между позвонками расположены межпозвонковые диски — своеобразные амортизаторы. Каждый состоит из фиброзного наружного кольца и гелеобразного ядра. Когда ядро выпячивается наружу, развивается грыжа.' },
        { h2: 'Симптомы' },
        { ul: [
          'Боль в пояснице, отдающая в ногу',
          'Онемение или ощущение «мурашек»',
          'Слабость мышц',
        ] },
        { h2: 'Диагностика' },
        { p: 'Для определения точной локализации и размера грыжи применяется магнитно-резонансная томография (МРТ).' },
        { h2: 'Лечение' },
        { p: 'У 80–90% пациентов эффективно консервативное лечение: противовоспалительные препараты, физиотерапия и лечебные блокады. Операцию рассматривают, если 4–6 недель консервативного лечения не дали результата — предпочтение отдаётся малоинвазивным микроскопическим или эндоскопическим методам.' },
      ],
    },
  },

  // ── 3. How often to check vision ────────────────────────────────────────
  {
    slug: 'how-often-to-check-your-vision',
    category: 'health-tips',
    publishedDate: '2026-02-26',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/ChatGPT%20Image%20Feb%2026%2C%202026%2C%2012_43_15%20PM.png',
    imageAlt: {
      ge: 'მხედველობის შემოწმება',
      en: 'Eye examination',
      ru: 'Проверка зрения',
    },
    title: {
      ge: 'რამდენად ხშირად უნდა შევიმოწმოთ მხედველობა?',
      en: 'How Often Should You Check Your Vision?',
      ru: 'Как часто нужно проверять зрение?',
    },
    excerpt: {
      ge: 'რეგულარული პროფილაქტიკური შემოწმება საუკეთესო გზაა თვალის პათოლოგიების ადრეულ ეტაპზე გამოსავლენად.',
      en: 'Regular preventive checks are the best way to catch eye conditions early.',
      ru: 'Регулярные профилактические осмотры — лучший способ выявить патологии глаз рано.',
    },
    body: {
      ge: [
        { p: 'რეგულარული პროფილაქტიკური შემოწმება საუკეთესო გზაა თვალის პათოლოგიების ადრეულ ეტაპზე გამოსავლენად. რეკომენდებული სიხშირე ასაკის მიხედვით იცვლება.' },
        { h2: 'ასაკის მიხედვით' },
        { ul: [
          'ბავშვები და მოზარდები (0–18 წ.): სიცოცხლის პირველ თვეს, 1, 3 წლის ასაკში, სკოლამდე და ყოველწლიურად სასკოლო პერიოდში',
          '18–40 წ.: ყოველ 1–2 წელიწადში; ყოველწლიურად, თუ ატარებთ სათვალეს/ლინზებს ან ხშირად მუშაობთ კომპიუტერთან',
          '40–60 წ.: ყოველწლიურად — კატარაქტის, გლაუკომისა და ასაკთან დაკავშირებული პათოლოგიების რისკი იზრდება',
          '60+ წ.: სულ მცირე წელიწადში ერთხელ',
        ] },
        { h2: 'როდის მივმართოთ ექიმს დაუყოვნებლივ' },
        { ul: [
          'მცურავი ლაქები ან ნაპერწკლები თვალწინ',
          'მხედველობის უეცარი დაკარგვა ან დაბინდვა',
          'მხედველობის სწრაფი გაუარესება',
        ] },
        { quote: 'დროული დიაგნოსტიკა მხედველობის შენარჩუნების გარანტიაა.' },
      ],
      en: [
        { p: 'Regular preventive examinations are the best way to detect eye conditions early. The recommended frequency changes with age.' },
        { h2: 'By age group' },
        { ul: [
          'Children and teens (0–18): at the first month of life, at ages 1 and 3, before school and annually during school years',
          '18–40: every 1–2 years; annually if you wear glasses/contacts or work at a screen a lot',
          '40–60: annually — the risk of cataract, glaucoma and age-related conditions rises',
          '60+: at least once a year',
        ] },
        { h2: 'When to see a doctor immediately' },
        { ul: [
          'Floating spots or flashes of light',
          'Sudden loss or blurring of vision',
          'Rapid deterioration of vision',
        ] },
        { quote: 'Timely diagnosis is the guarantee of preserved vision.' },
      ],
      ru: [
        { p: 'Регулярные профилактические осмотры — лучший способ выявить патологии глаз на раннем этапе. Рекомендуемая частота зависит от возраста.' },
        { h2: 'По возрасту' },
        { ul: [
          'Дети и подростки (0–18 лет): на первом месяце жизни, в 1 и 3 года, перед школой и ежегодно в школьные годы',
          '18–40 лет: каждые 1–2 года; ежегодно, если носите очки/линзы или много работаете за компьютером',
          '40–60 лет: ежегодно — растёт риск катаракты, глаукомы и возрастных патологий',
          '60+ лет: не реже одного раза в год',
        ] },
        { h2: 'Когда срочно обратиться к врачу' },
        { ul: [
          'Плавающие пятна или вспышки перед глазами',
          'Внезапная потеря или затуманивание зрения',
          'Быстрое ухудшение зрения',
        ] },
        { quote: 'Своевременная диагностика — гарантия сохранения зрения.' },
      ],
    },
  },

  // ── 4. New Year nutrition ───────────────────────────────────────────────
  {
    slug: 'new-year-nutrition-advice',
    category: 'health-tips',
    publishedDate: '2025-12-30',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/axali%20celi.png',
    imageAlt: {
      ge: 'ჯანსაღი სადღესასწაულო სუფრა',
      en: 'A healthy festive table',
      ru: 'Здоровый праздничный стол',
    },
    title: {
      ge: 'წინასაახალწლო რჩევები ნუტრიციოლოგისგან',
      en: "A Nutritionist's New-Year Advice",
      ru: 'Новогодние советы от нутрициолога',
    },
    excerpt: {
      ge: 'როგორ შევუთავსოთ ტრადიციული ქართული სუფრა ჯანსაღ კვებას — რვა მარტივი წესი.',
      en: 'How to combine the traditional Georgian table with healthy eating — eight simple rules.',
      ru: 'Как совместить традиционный грузинский стол со здоровым питанием — восемь простых правил.',
    },
    body: {
      ge: [
        { p: 'სადღესასწაულო სუფრა ჯანმრთელობის საზიანო არ უნდა იყოს. რამდენიმე მარტივი წესი დაგეხმარებათ, ისიამოვნოთ ტრადიციული კერძებით კუჭ-ნაწლავის გადატვირთვის გარეშე.' },
        { h2: 'რვა ოქროს წესი' },
        { ul: [
          'მაიონეზის ნაცვლად — მაწონი და აჯიკა',
          'გადამუშავებული ხორცის ნაცვლად — ახალი მოხარშული ქათამი',
          'შეწვის ნაცვლად — გამოცხობა ან გრილზე მომზადება',
          'დაიწყეთ ბოსტნეულით, შემდეგ — ცილოვანი კერძები',
          'მძიმე ნაღების ტორტის ნაცვლად — ახალი ხილი',
          'ტკბილი გაზიანი სასმელების ნაცვლად — წყალი და ზომიერად მშრალი ღვინო',
          'ალკოჰოლი — ზომიერად',
          'საკმარისი წყლის მიღება',
        ] },
        { h2: 'დამატებითი რჩევა' },
        { p: 'არ იშიმშილოთ მთელი დღე საღამოს ნადიმის მოლოდინში და შეინარჩუნეთ ფიზიკური აქტივობა — ეს მონელებას უწყობს ხელს.' },
      ],
      en: [
        { p: 'A festive table does not have to harm your health. A few simple rules let you enjoy traditional dishes without overloading the digestive system.' },
        { h2: 'Eight golden rules' },
        { ul: [
          'Swap mayonnaise for yoghurt and ajika',
          'Choose freshly boiled chicken over processed meats',
          'Bake or grill instead of frying',
          'Start with vegetables, then move to protein dishes',
          'Pick fresh fruit over heavy cream cakes',
          'Prefer water and a little dry wine to sweet fizzy drinks',
          'Keep alcohol moderate',
          'Drink enough water',
        ] },
        { h2: 'One more tip' },
        { p: 'Do not fast all day in anticipation of the evening feast, and keep moving — physical activity aids digestion.' },
      ],
      ru: [
        { p: 'Праздничный стол не обязан вредить здоровью. Несколько простых правил помогут насладиться традиционными блюдами без перегрузки желудочно-кишечного тракта.' },
        { h2: 'Восемь золотых правил' },
        { ul: [
          'Вместо майонеза — мацони и аджика',
          'Вместо переработанного мяса — свежая отварная курица',
          'Вместо жарки — запекание или гриль',
          'Начинайте с овощей, затем — белковые блюда',
          'Вместо тяжёлого торта со сливками — свежие фрукты',
          'Вместо сладких газированных напитков — вода и немного сухого вина',
          'Алкоголь — умеренно',
          'Достаточное количество воды',
        ] },
        { h2: 'Дополнительный совет' },
        { p: 'Не голодайте весь день в ожидании вечернего застолья и сохраняйте физическую активность — это способствует пищеварению.' },
      ],
    },
  },

  // ── 5. Laparoscopy ──────────────────────────────────────────────────────
  {
    slug: 'laparoscopy-in-general-surgery',
    category: 'medical-info',
    publishedDate: '2025-12-15',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/Laparaskopia.jpeg',
    showOnHomepage: true,
    homepageOrder: 2,
    imageAlt: {
      ge: 'ლაპაროსკოპიული ოპერაცია',
      en: 'Laparoscopic surgery',
      ru: 'Лапароскопическая операция',
    },
    title: {
      ge: 'ლაპაროსკოპია — თანამედროვე არჩევანი ზოგად ქირურგიაში',
      en: 'Laparoscopy — the Modern Choice in General Surgery',
      ru: 'Лапароскопия — современный выбор в общей хирургии',
    },
    excerpt: {
      ge: 'მცირე ჭრილობებით ჩატარებული ოპერაცია, რომელიც ამცირებს ტკივილს და აჩქარებს გამოჯანმრთელებას.',
      en: 'Surgery through tiny incisions that reduces pain and speeds recovery.',
      ru: 'Операция через крошечные разрезы, которая уменьшает боль и ускоряет восстановление.',
    },
    body: {
      ge: [
        { p: 'ლაპაროსკოპია თანამედროვე ქირურგიული მეთოდია, რომელიც დიდი ჭრილობის ნაცვლად 0.5–1.5 სმ ზომის მცირე ჭრილობებს იყენებს. კამერიანი ლაპაროსკოპი შიდა ორგანოებს 4K ან 3D მონიტორზე გამოსახავს.' },
        { h2: 'უპირატესობები' },
        { ul: [
          'ნაკლები ოპერაციის შემდგომი ტკივილი',
          'სწრაფი გამოჯანმრთელება — ჩვეულ რიტმს პაციენტი დღეებში უბრუნდება',
          'ხანმოკლე ჰოსპიტალიზაცია (24–48 საათი)',
          'მინიმალური ნაწიბურები და გართულებების დაბალი რისკი',
        ] },
        { h2: 'რა შემთხვევებში გამოიყენება' },
        { p: 'ნაღვლის ბუშტის ამოკვეთა, სანაღვლე გზების ოპერაციები, გადაუდებელი ჩარევები (აპენდიციტი, პერფორაცია, გაუვალობა), თიაქრის აღდგენა და ღვიძლის/კუჭქვეშა ჯირკვლის/ნაწლავის ოპერაციები.' },
        { h2: 'მნიშვნელოვანი დათქმა' },
        { p: 'ლაპაროსკოპია ყველა შემთხვევაში არ არის მისაღები — გადაწყვეტილება დამოკიდებულია დაავადების ტიპზე, პაციენტის ასაკსა და თანმხლებ პათოლოგიებზე.' },
      ],
      en: [
        { p: 'Laparoscopy is a modern surgical technique that uses small 0.5–1.5 cm incisions instead of a large cut. A laparoscope with a camera displays the internal organs on a 4K or 3D monitor.' },
        { h2: 'Advantages' },
        { ul: [
          'Less post-operative pain',
          'Fast recovery — patients return to their routine within days',
          'Short hospital stay (24–48 hours)',
          'Minimal scarring and a lower risk of complications',
        ] },
        { h2: 'When it is used' },
        { p: 'Gallbladder removal, bile-duct operations, emergency procedures (appendicitis, perforation, obstruction), hernia repair, and liver / pancreas / bowel operations.' },
        { h2: 'An important caveat' },
        { p: 'Laparoscopy is not suitable for every case — the decision depends on the type of disease, the patient’s age and any coexisting conditions.' },
      ],
      ru: [
        { p: 'Лапароскопия — современный хирургический метод, при котором вместо большого разреза используются небольшие разрезы 0,5–1,5 см. Лапароскоп с камерой выводит изображение внутренних органов на 4K- или 3D-монитор.' },
        { h2: 'Преимущества' },
        { ul: [
          'Меньше послеоперационной боли',
          'Быстрое восстановление — пациент возвращается к привычному ритму за несколько дней',
          'Короткая госпитализация (24–48 часов)',
          'Минимальные рубцы и низкий риск осложнений',
        ] },
        { h2: 'Когда применяется' },
        { p: 'Удаление желчного пузыря, операции на желчных путях, экстренные вмешательства (аппендицит, перфорация, непроходимость), пластика грыжи, операции на печени, поджелудочной железе и кишечнике.' },
        { h2: 'Важная оговорка' },
        { p: 'Лапароскопия подходит не во всех случаях — решение зависит от типа заболевания, возраста пациента и сопутствующих патологий.' },
      ],
    },
  },

  // ── 6. Spirometry (clinic news) ─────────────────────────────────────────
  {
    slug: 'spirometry-at-khozrevanidze-clinic',
    category: 'clinic-news',
    publishedDate: '2025-12-10',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/jamila%202.jpeg',
    showOnHomepage: true,
    homepageOrder: 4,
    imageAlt: {
      ge: 'სპირომეტრიის კვლევა',
      en: 'Spirometry test',
      ru: 'Спирометрия',
    },
    title: {
      ge: 'სპირომეტრია ხოზრევანიძის კლინიკაში',
      en: 'Spirometry at Khozrevanidze Clinic',
      ru: 'Спирометрия в клинике Хозреванидзе',
    },
    excerpt: {
      ge: 'მაღალი სიზუსტის სპირომეტრია ATS/ERS საერთაშორისო სტანდარტებით, გამოცდილი პულმონოლოგის მეთვალყურეობით.',
      en: 'High-precision spirometry to ATS/ERS international standards, supervised by an experienced pulmonologist.',
      ru: 'Высокоточная спирометрия по международным стандартам ATS/ERS под наблюдением опытного пульмонолога.',
    },
    body: {
      ge: [
        { p: 'ხოზრევანიძის კლინიკა იყენებს მაღალი სიზუსტის სპირომეტრიულ აპარატურას და მიჰყვება საერთაშორისო გაიდლაინებს (ATS/ERS). კვლევას ატარებს სპეციალურად მომზადებული პერსონალი.' },
        { h2: 'რას ზომავს სპირომეტრია' },
        { p: 'ფილტვების მოცულობას, ჰაერის გამოდევნის სიჩქარესა და ბრონქების გამავლობას. ძირითადი მაჩვენებლებია FVC, FEV₁ და FEV₁/FVC თანაფარდობა.' },
        { h2: 'ვის ენიშნება' },
        { ul: [
          'ხველა, ქოშინი ან სასტვენისებრი სუნთქვა',
          'ასთმის, ფილტვის ქრონიკული ობსტრუქციული დაავადების (COPD) ან ფიბროზის დიაგნოსტიკა',
          'პროფილაქტიკური სკრინინგი მწეველებსა და პროფესიული ექსპოზიციის მქონე პირებში',
        ] },
        { h2: 'უსაფრთხო და სწრაფი' },
        { p: 'კვლევა უმტკივნეულოა, შესაფერისია ორსულებისთვისაც და გვაძლევს დეტალურ, პაციენტისთვის გასაგებ დასკვნას.' },
      ],
      en: [
        { p: 'Khozrevanidze Clinic uses high-precision spirometry equipment and follows international guidelines (ATS/ERS). The test is performed by specially trained staff.' },
        { h2: 'What spirometry measures' },
        { p: 'Lung volume, the speed of air expulsion and bronchial patency. The main parameters are FVC, FEV₁ and the FEV₁/FVC ratio.' },
        { h2: 'Who it is for' },
        { ul: [
          'Cough, shortness of breath or wheezing',
          'Diagnosis of asthma, COPD or fibrosis',
          'Preventive screening for smokers and people with occupational exposure',
        ] },
        { h2: 'Safe and quick' },
        { p: 'The test is painless, suitable even for pregnant patients, and produces a detailed, patient-friendly report.' },
      ],
      ru: [
        { p: 'Клиника Хозреванидзе использует высокоточное спирометрическое оборудование и следует международным рекомендациям (ATS/ERS). Исследование проводит специально обученный персонал.' },
        { h2: 'Что измеряет спирометрия' },
        { p: 'Объём лёгких, скорость выдоха воздуха и проходимость бронхов. Основные показатели — FVC, FEV₁ и соотношение FEV₁/FVC.' },
        { h2: 'Кому назначается' },
        { ul: [
          'Кашель, одышка или свистящее дыхание',
          'Диагностика астмы, ХОБЛ или фиброза',
          'Профилактический скрининг курильщиков и людей с профессиональным воздействием',
        ] },
        { h2: 'Безопасно и быстро' },
        { p: 'Исследование безболезненно, подходит даже беременным и даёт подробное, понятное пациенту заключение.' },
      ],
    },
  },

  // ── 7. Endoscopic ear surgery ───────────────────────────────────────────
  {
    slug: 'endoscopic-hearing-restoration-surgery',
    category: 'medical-info',
    publishedDate: '2025-11-11',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/Gela%20statia%204.jpeg',
    imageAlt: {
      ge: 'ენდოსკოპიური ყურის ოპერაცია',
      en: 'Endoscopic ear surgery',
      ru: 'Эндоскопическая операция на ухе',
    },
    title: {
      ge: 'სმენის აღდგენითი ოპერაციები ენდოსკოპიური მეთოდით',
      en: 'Endoscopic Hearing-Restoration Surgery',
      ru: 'Эндоскопические операции по восстановлению слуха',
    },
    excerpt: {
      ge: 'სტაპედოპლასტიკა და ტიმპანოპლასტიკა ენდოსკოპიური მეთოდით — 360° ხედვა და თითქმის უხილავი ჭრილობები.',
      en: 'Stapedoplasty and tympanoplasty performed endoscopically — 360° visualisation and near-invisible incisions.',
      ru: 'Стапедопластика и тимпанопластика эндоскопическим методом — обзор 360° и почти незаметные разрезы.',
    },
    body: {
      ge: [
        { p: 'ხოზრევანიძის კლინიკა საქართველოში პირველთა შორის დანერგა ენდოსკოპიური მეთოდები ოტორინოლარინგოლოგიაში. ეს მიდგომა უზრუნველყოფს უკეთეს ხედვას, მცირე ჭრილობებსა და სწრაფ გამოჯანმრთელებას.' },
        { h2: 'სტაპედოპლასტიკა' },
        { p: 'ოტოსკლეროზის დროს გამოიყენება — დაზიანებული უზანგი ცვლება მინიატურული პროთეზით, რათა აღდგეს ბგერის გადაცემა შიდა ყურამდე. წარმატების მაჩვენებელი 70–95%-ია.' },
        { h2: 'ტიმპანოპლასტიკა' },
        { p: 'აღადგენს დაფის აპკს ქრონიკული ანთებისა და ტრავმის შემთხვევაში, ეხმარება ინფექციების პრევენციასა და შუა ყურის ჯანმრთელობის შენარჩუნებაში.' },
        { h2: 'ენდოსკოპიური მეთოდის უპირატესობა' },
        { p: 'ტრადიციული მიკროსკოპული მიდგომისგან განსხვავებით, ენდოსკოპი 360° ხედვას იძლევა და ჭრილობა პრაქტიკულად უხილავია.' },
      ],
      en: [
        { p: 'Khozrevanidze Clinic was among the first in Georgia to introduce endoscopic methods in otorhinolaryngology. This approach offers better visualisation, smaller incisions and faster recovery.' },
        { h2: 'Stapedoplasty' },
        { p: 'Used for otosclerosis — the damaged stapes is replaced with a miniature prosthesis to restore sound transmission to the inner ear. Success rates are 70–95%.' },
        { h2: 'Tympanoplasty' },
        { p: 'Reconstructs the eardrum after chronic inflammation or trauma, helping to prevent infection and maintain middle-ear health.' },
        { h2: 'Why endoscopic' },
        { p: 'Unlike the traditional microscopic approach, the endoscope provides 360° visualisation and the incision is practically invisible.' },
      ],
      ru: [
        { p: 'Клиника Хозреванидзе одной из первых в Грузии внедрила эндоскопические методы в оториноларингологии. Такой подход обеспечивает лучший обзор, малые разрезы и быстрое восстановление.' },
        { h2: 'Стапедопластика' },
        { p: 'Применяется при отосклерозе — повреждённое стремечко заменяется миниатюрным протезом, чтобы восстановить передачу звука во внутреннее ухо. Успешность — 70–95%.' },
        { h2: 'Тимпанопластика' },
        { p: 'Восстанавливает барабанную перепонку при хроническом воспалении и травме, помогает предотвратить инфекции и сохранить здоровье среднего уха.' },
        { h2: 'Почему эндоскопия' },
        { p: 'В отличие от традиционного микроскопического подхода, эндоскоп даёт обзор 360°, а разрез практически незаметен.' },
      ],
    },
  },

  // ── 8. CT ───────────────────────────────────────────────────────────────
  {
    slug: 'computed-tomography-what-to-know',
    category: 'medical-info',
    publishedDate: '2025-11-07',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/CT%20640.jpeg',
    showOnHomepage: true,
    homepageOrder: 3,
    imageAlt: {
      ge: 'კომპიუტერული ტომოგრაფიის აპარატი',
      en: 'CT scanner',
      ru: 'Компьютерный томограф',
    },
    title: {
      ge: 'კომპიუტერული ტომოგრაფია (CT) — რა უნდა ვიცოდეთ',
      en: 'Computed Tomography (CT) — What You Should Know',
      ru: 'Компьютерная томография (КТ) — что нужно знать',
    },
    excerpt: {
      ge: '640-სრესიანი Toshiba Aquilion ONE ტომოგრაფი — ულტრამაღალი გარჩევადობა და მინიმალური დასხივება.',
      en: 'A 640-slice Toshiba Aquilion ONE scanner — ultra-high resolution with minimal radiation.',
      ru: '640-срезовый томограф Toshiba Aquilion ONE — сверхвысокое разрешение при минимальном облучении.',
    },
    body: {
      ge: [
        { p: 'კომპიუტერული ტომოგრაფია არაინვაზიური ვიზუალიზაციის მეთოდია, რომელიც სხეულის შიდა სტრუქტურების თხელ ფენებად სკანირებას ახდენს. ჩვენი 640-სრესიანი Toshiba Aquilion ONE ტომოგრაფი 0.5 მმ-იან სრესებს იღებს მინიმალური დასხივებით.' },
        { h2: 'სად გამოიყენება' },
        { ul: [
          'თავის ტვინი — ინსულტისა და ტრავმის დიაგნოსტიკა',
          'გულმკერდი — ფილტვის დაავადებები',
          'გული — კარდიო-CT და კორონაროგრაფია',
          'მუცელი და მენჯი, საყრდენ-მამოძრავებელი სისტემა, სისხლძარღვები',
        ] },
        { h2: 'როგორ მიმდინარეობს' },
        { p: 'კვლევა გრძელდება 1–5 წუთი და უმტკივნეულოა. შიმშილი საჭიროა მხოლოდ კონტრასტული კვლევისას (4–6 საათით ადრე).' },
        { h2: 'უსაფრთხოება' },
        { p: 'დასკვნას ამუშავებენ გამოცდილი რადიოლოგები სპეციალური 3D პროგრამით, დასხივების მკაცრი კონტროლის პირობებში.' },
      ],
      en: [
        { p: 'Computed tomography is a non-invasive imaging method that scans the body’s internal structures in thin layers. Our 640-slice Toshiba Aquilion ONE scanner captures 0.5 mm slices with minimal radiation.' },
        { h2: 'Where it is used' },
        { ul: [
          'Brain — diagnosis of stroke and trauma',
          'Chest — lung disease',
          'Heart — cardiac CT and coronary angiography',
          'Abdomen and pelvis, the musculoskeletal system, blood vessels',
        ] },
        { h2: 'How it works' },
        { p: 'The scan takes 1–5 minutes and is painless. Fasting is required only for contrast studies (4–6 hours beforehand).' },
        { h2: 'Safety' },
        { p: 'Reports are processed by experienced radiologists with dedicated 3D software, under strict dose control.' },
      ],
      ru: [
        { p: 'Компьютерная томография — неинвазивный метод визуализации, выполняющий послойное сканирование внутренних структур тела тонкими срезами. Наш 640-срезовый томограф Toshiba Aquilion ONE делает срезы 0,5 мм при минимальном облучении.' },
        { h2: 'Где применяется' },
        { ul: [
          'Головной мозг — диагностика инсульта и травм',
          'Грудная клетка — заболевания лёгких',
          'Сердце — кардио-КТ и коронарография',
          'Живот и таз, опорно-двигательная система, сосуды',
        ] },
        { h2: 'Как проходит' },
        { p: 'Исследование длится 1–5 минут и безболезненно. Голодание требуется только при контрастном исследовании (за 4–6 часов).' },
        { h2: 'Безопасность' },
        { p: 'Заключение обрабатывают опытные рентгенологи с помощью специальной 3D-программы при строгом контроле дозы облучения.' },
      ],
    },
  },

  // ── 9. Stroke ───────────────────────────────────────────────────────────
  {
    slug: 'what-is-a-stroke',
    category: 'medical-info',
    publishedDate: '2025-11-05',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/insulti.jpg',
    showOnHomepage: true,
    homepageOrder: 1,
    imageAlt: {
      ge: 'ინსულტის ამოცნობა — FAST ტესტი',
      en: 'Recognising a stroke — the FAST test',
      ru: 'Распознавание инсульта — тест FAST',
    },
    title: {
      ge: 'რა არის ინსულტი?',
      en: 'What Is a Stroke?',
      ru: 'Что такое инсульт?',
    },
    excerpt: {
      ge: 'ინსულტის ფორმები, FAST ტესტი სიმპტომების ამოსაცნობად და რატომ აქვს დროს კრიტიკული მნიშვნელობა.',
      en: 'The types of stroke, the FAST test for spotting symptoms, and why time is critical.',
      ru: 'Формы инсульта, тест FAST для распознавания симптомов и почему время критически важно.',
    },
    body: {
      ge: [
        { p: 'ინსულტი ვითარდება, როდესაც თავის ტვინის უბანი ჟანგბადს ვერ იღებს. დროის ფაქტორს კრიტიკული მნიშვნელობა აქვს — რაც უფრო სწრაფად დაიწყება მკურნალობა, მით უკეთესია გამოსავალი.' },
        { h2: 'ძირითადი ფორმები' },
        { ul: [
          'იშემიური ინსულტი (≈87%) — არტერიის დახშობა თრომბით',
          'ჰემორაგიული ინსულტი — სისხლძარღვის გასკდომა და სისხლჩაქცევა',
          'გარდამავალი იშემიური შეტევა (TIA) — დროებითი, მაგრამ სერიოზული გამაფრთხილებელი ნიშანი',
        ] },
        { h2: 'FAST ტესტი' },
        { ul: [
          'F (Face) — სახის ასიმეტრია ღიმილისას',
          'A (Arms) — ხელის დაშვება აწევისას',
          'S (Speech) — მეტყველების გაძნელება',
          'T (Time) — დაუყოვნებლივ გამოიძახეთ სასწრაფო',
        ] },
        { h2: 'პრევენცია' },
        { p: 'მართეთ არტერიული წნევა, შაქარი და ქოლესტერინი, თავი დაანებეთ მოწევას და იყავით ფიზიკურად აქტიური. რეგულარული შემოწმება ამცირებს რისკს.' },
      ],
      en: [
        { p: 'A stroke develops when part of the brain stops receiving oxygen. Time is critical — the sooner treatment begins, the better the outcome.' },
        { h2: 'Main types' },
        { ul: [
          'Ischaemic stroke (≈87%) — an artery blocked by a clot',
          'Haemorrhagic stroke — a ruptured vessel and bleeding',
          'Transient ischaemic attack (TIA) — temporary, but a serious warning sign',
        ] },
        { h2: 'The FAST test' },
        { ul: [
          'F (Face) — facial drooping when smiling',
          'A (Arms) — one arm drifts down when raised',
          'S (Speech) — slurred or difficult speech',
          'T (Time) — call emergency services immediately',
        ] },
        { h2: 'Prevention' },
        { p: 'Control blood pressure, blood sugar and cholesterol, stop smoking and stay physically active. Regular check-ups reduce the risk.' },
      ],
      ru: [
        { p: 'Инсульт развивается, когда участок мозга перестаёт получать кислород. Фактор времени критически важен — чем раньше начато лечение, тем лучше исход.' },
        { h2: 'Основные формы' },
        { ul: [
          'Ишемический инсульт (≈87%) — закупорка артерии тромбом',
          'Геморрагический инсульт — разрыв сосуда и кровоизлияние',
          'Транзиторная ишемическая атака (ТИА) — временный, но серьёзный предупреждающий знак',
        ] },
        { h2: 'Тест FAST' },
        { ul: [
          'F (Face) — асимметрия лица при улыбке',
          'A (Arms) — рука опускается при поднятии',
          'S (Speech) — затруднённая речь',
          'T (Time) — немедленно вызовите скорую помощь',
        ] },
        { h2: 'Профилактика' },
        { p: 'Контролируйте артериальное давление, сахар и холестерин, откажитесь от курения и будьте физически активны. Регулярные осмотры снижают риск.' },
      ],
    },
  },

  // ── 10. Septoplasty ─────────────────────────────────────────────────────
  {
    slug: 'septoplasty-nasal-septum-correction',
    category: 'medical-info',
    publishedDate: '2025-10-31',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/gela%20statia%203.jpeg',
    imageAlt: {
      ge: 'ცხვირის ძგიდის გასწორება',
      en: 'Nasal septum correction',
      ru: 'Исправление носовой перегородки',
    },
    title: {
      ge: 'ცხვირის ძგიდის გასწორება — სეპტოპლასტიკა',
      en: 'Septoplasty — Correcting a Deviated Nasal Septum',
      ru: 'Септопластика — исправление носовой перегородки',
    },
    excerpt: {
      ge: 'ფუნქციური ოპერაცია, რომელიც აღადგენს ცხვირით სუნთქვას ცხვირის გარეგნული ფორმის შეცვლის გარეშე.',
      en: 'A functional operation that restores nasal breathing without changing the outward shape of the nose.',
      ru: 'Функциональная операция, восстанавливающая носовое дыхание без изменения внешней формы носа.',
    },
    body: {
      ge: [
        { p: 'ცხვირის ძგიდე ხრტილოვანი და ძვლოვანი ნაწილებისგან შედგება და ცხვირის ღრუს ორ ნაწილად ყოფს. მოსახლეობის დაახლოებით 70–80%-ს ძგიდის ამა თუ იმ ხარისხის გადახრა აქვს.' },
        { h2: 'გადახრის გავლენა' },
        { p: 'ცხვირით სუნთქვის გაძნელება, ქრონიკული შეგუბება, თავის ტკივილი, ძილის დარღვევა, განმეორებითი სინუსიტი და ყნოსვის დაქვეითება.' },
        { h2: 'რა არის სეპტოპლასტიკა' },
        { p: 'ენდოსკოპიური მეთოდით ჩატარებული ფუნქციური ოპერაცია, რომელიც გარე ჭრილობის გარეშე ასწორებს მხოლოდ ხელისშემშლელ მონაკვეთს. ცხვირის გარეგნული ფორმა არ იცვლება. ოპერაცია გრძელდება 30–40 წუთი.' },
        { h2: 'პოსტოპერაციული პერიოდი' },
        { p: 'პაციენტი, ჩვეულებრივ, მეორე დღეს ეწერება, ხოლო ჩვეულ აქტივობას 7–10 დღეში უბრუნდება. სუნთქვა ხდება ღრმა, თავისუფალი და სიმეტრიული.' },
      ],
      en: [
        { p: 'The nasal septum is made of cartilage and bone and divides the nasal cavity in two. About 70–80% of people have some degree of deviation.' },
        { h2: 'Effects of deviation' },
        { p: 'Difficulty breathing through the nose, chronic congestion, headaches, disturbed sleep, recurrent sinusitis and reduced sense of smell.' },
        { h2: 'What septoplasty is' },
        { p: 'A functional operation performed endoscopically that straightens only the obstructing portion, with no external incision. The outward shape of the nose does not change. The procedure takes 30–40 minutes.' },
        { h2: 'Recovery' },
        { p: 'Patients are usually discharged the next day and return to normal activity within 7–10 days. Breathing becomes deep, free and symmetrical.' },
      ],
      ru: [
        { p: 'Носовая перегородка состоит из хрящевой и костной частей и делит полость носа на две части. Примерно у 70–80% людей есть та или иная степень искривления.' },
        { h2: 'Влияние искривления' },
        { p: 'Затруднённое носовое дыхание, хроническая заложенность, головные боли, нарушение сна, рецидивирующий синусит и снижение обоняния.' },
        { h2: 'Что такое септопластика' },
        { p: 'Функциональная операция эндоскопическим методом, которая без наружного разреза выпрямляет только мешающий участок. Внешняя форма носа не меняется. Операция длится 30–40 минут.' },
        { h2: 'Послеоперационный период' },
        { p: 'Пациента обычно выписывают на следующий день, а к привычной активности он возвращается за 7–10 дней. Дыхание становится глубоким, свободным и симметричным.' },
      ],
    },
  },

  // ── 11. Gastroenterology ────────────────────────────────────────────────
  {
    slug: 'gastroenterology-gut-health',
    category: 'medical-info',
    publishedDate: '2025-10-08',
    imageUrl: 'https://www.khozrevanidze.ge/storage/gast.jpeg',
    imageAlt: {
      ge: 'გასტროენტეროლოგია',
      en: 'Gastroenterology',
      ru: 'Гастроэнтерология',
    },
    title: {
      ge: 'გასტროენტეროლოგია — ყველაფერი კუჭ-ნაწლავის ჯანმრთელობაზე',
      en: 'Gastroenterology — All About Gut Health',
      ru: 'Гастроэнтерология — всё о здоровье ЖКТ',
    },
    excerpt: {
      ge: 'რატომ უწოდებენ კუჭ-ნაწლავს „მეორე ტვინს", რა ნიშნებს უნდა მივაქციოთ ყურადღება და როგორ ვუზრუნველყოთ პრევენცია.',
      en: 'Why the gut is called the "second brain", which signs to watch for, and how to prevent problems.',
      ru: 'Почему ЖКТ называют «вторым мозгом», на какие признаки обращать внимание и как обеспечить профилактику.',
    },
    body: {
      ge: [
        { p: 'კუჭ-ნაწლავის ტრაქტს „მეორე ტვინსაც" უწოდებენ — მასში მილიონობით ნერვული უჯრედია თავმოყრილი, რომელიც განწყობასა და ზოგად თვითშეგრძნებაზეც მოქმედებს.' },
        { h2: 'გავრცელებული პრობლემები' },
        { p: 'მჟავას რეფლუქსი, გასტრიტი, ნაღვლის კენჭები, პანკრეატიტი და ნაწლავის ანთებითი დაავადებები.' },
        { h2: 'როდის მივმართოთ სპეციალისტს' },
        { ul: [
          'მუდმივი გულძმარვა',
          'სისხლი განავალში',
          'მუცლის მუდმივი ტკივილი ან ძლიერი შებერილობა',
          'მადის დაკარგვა და აუხსნელი წონის კლება',
        ] },
        { h2: 'დიაგნოსტიკა და პრევენცია' },
        { p: 'თანამედროვე მეთოდები მოიცავს ულტრაბგერას, ენდოსკოპიას, კოლონოსკოპიასა და ლაბორატორიულ ანალიზებს. პრევენცია ეფუძნება რეგულარულ კვებას, ბოჭკოს მიღებას, წყლის ბალანსს, სტრესის მართვასა და ყოველწლიურ შემოწმებას.' },
      ],
      en: [
        { p: 'The gastrointestinal tract is also called the "second brain" — it contains millions of nerve cells that even affect mood and general wellbeing.' },
        { h2: 'Common problems' },
        { p: 'Acid reflux, gastritis, gallstones, pancreatitis and inflammatory bowel disease.' },
        { h2: 'When to see a specialist' },
        { ul: [
          'Persistent heartburn',
          'Blood in the stool',
          'Constant abdominal pain or severe bloating',
          'Loss of appetite and unexplained weight loss',
        ] },
        { h2: 'Diagnosis and prevention' },
        { p: 'Modern methods include ultrasound, endoscopy, colonoscopy and laboratory tests. Prevention rests on regular meals, fibre intake, hydration, stress management and an annual check-up.' },
      ],
      ru: [
        { p: 'Желудочно-кишечный тракт называют «вторым мозгом» — в нём сосредоточены миллионы нервных клеток, влияющих даже на настроение и общее самочувствие.' },
        { h2: 'Распространённые проблемы' },
        { p: 'Кислотный рефлюкс, гастрит, камни в желчном пузыре, панкреатит и воспалительные заболевания кишечника.' },
        { h2: 'Когда обратиться к специалисту' },
        { ul: [
          'Постоянная изжога',
          'Кровь в стуле',
          'Постоянная боль в животе или сильное вздутие',
          'Потеря аппетита и необъяснимое снижение веса',
        ] },
        { h2: 'Диагностика и профилактика' },
        { p: 'Современные методы включают УЗИ, эндоскопию, колоноскопию и лабораторные анализы. Профилактика основана на регулярном питании, потреблении клетчатки, водном балансе, управлении стрессом и ежегодном осмотре.' },
      ],
    },
  },

  // ── 12. Monitor health with lab tests ───────────────────────────────────
  {
    slug: 'monitor-your-health-with-lab-tests',
    category: 'health-tips',
    publishedDate: '2025-07-04',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/%E1%83%A1%E1%83%90%E1%83%98%E1%83%A2%E1%83%98%20%E1%83%9A%E1%83%90%E1%83%91.jpg',
    showOnHomepage: true,
    homepageOrder: 5,
    imageAlt: {
      ge: 'ლაბორატორიული ანალიზები',
      en: 'Laboratory tests',
      ru: 'Лабораторные анализы',
    },
    title: {
      ge: 'როგორ ვაკონტროლოთ ჯანმრთელობა ლაბორატორიული კვლევებით',
      en: 'How to Monitor Your Health with Lab Tests',
      ru: 'Как контролировать здоровье с помощью лабораторных исследований',
    },
    excerpt: {
      ge: 'რომელი ანალიზებია აუცილებელი სხვადასხვა ასაკში, როგორ მოვემზადოთ და რას მივაქციოთ ყურადღება.',
      en: 'Which tests matter at different ages, how to prepare and what to watch for.',
      ru: 'Какие анализы важны в разном возрасте, как подготовиться и на что обратить внимание.',
    },
    body: {
      ge: [
        { p: 'ლაბორატორიული ანალიზები ერთ-ერთი ყველაზე მარტივი და ზუსტი გზაა იმის გასაგებად, რა ხდება ორგანიზმში. ისინი ავლენენ ფარულ დარღვევებს მაშინ, როცა სიმპტომები ჯერ არ ჩანს.' },
        { h2: 'ძირითადი ჯგუფები' },
        { ul: [
          'სისხლის საერთო ანალიზი (CBC) — ანემია, ინფექციები, იმუნური აქტივობა',
          'ბიოქიმია — ღვიძლი, თირკმელი, შაქარი, ქოლესტერინი',
          'შარდის ანალიზი — საშარდე გზები და თირკმლის ფუნქცია',
          'ჰორმონები — ფარისებრი ჯირკვალი, რეპროდუქცია',
          'ვიტამინები და მიკროელემენტები — D, B12, რკინა',
        ] },
        { h2: 'ასაკის მიხედვით' },
        { ul: [
          '20–40 წ.: CBC, გლუკოზა, ლიპიდური პროფილი, TSH, ვიტამინები — წელიწადში ერთხელ',
          '40–60 წ.: დამატებით HbA1c, ღვიძლისა და თირკმლის მარკერები, PSA (მამაკაცებში)',
          '60+ წ.: ვრცელი ბიოქიმია და მონიტორინგი, ხშირად 6 თვეში ერთხელ',
        ] },
        { h2: 'როგორ მოვემზადოთ' },
        { p: 'სისხლის უმეტესი ანალიზი დილით, 8–12 საათიანი შიმშილის შემდეგ ტარდება. ჰორმონალური ტესტები ხშირად ციკლის კონკრეტულ დღეებს უკავშირდება — წინასწარ გაიარეთ კონსულტაცია ექიმთან.' },
      ],
      en: [
        { p: 'Lab tests are one of the simplest and most accurate ways to understand what is happening inside the body. They reveal hidden problems while symptoms are still absent.' },
        { h2: 'Main groups' },
        { ul: [
          'Complete blood count (CBC) — anaemia, infection, immune activity',
          'Biochemistry — liver, kidneys, glucose, cholesterol',
          'Urinalysis — urinary tract and kidney function',
          'Hormones — thyroid, reproduction',
          'Vitamins and trace elements — D, B12, iron',
        ] },
        { h2: 'By age' },
        { ul: [
          '20–40: CBC, glucose, lipid profile, TSH, vitamins — once a year',
          '40–60: add HbA1c, liver and kidney markers, PSA (in men)',
          '60+: an extended biochemistry panel and monitoring, often every 6 months',
        ] },
        { h2: 'How to prepare' },
        { p: 'Most blood tests are taken in the morning after 8–12 hours of fasting. Hormone tests are often tied to specific days of the cycle — consult your doctor in advance.' },
      ],
      ru: [
        { p: 'Лабораторные анализы — один из самых простых и точных способов понять, что происходит в организме. Они выявляют скрытые нарушения, пока симптомы ещё отсутствуют.' },
        { h2: 'Основные группы' },
        { ul: [
          'Общий анализ крови (CBC) — анемия, инфекции, иммунная активность',
          'Биохимия — печень, почки, сахар, холестерин',
          'Анализ мочи — мочевыводящие пути и функция почек',
          'Гормоны — щитовидная железа, репродукция',
          'Витамины и микроэлементы — D, B12, железо',
        ] },
        { h2: 'По возрасту' },
        { ul: [
          '20–40 лет: CBC, глюкоза, липидный профиль, TSH, витамины — раз в год',
          '40–60 лет: дополнительно HbA1c, маркеры печени и почек, PSA (у мужчин)',
          '60+ лет: расширенная биохимия и мониторинг, часто раз в 6 месяцев',
        ] },
        { h2: 'Как подготовиться' },
        { p: 'Большинство анализов крови сдаются утром после 8–12 часов голодания. Гормональные тесты часто привязаны к конкретным дням цикла — заранее проконсультируйтесь с врачом.' },
      ],
    },
  },

  // ── 13. Hypothyroidism ──────────────────────────────────────────────────
  {
    slug: 'hypothyroidism',
    category: 'medical-info',
    publishedDate: '2025-05-21',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/Image_563x320-Hypothyroidism.jpg',
    imageAlt: {
      ge: 'ფარისებრი ჯირკვალი — ჰიპოთირეოზი',
      en: 'Thyroid gland — hypothyroidism',
      ru: 'Щитовидная железа — гипотиреоз',
    },
    title: {
      ge: 'ჰიპოთირეოზი',
      en: 'Hypothyroidism',
      ru: 'Гипотиреоз',
    },
    excerpt: {
      ge: 'როდესაც ფარისებრი ჯირკვალი საკმარის ჰორმონს ვერ გამოიმუშავებს — სიმპტომები, დიაგნოსტიკა და მკურნალობა.',
      en: 'When the thyroid does not make enough hormone — symptoms, diagnosis and treatment.',
      ru: 'Когда щитовидная железа вырабатывает недостаточно гормона — симптомы, диагностика и лечение.',
    },
    body: {
      ge: [
        { p: 'ფარისებრი ჯირკვალი კისრის წინა ზედაპირზე მდებარე ენდოკრინული ორგანოა. ის გამოიმუშავებს ჰორმონებს T4 და T3, რომლებიც მეტაბოლიზმს არეგულირებენ. ჰიპოთირეოზი მაშინ ვითარდება, როცა ამ ჰორმონების დონე იკლებს.' },
        { h2: 'რისკ-ჯგუფი' },
        { p: 'უფრო ხშირია ქალებში და სიხშირე ასაკთან ერთად იზრდება, განსაკუთრებით ორსულობისა და მენოპაუზის პერიოდში.' },
        { h2: 'სიმპტომები' },
        { ul: [
          'დაღლილობა და სიცივის აუტანლობა',
          'მშრალი კანი და თმის ცვენა',
          'წონის მატება',
          'აზროვნების შენელება და კუნთების ტკივილი',
        ] },
        { h2: 'დიაგნოსტიკა და მკურნალობა' },
        { p: 'დიაგნოზი დგინდება სისხლის ანალიზით — TSH, თავისუფალი T4 და T3. მკურნალობა გულისხმობს სინთეზური თიროქსინის ყოველდღიურ მიღებას დოზის ინდივიდუალური მორგებით.' },
      ],
      en: [
        { p: 'The thyroid is an endocrine gland on the front of the neck. It produces the hormones T4 and T3, which regulate metabolism. Hypothyroidism develops when the level of these hormones falls.' },
        { h2: 'Risk group' },
        { p: 'It is more common in women and becomes more frequent with age, especially during pregnancy and menopause.' },
        { h2: 'Symptoms' },
        { ul: [
          'Fatigue and intolerance to cold',
          'Dry skin and hair loss',
          'Weight gain',
          'Slowed thinking and muscle pain',
        ] },
        { h2: 'Diagnosis and treatment' },
        { p: 'The diagnosis is made with a blood test — TSH, free T4 and T3. Treatment means taking synthetic thyroxine daily, with the dose tailored individually.' },
      ],
      ru: [
        { p: 'Щитовидная железа — эндокринный орган на передней поверхности шеи. Она вырабатывает гормоны T4 и T3, регулирующие обмен веществ. Гипотиреоз развивается, когда уровень этих гормонов снижается.' },
        { h2: 'Группа риска' },
        { p: 'Чаще встречается у женщин и учащается с возрастом, особенно во время беременности и менопаузы.' },
        { h2: 'Симптомы' },
        { ul: [
          'Усталость и непереносимость холода',
          'Сухая кожа и выпадение волос',
          'Набор веса',
          'Замедление мышления и боль в мышцах',
        ] },
        { h2: 'Диагностика и лечение' },
        { p: 'Диагноз ставится по анализу крови — TSH, свободный T4 и T3. Лечение заключается в ежедневном приёме синтетического тироксина с индивидуальным подбором дозы.' },
      ],
    },
  },

  // ── 14. Cervical cancer ─────────────────────────────────────────────────
  {
    slug: 'cervical-cancer-prevention',
    category: 'medical-info',
    publishedDate: '2025-01-23',
    imageUrl: 'https://www.khozrevanidze.ge/storage/WhatsApp%20Image%202025-01-23%20at%2012.20.54_39257ea5.jpg',
    imageAlt: {
      ge: 'საშვილოსნოს ყელის კიბოს პრევენცია',
      en: 'Cervical cancer prevention',
      ru: 'Профилактика рака шейки матки',
    },
    title: {
      ge: 'საშვილოსნოს ყელის კიბო',
      en: 'Cervical Cancer',
      ru: 'Рак шейки матки',
    },
    excerpt: {
      ge: 'შემთხვევათა უმრავლესობა შესაძლებელია თავიდან იქნას აცილებული კიბოსწინა პათოლოგიების დროული გამოვლენით.',
      en: 'Most cases can be prevented by detecting pre-cancerous changes early.',
      ru: 'Большинство случаев можно предотвратить ранним выявлением предраковых изменений.',
    },
    body: {
      ge: [
        { p: 'საშვილოსნოს ყელის კიბო ვითარდება საშვილოსნოს ყელის ეპითელიუმის ავთვისებიანი ტრანსფორმაციის შედეგად. შემთხვევათა 70%-ზე მეტი ადამიანის პაპილომავირუსის (HPV) მაღალი რისკის შტამებს — მე-16 და მე-18-ს — უკავშირდება.' },
        { h2: 'რისკფაქტორები' },
        { ul: [
          'მრავალი სქესობრივი პარტნიორი და სქესობრივი ცხოვრების ადრეული დაწყება',
          'სქესობრივი გზით გადამდები ინფექციები',
          'დაბალი იმუნიტეტი და მწეველობა',
        ] },
        { h2: 'სიმპტომები' },
        { ul: [
          'სისხლიანი გამონადენი სქესობრივი კავშირის შემდეგ',
          'უსიამოვნო სუნის მქონე გამონადენი',
          'ტკივილი მუცლის ქვედა არეში',
        ] },
        { h2: 'პრევენცია და დიაგნოსტიკა' },
        { p: 'რეგულარული გინეკოლოგიური შემოწმება, PAP-ციტოლოგია, მაღალი რისკის HPV დნმ-ტესტი, კოლპოსკოპია და ვაქცინაცია. ადეკვატური სკრინინგის პირობებში დაავადების სიხშირე დაბალია.' },
      ],
      en: [
        { p: 'Cervical cancer develops from the malignant transformation of the cervical epithelium. More than 70% of cases are linked to high-risk strains of human papillomavirus (HPV) — types 16 and 18.' },
        { h2: 'Risk factors' },
        { ul: [
          'Multiple sexual partners and an early start to sexual activity',
          'Sexually transmitted infections',
          'Low immunity and smoking',
        ] },
        { h2: 'Symptoms' },
        { ul: [
          'Bleeding after intercourse',
          'Discharge with an unpleasant odour',
          'Pain in the lower abdomen',
        ] },
        { h2: 'Prevention and diagnosis' },
        { p: 'Regular gynaecological examinations, PAP cytology, a high-risk HPV DNA test, colposcopy and vaccination. With adequate screening, the incidence of the disease is low.' },
      ],
      ru: [
        { p: 'Рак шейки матки развивается в результате злокачественной трансформации эпителия шейки матки. Более 70% случаев связаны с высокоонкогенными штаммами вируса папилломы человека (ВПЧ) — типами 16 и 18.' },
        { h2: 'Факторы риска' },
        { ul: [
          'Множество половых партнёров и раннее начало половой жизни',
          'Инфекции, передающиеся половым путём',
          'Сниженный иммунитет и курение',
        ] },
        { h2: 'Симптомы' },
        { ul: [
          'Кровянистые выделения после полового акта',
          'Выделения с неприятным запахом',
          'Боль внизу живота',
        ] },
        { h2: 'Профилактика и диагностика' },
        { p: 'Регулярные гинекологические осмотры, PAP-цитология, ДНК-тест на высокоонкогенный ВПЧ, кольпоскопия и вакцинация. При адекватном скрининге заболеваемость низкая.' },
      ],
    },
  },

  // ── 15. Co-financing programmes (announcement) ──────────────────────────
  {
    slug: 'healthcare-co-financing-programs',
    category: 'announcements',
    publishedDate: '2025-06-05',
    imageUrl: 'https://www.khozrevanidze.ge/storage/news/%E1%83%A1%E1%83%90%E1%83%98%E1%83%A2%E1%83%98%E1%83%A1.jpg',
    imageAlt: {
      ge: 'სამედიცინო თანადაფინანსების პროგრამები',
      en: 'Healthcare co-financing programmes',
      ru: 'Программы софинансирования медицинских услуг',
    },
    title: {
      ge: 'სამედიცინო მომსახურების თანადაფინანსების პროგრამები',
      en: 'Healthcare Co-Financing Programmes',
      ru: 'Программы софинансирования медицинских услуг',
    },
    excerpt: {
      ge: 'ხოზრევანიძის კლინიკა მონაწილეობს სახელმწიფო, აჭარის რეგიონულ და ბათუმის მუნიციპალურ დაფინანსების პროგრამებში.',
      en: 'Khozrevanidze Clinic participates in national, Adjara regional and Batumi municipal funding programmes.',
      ru: 'Клиника Хозреванидзе участвует в государственных, региональных (Аджария) и муниципальных (Батуми) программах финансирования.',
    },
    body: {
      ge: [
        { p: 'ხოზრევანიძის კლინიკა მონაწილეობს რამდენიმე ჯანდაცვის დაფინანსების ინიციატივაში, რათა მკურნალობა უფრო ხელმისაწვდომი გახდეს.' },
        { h2: 'საყოველთაო ჯანდაცვა' },
        { p: 'ფინანსდება გეგმიური ქირურგიული მომსახურება: ზოგადი ქირურგია, გინეკოლოგია, ოტორინოლარინგოლოგია, ბავშვთა ქირურგია, ტრავმატოლოგია, უროლოგია, ოფთალმოლოგია და ნეიროქირურგია, ასევე CT სამიზნე ჯგუფებისთვის.' },
        { h2: 'აჭარის რეგიონული პროგრამები' },
        { p: 'ინდივიდუალური სამედიცინო დახმარება, კარდიოქირურგია, სახსრების ენდოპროთეზირება, გაძლიერებული მხარდაჭერა ონკოპაციენტებისთვის და მაღალტექნოლოგიური დიაგნოსტიკა (CT, MRI, ანგიოგრაფია).' },
        { h2: 'ბათუმის მუნიციპალური პროგრამები' },
        { p: 'CT/MRI კვლევები, კოლონოსკოპია, გასტროსკოპია, კორონაროგრაფია და გეგმიური ოპერაციების თანადაფინანსება ინდივიდუალური დახმარების საჭიროების მქონე მოქალაქეებისთვის.' },
        { p: 'დეტალური ინფორმაციისთვის დაუკავშირდით კლინიკის რეგისტრატურას.' },
      ],
      en: [
        { p: 'Khozrevanidze Clinic takes part in several healthcare funding initiatives to make treatment more accessible.' },
        { h2: 'Universal healthcare' },
        { p: 'Planned surgical services are funded: general surgery, gynaecology, otolaryngology, paediatric surgery, traumatology, urology, ophthalmology and neurosurgery, as well as CT imaging for target groups.' },
        { h2: 'Adjara regional programmes' },
        { p: 'Individual medical assistance, cardiac surgery, joint endoprosthesis, enhanced support for cancer patients and high-tech diagnostics (CT, MRI, angiography).' },
        { h2: 'Batumi municipal programmes' },
        { p: 'CT/MRI studies, colonoscopy, gastroscopy, coronary angiography and co-financing of planned operations for citizens who qualify for individual assistance.' },
        { p: 'For details, please contact the clinic’s reception desk.' },
      ],
      ru: [
        { p: 'Клиника Хозреванидзе участвует в нескольких инициативах финансирования здравоохранения, чтобы сделать лечение более доступным.' },
        { h2: 'Всеобщее здравоохранение' },
        { p: 'Финансируются плановые хирургические услуги: общая хирургия, гинекология, оториноларингология, детская хирургия, травматология, урология, офтальмология и нейрохирургия, а также КТ для целевых групп.' },
        { h2: 'Региональные программы Аджарии' },
        { p: 'Индивидуальная медицинская помощь, кардиохирургия, эндопротезирование суставов, усиленная поддержка онкопациентов и высокотехнологичная диагностика (КТ, МРТ, ангиография).' },
        { h2: 'Муниципальные программы Батуми' },
        { p: 'Исследования КТ/МРТ, колоноскопия, гастроскопия, коронарография и софинансирование плановых операций для граждан, имеющих право на индивидуальную помощь.' },
        { p: 'За подробностями обращайтесь в регистратуру клиники.' },
      ],
    },
  },
]
