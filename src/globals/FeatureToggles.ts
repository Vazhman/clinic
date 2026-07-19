import type { GlobalConfig, Field } from 'payload'
import { featureTogglesCache } from '../lib/feature-toggles-cache'

// Site-wide kill-switches for whole content types / features. Distinct from
// HomePage.sectionVisibility (which only hides a teaser section ON THE
// HOME PAGE) — a toggle here fully removes the feature everywhere: the
// dedicated route 404s, the nav entry (where one exists) disappears, and the
// URL(s) drop out of sitemap.xml / get an explicit robots.txt Disallow.
//
// Every field defaults to `true` (enabled) so existing sites and pre-existing
// docs are never silently hidden the moment this global is introduced — an
// admin has to explicitly flip a switch off.
function toggle(name: string, label: string, description: string): Field {
  return {
    name,
    type: 'checkbox',
    label,
    defaultValue: true,
    admin: { description },
  }
}

export const FeatureToggles: GlobalConfig = {
  slug: 'feature-toggles',
  label: 'ფუნქციების ჩართვა/გამორთვა',
  admin: {
    group: 'საიტის ელემენტები',
    description:
      'გამორთეთ ნებისმიერი ბლოკი საიტის სრულად დასამალად: გვერდი დაბრუნებს 404-ს, მენიუდან ქრება (სადაც მენიუს პუნქტი საერთოდ არსებობს), sitemap.xml-დან იშლება და robots.txt-ში ემატება Disallow. ცვლილება მყისიერია — გვერდის განახლება საკმარისია.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        featureTogglesCache.labTests = doc?.labTests !== false
        req.payload.logger.info(
          `feature-toggles.labTests -> ${featureTogglesCache.labTests} (admin nav + frontend updated)`,
        )
      },
    ],
  },
  fields: [
    toggle(
      'labTests',
      'ლაბორატორიული ანალიზები',
      'გამორთვისას /lab-tests და ყველა კონკრეტული ანალიზის გვერდი აბრუნებს 404-ს და sitemap-იდან იშლება, ასევე "ანალიზები" ქრება Payload-ის ადმინის მენიუდანაც (და პირდაპირი URL-ითაც არ ხელმისაწვდომი იქნება) და თავზე ჰედერის მთავარი მენიუდანაც — მიუხედავად იმისა, ნავიგაციის გლობალში (Navigation → ანალიზები) ცალკე "Enabled" ჩართულია თუ არა. ორივე გადამრთველი ერთდროულად უნდა იყოს ჩართული, რომ ბმული მენიუში გამოჩნდეს.',
    ),
    {
      name: 'healthLibrary',
      type: 'checkbox',
      label: 'სამედიცინო ბიბლიოთეკა',
      defaultValue: false,
      admin: {
        description:
          'გვერდი ამჟამად გამორთულია (2026-05-30 კლიენტის მოთხოვნით) — ჩართვისას /health-library გვერდი (3D ანატომიის ვიუერი) ისევ ხელმისაწვდომი გახდება და დაემატება sitemap-ს/robots.txt-ს ნებართვას. მთავარი მენიუდან და ფუტერიდან ბმული ცალკე რჩება დამალული (ცალკე კლიენტის გადაწყვეტილება) — საჭიროების შემთხვევაში ცალკე მოითხოვეთ დაბრუნება.',
      },
    },
    toggle(
      'blog',
      'ბლოგი / სიახლეები',
      'გამორთვისას /blog და ყველა სტატიის გვერდი აბრუნებს 404-ს, ქრება მთავარი მენიუდან და sitemap-იდან.',
    ),
    toggle(
      'doctors',
      'ექიმები',
      'გამორთვისას /doctors და ექიმის ყველა პროფილის გვერდი აბრუნებს 404-ს, ქრება მთავარი მენიუდან და sitemap-იდან. გაფრთხილება: ჯავშნის ვიზარდი და სხვა გვერდები, სადაც ექიმებზეა მითითება, ცალკე შემოწმებას საჭიროებს.',
    ),
    toggle(
      'services',
      'სერვისები',
      'გამორთვისას /services და კონკრეტული სერვისის ყველა გვერდი აბრუნებს 404-ს, ქრება მთავარი მენიუდან და sitemap-იდან.',
    ),
    toggle(
      'booking',
      'ონლაინ ჯავშანი',
      'გამორთვისას /booking გვერდი აბრუნებს 404-ს. გაფრთხილება: საიტის სხვადასხვა ადგილას (მთავარი გვერდი, header-ის CTA ღილაკი და ა.შ.) არსებული "დაჯავშნეთ" ბმულები ცალკე არ იმალება — მხოლოდ საბოლოო გვერდი იბლოკება.',
    ),
    toggle(
      'faq',
      'ხშირად დასმული კითხვები (მთავარი გვერდი)',
      'გამორთვისას მთავარი გვერდის FAQ სექცია საერთოდ არ რენდერდება (მიუხედავად იმისა, "HomePage" გლობალში ცალკე სექციის ჩართვა/გამორთვა რაზეა დაყენებული).',
    ),
    toggle(
      'testimonials',
      'გამოხმაურებები / შეფასებები (საჯარო ჩვენება)',
      'გამორთვისას მიმოხილვების კარუსელი (ტესტიმონიალები) მთავარი გვერდიდან ქრება. ეს ცალკეა Google-სინქრონიზაციის ჩართვა/გამორთვისგან (იხ. ქვემოთ) — უკვე შენახული/ხელით შეყვანილი მიმოხილვები ბაზაში რჩება, უბრალოდ საიტზე აღარ ჩანს.',
    ),
    toggle(
      'googleReviewsSync',
      'Google-მიმოხილვების სინქრონიზაცია',
      'გამორთვისას ადმინის დაშბორდის "სინქრონიზაცია" ღილაკის API აღარ იმუშავებს (თუნდაც Google API გასაღები კონფიგურირებული იყოს) — ხელით დამატებული მიმოხილვები კვლავ ნორმალურად მუშაობს. ეს ცალკეა ზემოთ "ტესტიმონიალების" საჯარო ჩვენებისგან.',
    ),
    toggle(
      'promotions',
      'აქციები / სპეციალური შეთავაზებები',
      'ყურადღება: ამ საიტზე ამჟამად არ არსებობს ცალკე "აქციების" მოდული/გვერდი — ეს გადამრთველი მხოლოდ მომავალი გამოყენებისთვისაა მომზადებული და ამჟამად არაფერზე გავლენას არ ახდენს. საჭიროების შემთხვევაში დაგვიკავშირდით ფუნქციის ასაშენებლად.',
    ),
    toggle(
      'contactForm',
      'საკონტაქტო ფორმა',
      'ყურადღება: ამ საიტზე ამჟამად არ არსებობს ცალკე საკონტაქტო ფორმა (/contact გვერდზე მხოლოდ მისამართი/რუკა/ტელეფონია) — ეს გადამრთველი მხოლოდ მომავალი გამოყენებისთვისაა მომზადებული და ამჟამად არაფერზე გავლენას არ ახდენს. საჭიროების შემთხვევაში დაგვიკავშირდით ფუნქციის ასაშენებლად.',
    ),
  ],
}
