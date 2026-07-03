// Demo lab-test library — 15 common tests offered by Georgian clinics,
// written in the Mayo-Clinic "tests & procedures" style (overview / why it's
// done / preparation / what to expect / interpretation). Authored in ge/en/ru.
//
// Cross-links between tests are declared by slug (`relatedTestSlugs`) and
// resolved to relationships after all rows are created. `published: true`
// so they appear on /lab-tests immediately.
import type { LabTestSeed } from './types'

export const labTestsSeed: LabTestSeed[] = [
  // ── 1. Complete Blood Count ─────────────────────────────────────────────
  {
    slug: 'complete-blood-count',
    category: 'hematology',
    published: true,
    relatedTestSlugs: ['ferritin', 'c-reactive-protein', 'vitamin-b12-test'],
    aliases: { ge: ['CBC', 'ჰემოგრამა', 'სისხლის საერთო ანალიზი'], en: ['CBC', 'Full blood count', 'FBC'], ru: ['ОАК', 'Гемограмма', 'Общий анализ крови'] },
    title: { ge: 'სისხლის საერთო ანალიზი (CBC)', en: 'Complete Blood Count (CBC)', ru: 'Общий анализ крови (ОАК)' },
    summary: {
      ge: 'ფართოდ გავრცელებული სკრინინგ-ტესტი, რომელიც აფასებს სისხლის წითელ და თეთრ უჯრედებსა და თრომბოციტებს.',
      en: 'A widely used screening test that evaluates red cells, white cells and platelets in the blood.',
      ru: 'Широко применяемый скрининговый тест, оценивающий эритроциты, лейкоциты и тромбоциты крови.',
    },
    overview: {
      ge: [{ p: 'სისხლის საერთო ანალიზი ზომავს სისხლის წითელი უჯრედების, ჰემოგლობინის, თეთრი უჯრედებისა და თრომბოციტების რაოდენობას. ეს ერთ-ერთი ყველაზე ხშირად დანიშნული ტესტია, რომელიც ზოგად სურათს იძლევა ჯანმრთელობის მდგომარეობაზე.' }],
      en: [{ p: 'A complete blood count measures the numbers of red blood cells, haemoglobin, white blood cells and platelets. It is one of the most commonly ordered tests and gives a broad picture of overall health.' }],
      ru: [{ p: 'Общий анализ крови измеряет количество эритроцитов, гемоглобина, лейкоцитов и тромбоцитов. Это один из самых часто назначаемых тестов, дающий общую картину состояния здоровья.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება პროფილაქტიკური შემოწმებისას, ანემიის, ინფექციის ან ანთების ეჭვისას, ასევე მკურნალობის მონიტორინგისთვის.' }],
      en: [{ p: 'It is ordered for routine check-ups, when anaemia, infection or inflammation is suspected, and to monitor treatment.' }],
      ru: [{ p: 'Назначается при профилактических осмотрах, при подозрении на анемию, инфекцию или воспаление, а также для контроля лечения.' }],
    },
    preparation: {
      ge: [{ p: 'სპეციალური მომზადება, როგორც წესი, საჭირო არ არის. თუ იმავე აღებისას სხვა ანალიზებიც ტარდება (მაგ. გლუკოზა), შესაძლოა შიმშილი დაგჭირდეთ — დააზუსტეთ ექიმთან.' }],
      en: [{ p: 'No special preparation is usually needed. If other tests are taken from the same sample (e.g. glucose), fasting may be required — check with your doctor.' }],
      ru: [{ p: 'Специальная подготовка обычно не требуется. Если из той же пробы берут другие анализы (например, глюкозу), может потребоваться голодание — уточните у врача.' }],
    },
    whatToExpect: {
      ge: [{ p: 'სისხლი იღება ვენიდან, პროცედურა რამდენიმე წუთს გრძელდება. შესაძლოა მცირე დისკომფორტი ან სისხლჩაქცევა აღების ადგილზე.' }],
      en: [{ p: 'Blood is drawn from a vein and the procedure takes a few minutes. You may feel mild discomfort or get a small bruise at the puncture site.' }],
      ru: [{ p: 'Кровь берут из вены, процедура занимает несколько минут. Возможен лёгкий дискомфорт или небольшой синяк в месте прокола.' }],
    },
    interpretation: {
      ge: [{ p: 'დაბალი ჰემოგლობინი ანემიაზე მიუთითებს; მომატებული თეთრი უჯრედები — ინფექციაზე ან ანთებაზე; თრომბოციტების ცვლილება — შედედების დარღვევაზე. შედეგი ყოველთვის უნდა შეფასდეს ექიმის მიერ, კლინიკურ სურათთან ერთად.' }],
      en: [{ p: 'Low haemoglobin suggests anaemia; raised white cells suggest infection or inflammation; abnormal platelets point to clotting issues. Results should always be interpreted by a doctor alongside the clinical picture.' }],
      ru: [{ p: 'Низкий гемоглобин указывает на анемию; повышенные лейкоциты — на инфекцию или воспаление; изменение тромбоцитов — на нарушения свёртывания. Результат всегда должен оценивать врач вместе с клинической картиной.' }],
    },
  },

  // ── 2. Blood glucose ────────────────────────────────────────────────────
  {
    slug: 'blood-glucose',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['glycated-hemoglobin-hba1c', 'lipid-profile'],
    aliases: { ge: ['შაქარი სისხლში', 'გლუკოზა', 'უზმოზე გლუკოზა'], en: ['Fasting glucose', 'Blood sugar', 'FPG'], ru: ['Сахар крови', 'Глюкоза', 'Глюкоза натощак'] },
    title: { ge: 'სისხლში გლუკოზა (უზმოზე)', en: 'Blood Glucose (Fasting)', ru: 'Глюкоза крови (натощак)' },
    summary: {
      ge: 'ზომავს სისხლში შაქრის დონეს — დიაბეტისა და პრედიაბეტის ძირითადი სკრინინგ-ტესტი.',
      en: 'Measures the sugar level in the blood — the key screening test for diabetes and prediabetes.',
      ru: 'Измеряет уровень сахара в крови — основной скрининговый тест на диабет и преддиабет.',
    },
    overview: {
      ge: [{ p: 'გლუკოზა ორგანიზმის ენერგიის მთავარი წყაროა. უზმოზე გლუკოზის ანალიზი აჩვენებს, რამდენად ეფექტურად არეგულირებს ორგანიზმი შაქრის დონეს.' }],
      en: [{ p: 'Glucose is the body’s main source of energy. A fasting glucose test shows how effectively the body regulates blood sugar.' }],
      ru: [{ p: 'Глюкоза — главный источник энергии организма. Анализ глюкозы натощак показывает, насколько эффективно организм регулирует уровень сахара.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება დიაბეტის სკრინინგისთვის, რისკ-ჯგუფებში (ჭარბი წონა, ოჯახური ანამნეზი), ასევე სიმპტომების — წყურვილის, ხშირი შარდვის, დაღლილობის — დროს.' }],
      en: [{ p: 'It is used to screen for diabetes, in at-risk groups (overweight, family history) and when symptoms such as thirst, frequent urination or fatigue are present.' }],
      ru: [{ p: 'Назначается для скрининга диабета, в группах риска (избыточный вес, семейный анамнез), а также при симптомах — жажде, частом мочеиспускании, усталости.' }],
    },
    preparation: {
      ge: [{ p: 'საჭიროა 8–12 საათიანი შიმშილი. ნებადართულია წყლის დალევა. ანალიზი, როგორც წესი, დილით ტარდება.' }],
      en: [{ p: 'Fasting for 8–12 hours is required. Water is allowed. The test is usually done in the morning.' }],
      ru: [{ p: 'Требуется голодание 8–12 часов. Воду пить можно. Анализ обычно проводят утром.' }],
    },
    whatToExpect: {
      ge: [{ p: 'სისხლი იღება ვენიდან. პროცედურა სწრაფი და უმტკივნელოა.' }],
      en: [{ p: 'Blood is drawn from a vein. The procedure is quick and nearly painless.' }],
      ru: [{ p: 'Кровь берут из вены. Процедура быстрая и почти безболезненная.' }],
    },
    interpretation: {
      ge: [{ p: 'უზმოზე ნორმად ითვლება 3.9–5.5 მმოლ/ლ. 5.6–6.9 — პრედიაბეტი; 7.0 და მეტი — შესაძლო დიაბეტი, რაც დასტურს საჭიროებს. ინტერპრეტაცია ენდოკრინოლოგმა უნდა გააკეთოს.' }],
      en: [{ p: 'A fasting value of 3.9–5.5 mmol/L is considered normal. 5.6–6.9 indicates prediabetes; 7.0 or above suggests possible diabetes and needs confirmation. Interpretation should be done by an endocrinologist.' }],
      ru: [{ p: 'Натощак нормой считается 3,9–5,5 ммоль/л. 5,6–6,9 — преддиабет; 7,0 и выше — возможный диабет, требующий подтверждения. Интерпретацию должен проводить эндокринолог.' }],
    },
  },

  // ── 3. HbA1c ────────────────────────────────────────────────────────────
  {
    slug: 'glycated-hemoglobin-hba1c',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['blood-glucose', 'lipid-profile'],
    aliases: { ge: ['HbA1c', 'გლიკირებული ჰემოგლობინი', 'A1c'], en: ['HbA1c', 'A1c', 'Glycohaemoglobin'], ru: ['HbA1c', 'Гликированный гемоглобин', 'A1c'] },
    title: { ge: 'გლიკირებული ჰემოგლობინი (HbA1c)', en: 'Glycated Haemoglobin (HbA1c)', ru: 'Гликированный гемоглобин (HbA1c)' },
    summary: {
      ge: 'აჩვენებს სისხლში შაქრის საშუალო დონეს ბოლო 2–3 თვის განმავლობაში.',
      en: 'Shows the average blood-sugar level over the past 2–3 months.',
      ru: 'Показывает средний уровень сахара в крови за последние 2–3 месяца.',
    },
    overview: {
      ge: [{ p: 'HbA1c ასახავს, ჰემოგლობინის რა ნაწილია „შაქართან" შეერთებული. რაც მაღალია მაჩვენებელი, მით უარესია გლუკოზის გრძელვადიანი კონტროლი.' }],
      en: [{ p: 'HbA1c reflects what proportion of haemoglobin is bound to sugar. The higher the value, the poorer the long-term control of glucose.' }],
      ru: [{ p: 'HbA1c отражает, какая доля гемоглобина связана с сахаром. Чем выше показатель, тем хуже долгосрочный контроль глюкозы.' }],
    },
    whyDone: {
      ge: [{ p: 'გამოიყენება დიაბეტის დიაგნოსტიკისა და, რაც მთავარია, მკურნალობის ეფექტურობის გრძელვადიანი მონიტორინგისთვის.' }],
      en: [{ p: 'It is used to diagnose diabetes and, above all, to monitor the long-term effectiveness of treatment.' }],
      ru: [{ p: 'Используется для диагностики диабета и, главное, для долгосрочного контроля эффективности лечения.' }],
    },
    preparation: {
      ge: [{ p: 'შიმშილი საჭირო არ არის — ანალიზი დღის ნებისმიერ მონაკვეთში შეიძლება ჩატარდეს.' }],
      en: [{ p: 'No fasting is needed — the test can be taken at any time of day.' }],
      ru: [{ p: 'Голодание не требуется — анализ можно сдавать в любое время суток.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ჩვეულებრივი ვენური სისხლის აღება, რამდენიმე წუთში.' }],
      en: [{ p: 'A standard venous blood draw, completed in a few minutes.' }],
      ru: [{ p: 'Обычный забор венозной крови, занимает несколько минут.' }],
    },
    interpretation: {
      ge: [{ p: 'ნორმად ითვლება 5.7%-ზე ნაკლები; 5.7–6.4% — პრედიაბეტი; 6.5% და მეტი — დიაბეტი. სამიზნე მაჩვენებელი დიაბეტიან პაციენტებში ინდივიდუალურია.' }],
      en: [{ p: 'Below 5.7% is considered normal; 5.7–6.4% is prediabetes; 6.5% or above is diabetes. The target value for patients with diabetes is individual.' }],
      ru: [{ p: 'Нормой считается ниже 5,7%; 5,7–6,4% — преддиабет; 6,5% и выше — диабет. Целевой показатель у пациентов с диабетом индивидуален.' }],
    },
  },

  // ── 4. Lipid profile ────────────────────────────────────────────────────
  {
    slug: 'lipid-profile',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['blood-glucose', 'glycated-hemoglobin-hba1c'],
    aliases: { ge: ['ლიპიდოგრამა', 'ქოლესტერინი', 'ლიპიდური პროფილი'], en: ['Lipid panel', 'Cholesterol test', 'Lipidogram'], ru: ['Липидограмма', 'Холестерин', 'Липидный профиль'] },
    title: { ge: 'ლიპიდური პროფილი', en: 'Lipid Profile', ru: 'Липидный профиль' },
    summary: {
      ge: 'ზომავს ქოლესტერინსა და ტრიგლიცერიდებს — გულ-სისხლძარღვთა რისკის შესაფასებლად.',
      en: 'Measures cholesterol and triglycerides to assess cardiovascular risk.',
      ru: 'Измеряет холестерин и триглицериды для оценки сердечно-сосудистого риска.',
    },
    overview: {
      ge: [{ p: 'ლიპიდური პროფილი მოიცავს საერთო ქოლესტერინს, LDL-ს („ცუდი"), HDL-ს („კარგი") და ტრიგლიცერიდებს. ეს მაჩვენებლები გვეხმარება გულის დაავადებებისა და ინსულტის რისკის შეფასებაში.' }],
      en: [{ p: 'A lipid profile includes total cholesterol, LDL ("bad"), HDL ("good") and triglycerides. These values help assess the risk of heart disease and stroke.' }],
      ru: [{ p: 'Липидный профиль включает общий холестерин, ЛПНП («плохой»), ЛПВП («хороший») и триглицериды. Эти показатели помогают оценить риск болезней сердца и инсульта.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება პროფილაქტიკურად 40 წლის შემდეგ, გულ-სისხლძარღვთა რისკ-ფაქტორების დროს და ლიპიდის დამქვეითებელი თერაპიის მონიტორინგისთვის.' }],
      en: [{ p: 'It is ordered as a routine check after age 40, when cardiovascular risk factors are present and to monitor lipid-lowering therapy.' }],
      ru: [{ p: 'Назначается профилактически после 40 лет, при факторах сердечно-сосудистого риска и для контроля гиполипидемической терапии.' }],
    },
    preparation: {
      ge: [{ p: 'რეკომენდებულია 9–12 საათიანი შიმშილი (განსაკუთრებით ტრიგლიცერიდების ზუსტი შეფასებისთვის).' }],
      en: [{ p: 'Fasting for 9–12 hours is recommended (especially for an accurate triglyceride measurement).' }],
      ru: [{ p: 'Рекомендуется голодание 9–12 часов (особенно для точной оценки триглицеридов).' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის ერთჯერადი აღება.' }],
      en: [{ p: 'A single venous blood draw.' }],
      ru: [{ p: 'Однократный забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'სასურველია მაღალი HDL და დაბალი LDL. სამიზნე მაჩვენებლები დამოკიდებულია საერთო რისკ-პროფილზე — ისინი ინდივიდუალურად განისაზღვრება კარდიოლოგთან ერთად.' }],
      en: [{ p: 'A high HDL and a low LDL are desirable. Target values depend on overall risk and are set individually with a cardiologist.' }],
      ru: [{ p: 'Желательны высокий ЛПВП и низкий ЛПНП. Целевые показатели зависят от общего риска и определяются индивидуально с кардиологом.' }],
    },
  },

  // ── 5. Liver function tests ─────────────────────────────────────────────
  {
    slug: 'liver-function-tests',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['complete-blood-count'],
    aliases: { ge: ['ღვიძლის სინჯები', 'ALT', 'AST', 'ღვიძლის ფუნქციური ტესტები'], en: ['LFTs', 'ALT/AST', 'Liver panel'], ru: ['Печёночные пробы', 'АЛТ/АСТ', 'Печёночный профиль'] },
    title: { ge: 'ღვიძლის ფუნქციური სინჯები', en: 'Liver Function Tests', ru: 'Печёночные пробы' },
    summary: {
      ge: 'ფერმენტებისა და ცილების ჯგუფი, რომელიც აფასებს ღვიძლის ჯანმრთელობას.',
      en: 'A group of enzymes and proteins that assess the health of the liver.',
      ru: 'Группа ферментов и белков, оценивающих здоровье печени.',
    },
    overview: {
      ge: [{ p: 'ღვიძლის სინჯები მოიცავს ფერმენტებს (ALT, AST, ALP, GGT), ბილირუბინსა და ალბუმინს. გადახრები შესაძლოა ღვიძლის დაზიანებაზე ან სანაღვლე გზების პრობლემაზე მიუთითებდეს.' }],
      en: [{ p: 'Liver tests include enzymes (ALT, AST, ALP, GGT), bilirubin and albumin. Abnormal values can indicate liver damage or a problem with the bile ducts.' }],
      ru: [{ p: 'Печёночные пробы включают ферменты (АЛТ, АСТ, ЩФ, ГГТ), билирубин и альбумин. Отклонения могут указывать на повреждение печени или проблему желчных путей.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება ჰეპატიტის ეჭვის, მედიკამენტების ხანგრძლივი მიღების, ალკოჰოლის ან აუხსნელი დაღლილობის/სიყვითლის დროს.' }],
      en: [{ p: 'It is ordered when hepatitis is suspected, during long-term medication use, with alcohol use, or for unexplained fatigue or jaundice.' }],
      ru: [{ p: 'Назначается при подозрении на гепатит, длительном приёме лекарств, употреблении алкоголя или необъяснимой усталости/желтухе.' }],
    },
    preparation: {
      ge: [{ p: 'ხშირად რეკომендებულია მსუბუქი შიმშილი; მოერიდეთ ალკოჰოლს ანალიზამდე 24 საათით ადრე.' }],
      en: [{ p: 'Light fasting is often recommended; avoid alcohol for 24 hours before the test.' }],
      ru: [{ p: 'Часто рекомендуется лёгкое голодание; избегайте алкоголя за 24 часа до анализа.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის სტანდარტული აღება.' }],
      en: [{ p: 'A standard venous blood draw.' }],
      ru: [{ p: 'Стандартный забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'მომატებული ALT/AST ღვიძლის უჯრედების დაზიანებაზე მიუთითებს, მომატებული ALP/GGT — სანაღვლე გზების პრობლემაზე. შედეგი უნდა შეფასდეს გასტროენტეროლოგის მიერ.' }],
      en: [{ p: 'Raised ALT/AST points to liver-cell damage, while raised ALP/GGT points to a bile-duct problem. Results should be assessed by a gastroenterologist.' }],
      ru: [{ p: 'Повышение АЛТ/АСТ указывает на повреждение клеток печени, а повышение ЩФ/ГГТ — на проблему желчных путей. Результат должен оценивать гастроэнтеролог.' }],
    },
  },

  // ── 6. TSH ──────────────────────────────────────────────────────────────
  {
    slug: 'thyroid-stimulating-hormone-tsh',
    category: 'hormones',
    published: true,
    relatedTestSlugs: ['vitamin-b12-test', 'vitamin-d-25-oh'],
    aliases: { ge: ['TSH', 'თირეოტროპული ჰორმონი', 'ფარისებრი ჯირკვლის ჰორმონი'], en: ['TSH', 'Thyrotropin'], ru: ['ТТГ', 'Тиреотропный гормон'] },
    title: { ge: 'თირეოტროპული ჰორმონი (TSH)', en: 'Thyroid-Stimulating Hormone (TSH)', ru: 'Тиреотропный гормон (ТТГ)' },
    summary: {
      ge: 'ფარისებრი ჯირკვლის ფუნქციის მთავარი სკრინინგ-ტესტი.',
      en: 'The principal screening test for thyroid function.',
      ru: 'Основной скрининговый тест функции щитовидной железы.',
    },
    overview: {
      ge: [{ p: 'TSH-ს ჰიპოფიზი გამოიმუშავებს და ის არეგულირებს ფარისებრი ჯირკვლის მუშაობას. მისი დონე მგრძნობიარე ინდიკატორია ჯირკვლის ფუნქციის შესაფასებლად.' }],
      en: [{ p: 'TSH is produced by the pituitary gland and regulates the thyroid. Its level is a sensitive indicator of how well the gland is working.' }],
      ru: [{ p: 'ТТГ вырабатывается гипофизом и регулирует работу щитовидной железы. Его уровень — чувствительный индикатор функции железы.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება დაღლილობის, წონის ცვლილების, თმის ცვენის, ციკლის დარღვევის ან ფარისებრი ჯირკვლის დაავადების მონიტორინგის დროს.' }],
      en: [{ p: 'It is ordered for fatigue, weight change, hair loss, cycle disturbances or to monitor thyroid disease.' }],
      ru: [{ p: 'Назначается при усталости, изменении веса, выпадении волос, нарушениях цикла или для контроля заболеваний щитовидной железы.' }],
    },
    preparation: {
      ge: [{ p: 'სპეციალური მომზადება არ არის საჭირო. თუ იღებთ ფარისებრი ჯირკვლის მედიკამენტს, დააზუსტეთ აღების დრო ექიმთან.' }],
      en: [{ p: 'No special preparation is needed. If you take thyroid medication, confirm the timing with your doctor.' }],
      ru: [{ p: 'Специальная подготовка не требуется. Если вы принимаете препараты для щитовидной железы, уточните время приёма у врача.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'მომატებული TSH ხშირად ჰიპოთირეოზზე მიუთითებს, დაბალი — ჰიპერთირეოზზე. დასაზუსტებლად ხშირად ემატება თავისუფალი T4 და T3. შედეგს აფასებს ენდოკრინოლოგი.' }],
      en: [{ p: 'A high TSH often indicates hypothyroidism and a low TSH hyperthyroidism. Free T4 and T3 are often added to clarify. An endocrinologist interprets the result.' }],
      ru: [{ p: 'Высокий ТТГ часто указывает на гипотиреоз, низкий — на гипертиреоз. Для уточнения часто добавляют свободные T4 и T3. Результат оценивает эндокринолог.' }],
    },
  },

  // ── 7. Vitamin D ────────────────────────────────────────────────────────
  {
    slug: 'vitamin-d-25-oh',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['vitamin-b12-test', 'thyroid-stimulating-hormone-tsh'],
    aliases: { ge: ['ვიტამინი D', '25-OH ვიტამინი D', 'კალციდიოლი'], en: ['Vitamin D', '25-OH vitamin D', 'Calcidiol'], ru: ['Витамин D', '25-OH витамин D', 'Кальцидиол'] },
    title: { ge: 'ვიტამინი D (25-OH)', en: 'Vitamin D (25-OH)', ru: 'Витамин D (25-OH)' },
    summary: {
      ge: 'აფასებს ვიტამინ D-ის მარაგს ორგანიზმში — ძვლების ჯანმრთელობისა და იმუნიტეტისთვის.',
      en: 'Assesses the body’s vitamin D reserve — important for bone health and immunity.',
      ru: 'Оценивает запас витамина D в организме — важен для здоровья костей и иммунитета.',
    },
    overview: {
      ge: [{ p: '25-OH ვიტამინი D ვიტამინ D-ის სტატუსის ყველაზე საიმედო მაჩვენებელია. ვიტამინი D აუცილებელია კალციუმის შეწოვისა და ძვლების სიმტკიცისთვის.' }],
      en: [{ p: '25-OH vitamin D is the most reliable marker of vitamin D status. Vitamin D is essential for calcium absorption and bone strength.' }],
      ru: [{ p: '25-OH витамин D — самый надёжный показатель статуса витамина D. Витамин D необходим для всасывания кальция и прочности костей.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება ძვლის ტკივილის, კუნთების სისუსტის, ხშირი დაღლილობის ან ოსტეოპოროზის რისკის დროს.' }],
      en: [{ p: 'It is ordered for bone pain, muscle weakness, frequent fatigue or a risk of osteoporosis.' }],
      ru: [{ p: 'Назначается при болях в костях, мышечной слабости, частой усталости или риске остеопороза.' }],
    },
    preparation: {
      ge: [{ p: 'სპეციალური მომზადება არ არის საჭირო.' }],
      en: [{ p: 'No special preparation is needed.' }],
      ru: [{ p: 'Специальная подготовка не требуется.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'დაბალი დონე ვიტამინ D-ის დეფიციტზე მიუთითებს და ხშირად დანამატით ივსება. ოპტიმალური დიაპაზონი და დანამატის დოზა ექიმმა უნდა განსაზღვროს.' }],
      en: [{ p: 'A low level indicates vitamin D deficiency and is often corrected with supplements. The optimal range and supplement dose should be set by a doctor.' }],
      ru: [{ p: 'Низкий уровень указывает на дефицит витамина D и часто корректируется добавками. Оптимальный диапазон и дозу добавки должен определить врач.' }],
    },
  },

  // ── 8. Vitamin B12 ──────────────────────────────────────────────────────
  {
    slug: 'vitamin-b12-test',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['complete-blood-count', 'ferritin'],
    aliases: { ge: ['ვიტამინი B12', 'კობალამინი', 'B12'], en: ['Vitamin B12', 'Cobalamin', 'B12'], ru: ['Витамин B12', 'Кобаламин', 'B12'] },
    title: { ge: 'ვიტამინი B12 (კობალამინი)', en: 'Vitamin B12 (Cobalamin)', ru: 'Витамин B12 (кобаламин)' },
    summary: {
      ge: 'ზომავს B12-ის დონეს — ნერვული სისტემისა და სისხლწარმოქმნის ჯანმრთელობისთვის.',
      en: 'Measures the B12 level — important for the nervous system and blood formation.',
      ru: 'Измеряет уровень B12 — важен для нервной системы и кроветворения.',
    },
    overview: {
      ge: [{ p: 'ვიტამინი B12 აუცილებელია სისხლის წითელი უჯრედებისა და ნერვული სისტემის ნორმალური ფუნქციისთვის. დეფიციტი თანდათან ვითარდება და ანემიასა და ნევროლოგიურ სიმპტომებს იწვევს.' }],
      en: [{ p: 'Vitamin B12 is essential for red blood cells and normal nervous-system function. A deficiency develops gradually and causes anaemia and neurological symptoms.' }],
      ru: [{ p: 'Витамин B12 необходим для эритроцитов и нормальной работы нервной системы. Дефицит развивается постепенно и вызывает анемию и неврологические симптомы.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება დაღლილობის, კიდურების დაბუჟების, მეხსიერების გაუარესების, ვეგეტარიანული დიეტის ან კუჭ-ნაწლავის პრობლემების დროს.' }],
      en: [{ p: 'It is ordered for fatigue, numbness in the limbs, memory problems, a vegetarian diet or gastrointestinal conditions.' }],
      ru: [{ p: 'Назначается при усталости, онемении конечностей, ухудшении памяти, вегетарианской диете или проблемах ЖКТ.' }],
    },
    preparation: {
      ge: [{ p: 'სასურველია მსუბუქი შიმშილი; აცნობეთ ექიმს B12-ის დანამატების მიღების შესახებ.' }],
      en: [{ p: 'Light fasting is preferable; tell your doctor if you take B12 supplements.' }],
      ru: [{ p: 'Желательно лёгкое голодание; сообщите врачу о приёме добавок B12.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'დაბალი დონე დეფიციტზე მიუთითებს; საჭიროებისას ემატება ფოლიუმის მჟავისა და ფერიტინის ანალიზი. მკურნალობა (დანამატი ან ინექცია) ექიმის მეთვალყურეობით მიმდინარეობს.' }],
      en: [{ p: 'A low level indicates deficiency; folate and ferritin tests are added when needed. Treatment (supplements or injections) is carried out under medical supervision.' }],
      ru: [{ p: 'Низкий уровень указывает на дефицит; при необходимости добавляют анализ фолиевой кислоты и ферритина. Лечение (добавки или инъекции) проводится под наблюдением врача.' }],
    },
  },

  // ── 9. Urinalysis ───────────────────────────────────────────────────────
  {
    slug: 'urinalysis',
    category: 'urinalysis',
    published: true,
    relatedTestSlugs: ['complete-blood-count'],
    aliases: { ge: ['შარდის საერთო ანალიზი', 'შარდის ანალიზი'], en: ['Urinalysis', 'Urine test', 'UA'], ru: ['Общий анализ мочи', 'Анализ мочи'] },
    title: { ge: 'შარდის საერთო ანალიზი', en: 'Urinalysis', ru: 'Общий анализ мочи' },
    summary: {
      ge: 'ფასდება შარდის ფიზიკური, ქიმიური და მიკროსკოპული მახასიათებლები.',
      en: 'Evaluates the physical, chemical and microscopic properties of urine.',
      ru: 'Оценивает физические, химические и микроскопические свойства мочи.',
    },
    overview: {
      ge: [{ p: 'შარდის ანალიზი მარტივი, არაინვაზიური ტესტია, რომელიც ბევრ ინფორმაციას იძლევა თირკმლისა და საშარდე გზების მდგომარეობაზე, ასევე მეტაბოლურ პროცესებზე.' }],
      en: [{ p: 'Urinalysis is a simple, non-invasive test that reveals a lot about the kidneys and urinary tract, as well as metabolic processes.' }],
      ru: [{ p: 'Анализ мочи — простой неинвазивный тест, дающий много информации о почках и мочевыводящих путях, а также о метаболических процессах.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება საშარდე გზების ინფექციის, თირკმლის დაავადებების ეჭვის, დიაბეტის სკრინინგისა და პროფილაქტიკური შემოწმების დროს.' }],
      en: [{ p: 'It is ordered when a urinary-tract infection or kidney disease is suspected, for diabetes screening and for routine check-ups.' }],
      ru: [{ p: 'Назначается при подозрении на инфекцию мочевыводящих путей или болезнь почек, для скрининга диабета и при профилактических осмотрах.' }],
    },
    preparation: {
      ge: [{ p: 'საჭიროა დილის შარდის საშუალო ნაკადი სტერილურ კონტეინერში. გარეცხეთ გენიტალური არე ნიმუშის აღებამდე.' }],
      en: [{ p: 'A midstream morning sample in a sterile container is needed. Clean the genital area before collecting the sample.' }],
      ru: [{ p: 'Нужна средняя порция утренней мочи в стерильном контейнере. Перед сбором промойте область гениталий.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ნიმუშს თავად აგროვებთ; პროცედურა უმტკივნელოა.' }],
      en: [{ p: 'You collect the sample yourself; the procedure is painless.' }],
      ru: [{ p: 'Образец вы собираете самостоятельно; процедура безболезненна.' }],
    },
    interpretation: {
      ge: [{ p: 'ცილა, გლუკოზა, სისხლის უჯრედები ან ბაქტერიები შარდში სხვადასხვა პათოლოგიაზე მიუთითებს. შედეგი ფასდება კლინიკურ სურათთან ერთად.' }],
      en: [{ p: 'Protein, glucose, blood cells or bacteria in the urine point to different conditions. The result is assessed together with the clinical picture.' }],
      ru: [{ p: 'Белок, глюкоза, клетки крови или бактерии в моче указывают на разные патологии. Результат оценивается вместе с клинической картиной.' }],
    },
  },

  // ── 10. CRP ─────────────────────────────────────────────────────────────
  {
    slug: 'c-reactive-protein',
    category: 'immunology',
    published: true,
    relatedTestSlugs: ['complete-blood-count'],
    aliases: { ge: ['CRP', 'C-რეაქტიული ცილა', 'ანთების მარკერი'], en: ['CRP', 'C-reactive protein'], ru: ['СРБ', 'C-реактивный белок'] },
    title: { ge: 'C-რეაქტიული ცილა (CRP)', en: 'C-Reactive Protein (CRP)', ru: 'C-реактивный белок (СРБ)' },
    summary: {
      ge: 'ანთების მგრძნობიარე მარკერი, რომელიც სწრაფად მატულობს ინფექციისა და ანთების დროს.',
      en: 'A sensitive marker of inflammation that rises quickly with infection and inflammation.',
      ru: 'Чувствительный маркер воспаления, быстро повышающийся при инфекции и воспалении.',
    },
    overview: {
      ge: [{ p: 'CRP ცილაა, რომელსაც ღვიძლი ანთების საპასუხოდ გამოიმუშავებს. მისი დონე ეხმარება ანთებითი პროცესის არსებობისა და სიმძიმის შეფასებას.' }],
      en: [{ p: 'CRP is a protein produced by the liver in response to inflammation. Its level helps gauge the presence and severity of an inflammatory process.' }],
      ru: [{ p: 'СРБ — белок, вырабатываемый печенью в ответ на воспаление. Его уровень помогает оценить наличие и тяжесть воспалительного процесса.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება ინფექციის, ანთებითი დაავადებების მონიტორინგისა და მკურნალობაზე პასუხის შესაფასებლად.' }],
      en: [{ p: 'It is ordered to monitor infection and inflammatory disease and to assess the response to treatment.' }],
      ru: [{ p: 'Назначается для контроля инфекций, воспалительных заболеваний и оценки ответа на лечение.' }],
    },
    preparation: {
      ge: [{ p: 'სპეციალური მომზადება არ არის საჭირო.' }],
      en: [{ p: 'No special preparation is needed.' }],
      ru: [{ p: 'Специальная подготовка не требуется.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'მომატებული CRP ანთებაზე ან ინფექციაზე მიუთითებს, თუმცა არ აზუსტებს მიზეზს. დინამიკაში შემცირება მკურნალობის ეფექტურობაზე მეტყველებს.' }],
      en: [{ p: 'A raised CRP indicates inflammation or infection but does not pinpoint the cause. A fall over time suggests treatment is working.' }],
      ru: [{ p: 'Повышенный СРБ указывает на воспаление или инфекцию, но не уточняет причину. Снижение в динамике говорит об эффективности лечения.' }],
    },
  },

  // ── 11. Ferritin ────────────────────────────────────────────────────────
  {
    slug: 'ferritin',
    category: 'biochemistry',
    published: true,
    relatedTestSlugs: ['complete-blood-count', 'vitamin-b12-test'],
    aliases: { ge: ['ფერიტინი', 'რკინის მარაგი'], en: ['Ferritin', 'Iron stores'], ru: ['Ферритин', 'Запас железа'] },
    title: { ge: 'ფერიტინი', en: 'Ferritin', ru: 'Ферритин' },
    summary: {
      ge: 'ასახავს ორგანიზმში რკინის მარაგს — რკინადეფიციტური ანემიის ადრეული მარკერი.',
      en: 'Reflects the body’s iron stores — an early marker of iron-deficiency anaemia.',
      ru: 'Отражает запасы железа в организме — ранний маркер железодефицитной анемии.',
    },
    overview: {
      ge: [{ p: 'ფერიტინი ცილაა, რომელშიც ორგანიზმი რკინას ინახავს. მისი დონე ყველაზე ადრეულ ნიშანს იძლევა რკინის დეფიციტზე, ანემიის გამოვლენამდე.' }],
      en: [{ p: 'Ferritin is the protein in which the body stores iron. Its level gives the earliest sign of iron deficiency, before anaemia appears.' }],
      ru: [{ p: 'Ферритин — белок, в котором организм хранит железо. Его уровень даёт самый ранний признак дефицита железа, ещё до появления анемии.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება დაღლილობის, თმის ცვენის, სიფერმკრთალის ან CBC-ში დაბალი ჰემოგლობინის დროს.' }],
      en: [{ p: 'It is ordered for fatigue, hair loss, pallor or a low haemoglobin on a CBC.' }],
      ru: [{ p: 'Назначается при усталости, выпадении волос, бледности или низком гемоглобине в ОАК.' }],
    },
    preparation: {
      ge: [{ p: 'სასურველია დილით, მსუბუქი შიმშილის ფონზე.' }],
      en: [{ p: 'Preferably in the morning, after light fasting.' }],
      ru: [{ p: 'Желательно утром, после лёгкого голодания.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'დაბალი ფერიტინი რკინის დეფიციტს ადასტურებს; მაღალი — შესაძლოა ანთებას ან რკინის გადატვირთვას უკავშირდებოდეს. ინტერპრეტაცია CBC-სთან ერთად ხდება.' }],
      en: [{ p: 'A low ferritin confirms iron deficiency; a high value may relate to inflammation or iron overload. It is interpreted together with the CBC.' }],
      ru: [{ p: 'Низкий ферритин подтверждает дефицит железа; высокий может быть связан с воспалением или перегрузкой железом. Интерпретируется вместе с ОАК.' }],
    },
  },

  // ── 12. Coagulation panel ───────────────────────────────────────────────
  {
    slug: 'coagulation-panel-pt-inr',
    category: 'hematology',
    published: true,
    relatedTestSlugs: ['complete-blood-count'],
    aliases: { ge: ['კოაგულოგრამა', 'PT', 'INR', 'სისხლის შედედება'], en: ['Coagulation panel', 'PT/INR', 'Coagulogram'], ru: ['Коагулограмма', 'ПВ/МНО', 'Свёртываемость'] },
    title: { ge: 'სისხლის შედედების ანალიზი (PT/INR)', en: 'Coagulation Panel (PT/INR)', ru: 'Коагулограмма (ПВ/МНО)' },
    summary: {
      ge: 'აფასებს, რამდენად სწორად იშედება სისხლი.',
      en: 'Assesses how well the blood clots.',
      ru: 'Оценивает, насколько правильно свёртывается кровь.',
    },
    overview: {
      ge: [{ p: 'კოაგულოგრამა ზომავს სისხლის შედედების დროსა და მაჩვენებლებს (PT, INR, APTT). ის მნიშვნელოვანია სისხლდენისა და თრომბოზის რისკის შესაფასებლად.' }],
      en: [{ p: 'A coagulation panel measures clotting times and indices (PT, INR, APTT). It is important for assessing the risk of bleeding and thrombosis.' }],
      ru: [{ p: 'Коагулограмма измеряет время и показатели свёртывания (ПВ, МНО, АЧТВ). Она важна для оценки риска кровотечения и тромбоза.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება ოპერაციამდე, ანტიკოაგულანტული თერაპიის (მაგ. ვარფარინი) მონიტორინგისა და სისხლდენის დარღვევების ეჭვისას.' }],
      en: [{ p: 'It is ordered before surgery, to monitor anticoagulant therapy (e.g. warfarin) and when a bleeding disorder is suspected.' }],
      ru: [{ p: 'Назначается перед операцией, для контроля антикоагулянтной терапии (например, варфарина) и при подозрении на нарушение свёртывания.' }],
    },
    preparation: {
      ge: [{ p: 'სპეციალური მომზადება, როგორც წესი, არ არის საჭირო; აცნობეთ ექიმს ყველა მიღებული მედიკამენტის შესახებ.' }],
      en: [{ p: 'No special preparation is usually needed; tell your doctor about all medications you take.' }],
      ru: [{ p: 'Специальная подготовка обычно не нужна; сообщите врачу обо всех принимаемых лекарствах.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'გახანგრძლივებული PT/INR გაზრდილ სისხლდენის რისკზე მიუთითებს. ანტიკოაგულანტზე მყოფ პაციენტებში INR სამიზნე დიაპაზონში უნდა იყოს, რასაც ექიმი აკონტროლებს.' }],
      en: [{ p: 'A prolonged PT/INR indicates an increased bleeding risk. In patients on anticoagulants, the INR must stay within a target range that the doctor monitors.' }],
      ru: [{ p: 'Удлинённое ПВ/МНО указывает на повышенный риск кровотечения. У пациентов на антикоагулянтах МНО должно оставаться в целевом диапазоне, который контролирует врач.' }],
    },
  },

  // ── 13. HPV PCR ─────────────────────────────────────────────────────────
  {
    slug: 'hpv-pcr-test',
    category: 'infections',
    published: true,
    relatedTestSlugs: [],
    aliases: { ge: ['HPV', 'ადამიანის პაპილომავირუსი', 'HPV PCR'], en: ['HPV', 'Human papillomavirus', 'HPV PCR'], ru: ['ВПЧ', 'Вирус папилломы человека', 'ВПЧ ПЦР'] },
    title: { ge: 'ადამიანის პაპილომავირუსი (HPV) — PCR', en: 'Human Papillomavirus (HPV) — PCR', ru: 'Вирус папилломы человека (ВПЧ) — ПЦР' },
    summary: {
      ge: 'მაღალი რისკის HPV შტამების გამოვლენა — საშვილოსნოს ყელის კიბოს სკრინინგის თანამედროვე მეთოდი.',
      en: 'Detection of high-risk HPV strains — a modern method of cervical-cancer screening.',
      ru: 'Выявление высокоонкогенных штаммов ВПЧ — современный метод скрининга рака шейки матки.',
    },
    overview: {
      ge: [{ p: 'HPV PCR-ტესტი ავლენს ვირუსის დნმ-ს და განსაზღვრავს მაღალი რისკის შტამებს (მათ შორის მე-16 და მე-18-ს), რომლებიც საშვილოსნოს ყელის კიბოს უმეტეს შემთხვევას იწვევენ.' }],
      en: [{ p: 'The HPV PCR test detects the virus’s DNA and identifies high-risk strains (including types 16 and 18) responsible for most cases of cervical cancer.' }],
      ru: [{ p: 'ВПЧ ПЦР-тест выявляет ДНК вируса и определяет высокоонкогенные штаммы (включая типы 16 и 18), вызывающие большинство случаев рака шейки матки.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება საშვილოსნოს ყელის კიბოს სკრინინგის ფარგლებში, PAP-ტესტთან ერთად ან ცალკე, ჩვეულებრივ 30 წლის ასაკიდან.' }],
      en: [{ p: 'It is used in cervical-cancer screening, alongside or instead of the PAP test, usually from age 30.' }],
      ru: [{ p: 'Используется в рамках скрининга рака шейки матки, вместе с PAP-тестом или отдельно, обычно с 30 лет.' }],
    },
    preparation: {
      ge: [{ p: 'მოერიდეთ სქესობრივ კავშირს, ვაგინალურ მედიკამენტებსა და დუშირებას ნიმუშის აღებამდე 24–48 საათით ადრე. ტესტი ციკლის მენსტრუაციის გარეშე დღეებში ტარდება.' }],
      en: [{ p: 'Avoid intercourse, vaginal medications and douching for 24–48 hours before sampling. The test is taken on non-menstrual days.' }],
      ru: [{ p: 'Избегайте половых контактов, вагинальных препаратов и спринцеваний за 24–48 часов до взятия образца. Тест проводят в дни без менструации.' }],
    },
    whatToExpect: {
      ge: [{ p: 'გინეკოლოგი იღებს ნიმუშს საშვილოსნოს ყელიდან; პროცედურა მოკლე და, როგორც წესი, უმტკივნელოა.' }],
      en: [{ p: 'A gynaecologist takes a sample from the cervix; the procedure is brief and usually painless.' }],
      ru: [{ p: 'Гинеколог берёт образец с шейки матки; процедура короткая и обычно безболезненная.' }],
    },
    interpretation: {
      ge: [{ p: 'დადებითი შედეგი მაღალი რისკის HPV-ს არსებობას ნიშნავს და დამატებით კვლევას (კოლპოსკოპია, ციტოლოგია) საჭიროებს. დადებითი ტესტი კიბოს დიაგნოზი არ არის — ის რისკს აფასებს.' }],
      en: [{ p: 'A positive result means high-risk HPV is present and requires further evaluation (colposcopy, cytology). A positive test is not a cancer diagnosis — it assesses risk.' }],
      ru: [{ p: 'Положительный результат означает наличие высокоонкогенного ВПЧ и требует дообследования (кольпоскопия, цитология). Положительный тест — это не диагноз рака, а оценка риска.' }],
    },
  },

  // ── 14. Helicobacter pylori ─────────────────────────────────────────────
  {
    slug: 'helicobacter-pylori',
    category: 'infections',
    published: true,
    relatedTestSlugs: ['complete-blood-count'],
    aliases: { ge: ['H. pylori', 'ჰელიკობაქტერ პილორი', 'ჰელიკობაქტერი'], en: ['H. pylori', 'Helicobacter pylori'], ru: ['H. pylori', 'Хеликобактер пилори'] },
    title: { ge: 'ჰელიკობაქტერ პილორი (H. pylori)', en: 'Helicobacter pylori (H. pylori)', ru: 'Хеликобактер пилори (H. pylori)' },
    summary: {
      ge: 'ავლენს ბაქტერიას, რომელიც გასტრიტისა და კუჭის წყლულის ხშირი მიზეზია.',
      en: 'Detects the bacterium that frequently causes gastritis and stomach ulcers.',
      ru: 'Выявляет бактерию, которая часто вызывает гастрит и язву желудка.',
    },
    overview: {
      ge: [{ p: 'H. pylori კუჭის ლორწოვანში მცხოვრები ბაქტერიაა. ის გასტრიტის, კუჭისა და თორმეტგოჯა ნაწლავის წყლულის ხშირი მიზეზია. ტესტი შესაძლებელია სუნთქვის, განავლის ანტიგენის ან სისხლის მეშვეობით.' }],
      en: [{ p: 'H. pylori is a bacterium that lives in the stomach lining. It is a frequent cause of gastritis and stomach or duodenal ulcers. Testing can be done by breath, stool antigen or blood.' }],
      ru: [{ p: 'H. pylori — бактерия, обитающая в слизистой желудка. Частая причина гастрита и язвы желудка или двенадцатиперстной кишки. Тест возможен по дыханию, антигену кала или крови.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება გულძმარვის, კუჭის ტკივილის, წყლულის ან ხანგრძლივი დისპეფსიის დროს, ასევე მკურნალობის შემდეგ ერადიკაციის შესამოწმებლად.' }],
      en: [{ p: 'It is ordered for heartburn, stomach pain, ulcers or long-standing dyspepsia, and after treatment to confirm eradication.' }],
      ru: [{ p: 'Назначается при изжоге, боли в желудке, язве или длительной диспепсии, а также после лечения для проверки эрадикации.' }],
    },
    preparation: {
      ge: [{ p: 'სუნთქვისა და განავლის ტესტისთვის შეაჩერეთ პროტონული ტუმბოს ინჰიბიტორები 2 კვირით და ანტიბიოტიკები 4 კვირით ადრე (ექიმის რჩევით).' }],
      en: [{ p: 'For breath and stool tests, stop proton-pump inhibitors for 2 weeks and antibiotics for 4 weeks beforehand (on your doctor’s advice).' }],
      ru: [{ p: 'Для дыхательного и калового теста прекратите ингибиторы протонной помпы за 2 недели и антибиотики за 4 недели (по совету врача).' }],
    },
    whatToExpect: {
      ge: [{ p: 'მეთოდის მიხედვით — სუნთქვის ნიმუში, განავლის ან სისხლის აღება. ყველა მეთოდი მინიმალურად დისკომფორტულია.' }],
      en: [{ p: 'Depending on the method — a breath sample, a stool sample or a blood draw. All methods cause minimal discomfort.' }],
      ru: [{ p: 'В зависимости от метода — образец дыхания, кала или забор крови. Все методы доставляют минимальный дискомфорт.' }],
    },
    interpretation: {
      ge: [{ p: 'დადებითი შედეგი აქტიურ ან გადატანილ ინფექციაზე მიუთითებს. აქტიური ინფექცია ანტიბიოტიკოთერაპიას საჭიროებს. შედეგს აფასებს გასტროენტეროლოგი.' }],
      en: [{ p: 'A positive result indicates active or past infection. An active infection requires antibiotic therapy. A gastroenterologist interprets the result.' }],
      ru: [{ p: 'Положительный результат указывает на активную или перенесённую инфекцию. Активная инфекция требует антибиотикотерапии. Результат оценивает гастроэнтеролог.' }],
    },
  },

  // ── 15. PSA ─────────────────────────────────────────────────────────────
  {
    slug: 'prostate-specific-antigen-psa',
    category: 'oncology',
    published: true,
    relatedTestSlugs: [],
    aliases: { ge: ['PSA', 'პროსტატის სპეციფიკური ანტიგენი'], en: ['PSA', 'Prostate-specific antigen'], ru: ['ПСА', 'Простатоспецифический антиген'] },
    title: { ge: 'პროსტატის სპეციფიკური ანტიგენი (PSA)', en: 'Prostate-Specific Antigen (PSA)', ru: 'Простатоспецифический антиген (ПСА)' },
    summary: {
      ge: 'მამაკაცებში პროსტატის ჯანმრთელობის სკრინინგ-ტესტი.',
      en: 'A screening test for prostate health in men.',
      ru: 'Скрининговый тест здоровья простаты у мужчин.',
    },
    overview: {
      ge: [{ p: 'PSA პროსტატის გამომუშავებული ცილაა. სისხლში მისი დონის მატება შესაძლოა პროსტატის გადიდებას, ანთებას ან კიბოს უკავშირდებოდეს.' }],
      en: [{ p: 'PSA is a protein produced by the prostate. A rise in its blood level may relate to prostate enlargement, inflammation or cancer.' }],
      ru: [{ p: 'ПСА — белок, вырабатываемый простатой. Повышение его уровня в крови может быть связано с увеличением простаты, воспалением или раком.' }],
    },
    whyDone: {
      ge: [{ p: 'ენიშნება პროსტატის კიბოს სკრინინგისთვის (ჩვეულებრივ 50 წლიდან, რისკის შემთხვევაში ადრე), შარდვის პრობლემების ან მკურნალობის მონიტორინგის დროს.' }],
      en: [{ p: 'It is used for prostate-cancer screening (usually from age 50, earlier if at risk), for urinary problems and to monitor treatment.' }],
      ru: [{ p: 'Используется для скрининга рака простаты (обычно с 50 лет, при риске — раньше), при проблемах с мочеиспусканием и для контроля лечения.' }],
    },
    preparation: {
      ge: [{ p: 'ანალიზამდე 48 საათით ადრე მოერიდეთ ინტენსიურ ფიზიკურ დატვირთვას, ველოსიპედსა და ეაკულაციას — ისინი დროებით ზრდიან PSA-ს.' }],
      en: [{ p: 'For 48 hours before the test, avoid intense exercise, cycling and ejaculation, which can temporarily raise PSA.' }],
      ru: [{ p: 'За 48 часов до анализа избегайте интенсивных нагрузок, езды на велосипеде и эякуляции — они временно повышают ПСА.' }],
    },
    whatToExpect: {
      ge: [{ p: 'ვენური სისხლის აღება.' }],
      en: [{ p: 'A venous blood draw.' }],
      ru: [{ p: 'Забор венозной крови.' }],
    },
    interpretation: {
      ge: [{ p: 'მომატებული PSA კიბოს დიაგნოზი არ არის — ის სხვა მიზეზებითაც იმატებს. შედეგი ფასდება ასაკისა და დინამიკის გათვალისწინებით, ხშირად უროლოგის დამატებითი კვლევით.' }],
      en: [{ p: 'A raised PSA is not a cancer diagnosis — it can rise for other reasons too. The result is assessed with age and trend in mind, often with further urological evaluation.' }],
      ru: [{ p: 'Повышенный ПСА — не диагноз рака: он растёт и по другим причинам. Результат оценивают с учётом возраста и динамики, часто с дополнительным урологическим обследованием.' }],
    },
  },
]
