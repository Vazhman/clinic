// Starter templates: one-click article layouts built from our blocks, each
// pre-filled with REAL per-locale scaffold copy (ge / en / ru) and image
// PLACEHOLDERS (the editor clicks a placeholder to choose a real image).
//
// The scaffold text is short editorial guidance in each language — the editor
// replaces it with the real article. Because the copy differs per locale, a
// Georgian editor sees Georgian prompts, an English editor English, etc.
//
// Each entry is an array of plain { type, props } nodes matching the block
// configs; fresh unique ids are assigned at insert time (see TemplatesMenu).

import type { JSONContent } from './tiptap'
import type { Loc } from './types'

// ---- locale + doc helpers --------------------------------------------------

const tri = (ge: string, en: string, ru: string): Loc<string> => ({ ge, en, ru })

const para = (text: string): JSONContent => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const doc = (...texts: string[]): JSONContent => ({ type: 'doc', content: texts.map(para) })

// Per-locale rich text: pass the paragraphs for each language.
const triRich = (ge: string[], en: string[], ru: string[]): Loc<JSONContent> => ({
  ge: doc(...ge),
  en: doc(...en),
  ru: doc(...ru),
})

// ---- block builders --------------------------------------------------------

export type TplNode = { type: string; props: Record<string, unknown> }

const heading = (text: Loc<string>, level: 'h2' | 'h3' = 'h2'): TplNode => ({
  type: 'Heading',
  props: { level, text },
})

const richText = (content: Loc<JSONContent>): TplNode => ({ type: 'RichText', props: { content } })

const image = (
  align: 'left' | 'center' | 'right' | 'full' = 'center',
  width = 100,
): TplNode => ({
  type: 'Image',
  props: { media: null, align, width, caption: {}, radius: 'lg', shadow: 'none' },
})

const button = (
  label: Loc<string>,
  variant: 'primary' | 'pink' | 'white' | 'secondary' = 'primary',
  href = '/booking',
): TplNode => ({ type: 'Button', props: { label, href, variant } })

const quote = (text: Loc<string>, attribution: Loc<string>): TplNode => ({
  type: 'Quote',
  props: { text, attribution },
})

const callout = (variant: 'note' | 'warning' | 'tip', content: Loc<JSONContent>): TplNode => ({
  type: 'Callout',
  props: { variant, content },
})

const gallery = (count: number, columns: 2 | 3 | 4 = 3): TplNode => ({
  type: 'Gallery',
  props: { images: Array.from({ length: count }, () => ({ media: null })), columns },
})

const row = (
  columns: number,
  content: TplNode[],
  gap: 'sm' | 'md' | 'lg' = 'lg',
  valign: 'top' | 'center' = 'top',
): TplNode => ({ type: 'Row', props: { columns, gap, valign, content } })

const section = (
  background: 'none' | 'cream' | 'pink' | 'blackberry',
  content: TplNode[],
  align: 'left' | 'center' = 'left',
): TplNode => ({ type: 'Section', props: { background, align, content } })

const divider = (): TplNode => ({ type: 'Divider', props: {} })

const imageText = (
  imageSide: 'left' | 'right',
  ratio: '1-1' | '1-2' | '2-1',
  text: TplNode[],
): TplNode => ({
  type: 'ImageText',
  props: { image: [image('full', 100)], text, imageSide, layout: 'columns', ratio },
})

// ---- the CTA every clinic article ends on ----------------------------------

const bookCta = button(tri('დაჯავშნე ვიზიტი', 'Book a visit', 'Записаться на приём'), 'primary', '/booking')

// ---- templates -------------------------------------------------------------

export type Template = { id: string; label: string; description: string; blocks: TplNode[] }

export const TEMPLATES: Template[] = [
  // 1 ── Condition / procedure explainer (the workhorse clinic article) ───────
  {
    id: 'medical-explainer',
    label: '🩺 სამედიცინო ახსნა (Condition explainer)',
    description: 'მდგომარეობა ან პროცედურა: შესავალი, სიმპტომები, მკურნალობა, CTA',
    blocks: [
      heading(tri('რა არის [მდგომარეობა]?', 'What is [condition]?', 'Что такое [состояние]?')),
      image('center', 100),
      richText(
        triRich(
          ['აქ დაწერეთ მოკლე, გასაგები შესავალი — რა არის ეს მდგომარეობა და რატომ აქვს მნიშვნელობა პაციენტისთვის.'],
          ['Write a short, clear introduction here — what the condition is and why it matters to the patient.'],
          ['Напишите краткое и понятное введение — что это за состояние и почему оно важно для пациента.'],
        ),
      ),
      heading(tri('სიმპტომები და ნიშნები', 'Symptoms & signs', 'Симптомы и признаки'), 'h3'),
      richText(
        triRich(
          ['ჩამოთვალეთ ძირითადი სიმპტომები მარტივი ენით. შეგიძლიათ გამოიყენოთ მოკლე წინადადებები.'],
          ['List the main symptoms in plain language. Short sentences work best.'],
          ['Перечислите основные симптомы простым языком. Лучше короткими предложениями.'],
        ),
      ),
      heading(tri('დიაგნოსტიკა და მკურნალობა', 'Diagnosis & treatment', 'Диагностика и лечение'), 'h3'),
      richText(
        triRich(
          ['აღწერეთ როგორ ისმება დიაგნოზი და რა მკურნალობას სთავაზობს კლინიკა.'],
          ['Describe how it is diagnosed and what treatment the clinic offers.'],
          ['Опишите, как ставится диагноз и какое лечение предлагает клиника.'],
        ),
      ),
      callout(
        'warning',
        triRich(
          ['როდის მივმართოთ ექიმს: თუ სიმპტომები გრძელდება ან ძლიერდება, არ დააყოვნოთ — გაიარეთ კონსულტაცია.'],
          ['When to see a doctor: if symptoms persist or worsen, don’t wait — book a consultation.'],
          ['Когда обратиться к врачу: если симптомы сохраняются или усиливаются — не откладывайте консультацию.'],
        ),
      ),
      bookCta,
    ],
  },

  // 2 ── Clinic news / announcement ───────────────────────────────────────────
  {
    id: 'news-announcement',
    label: '📣 კლინიკის სიახლე (Announcement)',
    description: 'ფერადი ჰერო + სურათი + ტექსტი + ფაქტები + CTA',
    blocks: [
      section(
        'blackberry',
        [
          richText(triRich(['სიახლე'], ['News'], ['Новость'])),
          heading(tri('ახალი სერვისი / აღჭურვილობა კლინიკაში', 'New service / equipment at the clinic', 'Новая услуга / оборудование в клинике')),
          richText(
            triRich(
              ['ერთი წინადადებით — რა შეიცვალა და რას ნიშნავს ეს პაციენტებისთვის.'],
              ['In one sentence — what changed and what it means for patients.'],
              ['Одним предложением — что изменилось и что это значит для пациентов.'],
            ),
          ),
        ],
        'center',
      ),
      image('center', 100),
      richText(
        triRich(
          ['დაწერეთ დეტალები: როდიდან არის ხელმისაწვდომი, ვის ეხება, რა უპირატესობა აქვს.'],
          ['Write the details: when it’s available, who it’s for, and the benefits.'],
          ['Напишите детали: с какого момента доступно, для кого и в чём преимущества.'],
        ),
      ),
      callout(
        'note',
        triRich(
          ['მთავარი ფაქტები: • ხელმისაწვდომია [თარიღი]-დან  • განყოფილება: [სახელი]  • ჩაწერა: ტელეფონით ან ონლაინ.'],
          ['Key facts: • Available from [date]  • Department: [name]  • Booking: by phone or online.'],
          ['Ключевые факты: • Доступно с [дата]  • Отделение: [название]  • Запись: по телефону или онлайн.'],
        ),
      ),
      bookCta,
    ],
  },

  // 3 ── Doctor spotlight / interview ─────────────────────────────────────────
  {
    id: 'doctor-spotlight',
    label: '👩‍⚕️ ექიმის პორტრეტი (Doctor spotlight)',
    description: 'ფოტო + ბიო, ციტატა, კითხვა-პასუხი, ჯავშნის CTA',
    blocks: [
      heading(tri('გაიცანით ჩვენი ექიმი', 'Meet our doctor', 'Знакомьтесь — наш врач')),
      imageText('left', '1-1', [
        heading(tri('[ექიმის სახელი, გვარი]', '[Doctor’s full name]', '[Имя и фамилия врача]'), 'h3'),
        richText(
          triRich(
            ['სპეციალობა, გამოცდილების წლები და ძირითადი მიმართულებები — მოკლედ.'],
            ['Specialty, years of experience and main focus areas — briefly.'],
            ['Специальность, стаж и основные направления — кратко.'],
          ),
        ),
      ]),
      section(
        'pink',
        [
          quote(
            tri(
              '„დაამატეთ ექიმის შთამბეჭდავი ციტატა მათი მიდგომის ან ფილოსოფიის შესახებ.“',
              '“Add an impactful quote from the doctor about their approach or philosophy.”',
              '«Добавьте яркую цитату врача о его подходе или философии.»',
            ),
            tri('[ექიმის სახელი]', '[Doctor’s name]', '[Имя врача]'),
          ),
        ],
        'center',
      ),
      heading(tri('კითხვა: [დასვით კითხვა]', 'Q: [Ask a question]', 'В: [Задайте вопрос]'), 'h3'),
      richText(
        triRich(
          ['პასუხი: ჩაწერეთ ექიმის პასუხი მარტივი, თბილი ტონით.'],
          ['A: Write the doctor’s answer in a simple, warm tone.'],
          ['О: Напишите ответ врача простым, тёплым тоном.'],
        ),
      ),
      heading(tri('კითხვა: [კიდევ ერთი კითხვა]', 'Q: [Another question]', 'В: [Ещё один вопрос]'), 'h3'),
      richText(
        triRich(['პასუხი: ...'], ['A: ...'], ['О: ...']),
      ),
      button(tri('დაჯავშნე ამ ექიმთან', 'Book with this doctor', 'Записаться к врачу'), 'primary', '/booking'),
    ],
  },

  // 4 ── Health tips listicle ─────────────────────────────────────────────────
  {
    id: 'health-tips',
    label: '💡 ჯანმრთელობის რჩევები (Health tips)',
    description: 'შესავალი + სამი რჩევის ბარათი + რჩევა + CTA',
    blocks: [
      heading(tri('[N] რჩევა ჯანმრთელობისთვის', '[N] tips for your health', '[N] советов для здоровья')),
      image('center', 100),
      richText(
        triRich(
          ['მოკლე შესავალი — რატომ არის ეს თემა მნიშვნელოვანი.'],
          ['A short intro — why this topic matters.'],
          ['Краткое введение — почему эта тема важна.'],
        ),
      ),
      row(3, [
        section('cream', [
          heading(tri('1. პირველი რჩევა', '1. First tip', '1. Первый совет'), 'h3'),
          richText(triRich(['მოკლე ახსნა.'], ['A short explanation.'], ['Краткое пояснение.'])),
        ]),
        section('pink', [
          heading(tri('2. მეორე რჩევა', '2. Second tip', '2. Второй совет'), 'h3'),
          richText(triRich(['მოკლე ახსნა.'], ['A short explanation.'], ['Краткое пояснение.'])),
        ]),
        section('cream', [
          heading(tri('3. მესამე რჩევა', '3. Third tip', '3. Третий совет'), 'h3'),
          richText(triRich(['მოკლე ახსნა.'], ['A short explanation.'], ['Краткое пояснение.'])),
        ]),
      ]),
      callout(
        'tip',
        triRich(
          ['რეგულარული პროფილაქტიკური შემოწმება ეხმარება პრობლემების ადრეულ აღმოჩენას.'],
          ['Regular preventive check-ups help catch problems early.'],
          ['Регулярные профилактические осмотры помогают выявлять проблемы на ранней стадии.'],
        ),
      ),
      bookCta,
    ],
  },

  // 5 ── Patient story / testimonial ──────────────────────────────────────────
  {
    id: 'patient-story',
    label: '❤️ პაციენტის ისტორია (Patient story)',
    description: 'დიდი ციტატა, ისტორია სურათით, CTA',
    blocks: [
      heading(tri('პაციენტის ისტორია', 'A patient’s story', 'История пациента')),
      section(
        'pink',
        [
          quote(
            tri(
              '„დაამატეთ პაციენტის რეალური სიტყვები მათი გამოცდილების შესახებ (ნებართვით).“',
              '“Add the patient’s own words about their experience (with permission).”',
              '«Добавьте слова пациента о его опыте (с разрешения).»',
            ),
            tri('— [სახელი], [ასაკი/ქალაქი]', '— [Name], [age/city]', '— [Имя], [возраст/город]'),
          ),
        ],
        'center',
      ),
      imageText('right', '1-1', [
        richText(
          triRich(
            ['მოჰყევით ისტორია: რა იყო პრობლემა, როგორ დაეხმარა კლინიკა, რა შედეგი მიიღო პაციენტმა.'],
            ['Tell the story: what the problem was, how the clinic helped, and the outcome.'],
            ['Расскажите историю: в чём была проблема, как помогла клиника и каков результат.'],
          ),
        ),
      ]),
      callout(
        'note',
        triRich(
          ['შენიშვნა: გამოაქვეყნეთ პაციენტის ისტორია/ფოტო მხოლოდ წერილობითი თანხმობით.'],
          ['Note: publish a patient’s story/photo only with written consent.'],
          ['Примечание: публикуйте историю/фото пациента только с письменного согласия.'],
        ),
      ),
      bookCta,
    ],
  },

  // 6 ── FAQ / Q&A article ────────────────────────────────────────────────────
  {
    id: 'faq-article',
    label: '❓ კითხვა-პასუხი (FAQ)',
    description: 'ხშირად დასმული კითხვები, თითო სათაური + პასუხი',
    blocks: [
      heading(tri('ხშირად დასმული კითხვები', 'Frequently asked questions', 'Часто задаваемые вопросы')),
      richText(
        triRich(
          ['მოკლე შესავალი თემაზე, რომელსაც კითხვები ეხება.'],
          ['A short intro to the topic these questions cover.'],
          ['Краткое введение в тему, которую охватывают вопросы.'],
        ),
      ),
      divider(),
      heading(tri('[კითხვა 1]', '[Question 1]', '[Вопрос 1]'), 'h3'),
      richText(triRich(['პასუხი...'], ['Answer…'], ['Ответ…'])),
      heading(tri('[კითხვა 2]', '[Question 2]', '[Вопрос 2]'), 'h3'),
      richText(triRich(['პასუხი...'], ['Answer…'], ['Ответ…'])),
      heading(tri('[კითხვა 3]', '[Question 3]', '[Вопрос 3]'), 'h3'),
      richText(triRich(['პასუხი...'], ['Answer…'], ['Ответ…'])),
      callout(
        'tip',
        triRich(
          ['ვერ იპოვეთ პასუხი? დაგვიკავშირდით — სიამოვნებით დაგეხმარებით.'],
          ['Didn’t find your answer? Contact us — we’re happy to help.'],
          ['Не нашли ответ? Свяжитесь с нами — мы рады помочь.'],
        ),
      ),
      bookCta,
    ],
  },

  // 7 ── Photo story / gallery feature ────────────────────────────────────────
  {
    id: 'photo-story',
    label: '📸 ფოტო-ისტორია (Photo story)',
    description: 'შესავალი, სურათების ბადე, სურათი + ტექსტი, CTA',
    blocks: [
      heading(tri('ფოტო-ისტორია: [სათაური]', 'Photo story: [title]', 'Фоторепортаж: [заголовок]')),
      richText(
        triRich(
          ['მოკლედ აღწერეთ, რას ხედავს მკითხველი ფოტოებზე.'],
          ['Briefly describe what the reader sees in the photos.'],
          ['Кратко опишите, что читатель видит на фотографиях.'],
        ),
      ),
      gallery(6, 3),
      imageText('left', '1-1', [
        heading(tri('დეტალი / მომენტი', 'A detail / moment', 'Деталь / момент'), 'h3'),
        richText(
          triRich(
            ['ერთი ფოტოს ირგვლივ ააგეთ მცირე ისტორია.'],
            ['Build a short story around one photo.'],
            ['Постройте небольшую историю вокруг одного фото.'],
          ),
        ),
      ]),
      bookCta,
    ],
  },

  // 8 ── Simple article (minimal, fast) ───────────────────────────────────────
  {
    id: 'simple-article',
    label: '📝 მარტივი სტატია (Simple article)',
    description: 'სათაური, ტექსტი, სურათი, ციტატა — სწრაფი დასაწყისი',
    blocks: [
      heading(tri('სტატიის სათაური', 'Article title', 'Заголовок статьи')),
      richText(
        triRich(
          ['შესავალი აბზაცი — დააინტერესეთ მკითხველი პირველი ორი წინადადებით.', 'მეორე აბზაცი — განავითარეთ ძირითადი აზრი.'],
          ['Intro paragraph — hook the reader in the first two sentences.', 'Second paragraph — develop the main idea.'],
          ['Вступительный абзац — заинтересуйте читателя первыми двумя предложениями.', 'Второй абзац — раскройте основную мысль.'],
        ),
      ),
      image('center', 75),
      richText(
        triRich(
          ['გააგრძელეთ ტექსტი სურათის შემდეგ.'],
          ['Continue the text after the image.'],
          ['Продолжите текст после изображения.'],
        ),
      ),
      quote(
        tri('„დაამატეთ შესაბამისი ციტატა.“', '“Add a relevant quote.”', '«Добавьте подходящую цитату.»'),
        tri('— წყარო', '— Source', '— Источник'),
      ),
    ],
  },
]
