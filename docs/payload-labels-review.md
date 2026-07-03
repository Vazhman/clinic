# Payload CMS — Georgian Label Review

Every Georgian string the admin sees in the CMS, paired with its English meaning. Edit the **Georgian** column with your corrections (or write the corrected text in a 4th column) and send back — I'll apply all changes in one commit.

Source files are listed under each section so we can pinpoint where each label lives.

---

## 1. Collections

### 1.1 Doctors (`src/collections/Doctors.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | ექიმი | Doctor |
| Plural label | ექიმები | Doctors |
| Group | კონტენტი | Content |
| Collection description | ექიმების პროფილების მართვა. ფოტო, ბიოგრაფია, სპეციალიზაცია. | Manage doctor profiles. Photo, biography, specialization. |
| `slug` description | URL მისამართი (მაგ: vasil-khozrevanidze) | URL address (e.g. vasil-khozrevanidze) |
| `doctraId` description | Doctra API ექიმის ID — დაკავშირებულია ჩაწერის სისტემასთან | Doctra API doctor ID — linked to the booking system |
| `doctraBranchId` description | Doctra განყოფილების ID — პროფილზე ხელმისაწვდომი დროების საჩვენებლად | Doctra branch ID — to show available time slots on profile |
| `inactive` description | მონიშვნისას ექიმი დამალულია საიტზე და ჩაწერის ფორმაში (ჩანაწერი არ წაიშლება) | When checked, doctor is hidden from site and booking form (record is not deleted) |
| `lastUpdated` label | Last Updated | Last Updated *(English already)* |
| `lastUpdated` description | ექიმის ინფორმაციის ბოლო განახლების თარიღი — გამოჩნდება პროფილის გვერდზე | Date of last doctor-info update — shown on profile page |
| Tab 1 label | იდენტობა | Identity |
| Tab 1 description | სახელი და ფოტო — პირველი რაც პაციენტი ხედავს | Name and photo — first thing the patient sees |
| Tab 2 label | პროფილი | Profile |
| Tab 2 description | სპეციალიზაცია, ბიოგრაფია, კვალიფიკაცია | Specialization, biography, qualifications |
| `phone` description | ექიმის ტელეფონი (Doctra-დან). რედაქცია სავალდებულო არ არის — საიტზე ჩვენების გადაწყვეტილება ცალკეა. | Doctor's phone (from Doctra). Editing not required — site-display decision is separate. |
| `email` description | ექიმის ელფოსტა (Doctra-დან). იხილე phone-ის შენიშვნა. | Doctor's email (from Doctra). See phone note. |
| `biography` description | ექიმის ბიოგრაფია და გამოცდილება | Doctor's biography and experience |
| `qualifications` description | აკადემიური ხარისხები და სერტიფიკატები | Academic degrees and certificates |
| `specializations` description | სამედიცინო სპეციალიზაციები | Medical specializations |
| `experienceYears` description | სამუშაო გამოცდილება წლებში | Work experience in years |
| `isDepartmentHead` label | განყოფილების ხელმძღვანელი | Department head |
| Tab 3 label | SEO | SEO *(English already)* |
| Tab 3 description | საძიებო სისტემებისთვის (Google) — სურვილისამებრ | For search engines (Google) — optional |

#### Spoken-languages options (`languagesSpoken` select)

| Option label | Notes |
|---|---|
| ქართული 🇬🇪 / Georgian | |
| English 🇬🇧 | |
| Русский 🇷🇺 / Russian | |
| Türkçe 🇹🇷 / Turkish | |
| Deutsch 🇩🇪 / German | |
| Français 🇫🇷 / French | |
| Español 🇪🇸 / Spanish | |
| Italiano 🇮🇹 / Italian | |
| עברית 🇮🇱 / Hebrew | |
| العربية 🇸🇦 / Arabic | |
| Azərbaycanca 🇦🇿 / Azerbaijani | |
| Հայերեն 🇦🇲 / Armenian | |
| Українська 🇺🇦 / Ukrainian | |
| فارسی 🇮🇷 / Persian | |
| 中文 🇨🇳 / Chinese | |

---

### 1.2 Services (`src/collections/Services.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | სერვისი | Service |
| Plural label | სერვისები | Services |
| Group | კონტენტი | Content |
| Collection description | კლინიკის სერვისების და განყოფილებების მართვა. | Manage clinic services and departments. |
| `slug` description | URL მისამართი (მაგ: cardiology) | URL address (e.g. cardiology) |
| `doctraBranchId` description | Doctra განყოფილების ID — ჩაწერისთვის (UUID ფორმატი) | Doctra branch ID — for booking (UUID format) |
| `category` description | ჩაწერის გვერდზე კატეგორიის ფილტრი | Category filter on booking page |
| `description` description | სრული აღწერა სერვისის გვერდისთვის | Full description for the service page |
| `shortDescription` description | მოკლე აღწერა - გამოჩნდება ბარათზე | Short description — appears on the card |

---

### 1.3 CheckupPackages (`src/collections/CheckupPackages.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | ჩექაფ პაკეტი | Checkup package |
| Plural label | ჩექაფ პაკეტები | Checkup packages |
| Group | კონტენტი | Content |
| Collection description | ჩექაფ პაკეტების მართვა: ფასი, ხანგრძლივობა, ჩართული სერვისები. | Manage checkup packages: price, duration, included services. |
| `includedServices` description | ჩექაფ-პაკეტში ჩართული სერვისები — სიიდან აირჩიე ნაცვლად ხელით ჩაწერისა | Services included in the checkup package — pick from list instead of typing |
| `service` description | ნაცვლად სამივე ენაზე ცალკე ხელით ჩაწერისა — სერვისს ვირჩევთ Services კოლექციიდან და ავტომატურად მოვა მისი სახელი მიმდინარე ენაზე. | Instead of typing in three languages — pick the service from the Services collection and its name comes through in the current language automatically. |

---

### 1.4 Reviews (`src/collections/Reviews.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | შეფასება | Review |
| Plural label | შეფასებები | Reviews |
| Group | კონტენტი | Content |
| Collection description | პაციენტების შეფასებების მართვა. 'გამოქვეყნებული' ჩექბოქსი აკონტროლებს რა გამოჩნდეს საიტზე. Google-დან სინქრონიზაცია Dashboard-ის "Google შეფასებები" ღილაკით. | Manage patient reviews. The 'published' checkbox controls what shows on the site. Sync from Google via Dashboard "Google reviews" button. |
| `published` description | მონიშნულია — ჩანს საიტზე. გაუქმებულია — დამალულია. | Checked — shows on site. Unchecked — hidden. |
| `googleReviewId` description | Google-დან სინქის ID. ცარიელია "internal" შეფასებებზე. | Google sync ID. Empty for "internal" reviews. |
| `authorPhotoUrl` description | მომხმარებლის ფოტოს URL Google-დან (ავტომატური). | User-photo URL from Google (automatic). |

---

### 1.5 News (`src/collections/News.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | სიახლე | News article |
| Plural label | სიახლეები | News |
| Group | კონტენტი | Content |
| Collection description | სიახლეების და სტატიების მართვა. აქ შეგიძლიათ შექმნათ ბლოგ პოსტები. | Manage news and articles. You can create blog posts here. |
| `title` description | სტატიის სათაური | Article title |
| `slug` description | URL მისამართი (მაგ: my-article) | URL address (e.g. my-article) |
| `excerpt` description | მოკლე აღწერა - გამოჩნდება ბარათზე | Short description — appears on the card |
| `content` description | დაამატეთ ბლოკები: ტექსტი, სურათი, ციტატა და სხვა | Add blocks: text, image, quote, etc. |
| `showOnHomepage` description | *(currently English in code: "Show this article on the home page")* | Show this article on the home page |
| `homepageOrder` description | *(currently English: "Order on home page (lower = first)")* | Order on home page (lower = first) |

---

### 1.6 Pages (`src/collections/Pages.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | გვერდი | Page |
| Plural label | გვერდები | Pages |
| Group | კონტენტი | Content |
| Collection description | საიტის გვერდების შექმნა და მართვა. გამოიყენეთ ბლოკები გვერდის ასაწყობად. | Create and manage site pages. Use blocks to build the page. |
| `title` description | გვერდის სათაური. გამოჩნდება ბრაუზერის ჩანართზე + breadcrumb-ში. | Page title. Shown in the browser tab and in the breadcrumb. |
| `slug` description | URL მისამართი (მხოლოდ ლათინური ასოები, ციფრები, "-"; მაგ: about-us). გვერდი იხსნება /pages/<slug>-ზე. უნდა იყოს უნიკალური. | URL address (only Latin letters, digits, "-"; e.g. about-us). Page opens at /pages/<slug>. Must be unique. |
| `status` option 1 | მონახაზი (საიტზე არ ჩანს) | Draft (not visible on site) |
| `status` option 2 | გამოქვეყნებული (ხილვადია საიტზე) | Published (visible on site) |
| `status` description | ახალი გვერდი იწყება "მონახაზად". შევსების შემდეგ ცვალე "გამოქვეყნებულზე" — საიტზე გამოჩნდება მხოლოდ მაშინ. | A new page starts as "draft". After filling it in, change to "published" — only then will it appear on the site. |
| `layout` description | გვერდის ბლოკები: ჰერო, ტექსტი, FAQ, გალერეა და სხვა. გადაათრიეთ თანმიმდევრობის შესაცვლელად. ⚠️ ბლოკის სტრუქტურა ლოკალური ენაზე — ენის ცვლისას ცარიელად დაიწყება და უნდა აიწყოს ხელახლა. | Page blocks: hero, text, FAQ, gallery, etc. Drag to reorder. ⚠️ Block structure is per-language — switching language starts empty and must be rebuilt. |

---

### 1.7 Media (`src/collections/Media.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | მედია | Media |
| Plural label | მედია | Media |

---

### 1.8 Users (`src/collections/Users.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Singular label | მომხმარებელი | User |
| Plural label | მომხმარებლები | Users |
| Group | ადმინი | Admin |
| `role` options | Admin, Editor *(English already)* | Admin, Editor |

---

## 2. Globals

### 2.1 HomePage (`src/globals/HomePage.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | მთავარი გვერდი | Home page |
| Group | გვერდები | Pages |
| Global description | მთავარი გვერდის კონტენტის მართვა: ჰერო სექცია, გალერეა, CTA ტექსტები. | Manage home page content: hero section, gallery, CTA texts. |
| `hero` group label | ჰერო სექცია | Hero section |
| `hero.headline` description | მთავარი სათაური | Main title |
| `hero.subheadline` description | ქვესათაური | Subtitle |
| `hero.bookButtonText` description | ჯავშნის ღილაკის ტექსტი | Booking button text |
| `hero.consultButtonText` description | კონსულტაციის ღილაკის ტექსტი | Consultation button text |
| `hero.badgeText` description | პატარა ტექსტი ზემოთ (მაგ: 2015 წლიდან მოქმედი) | Small text above (e.g. Operating since 2015) |
| `heroSlides` label | გალერეის სლაიდები | Gallery slides |
| `heroSlides` description | ჰერო სექციის სურათები (5 რეკომენდებული) | Hero-section images (5 recommended) |
| `heroSlides.label` description | სლაიდის ტექსტი | Slide text |
| `trustStrip` label | სანდოობის ზოლი | Trust strip |
| `trustStrip` description | ჰერო სექციის ქვედა ნაწილი | Bottom part of hero section |
| `trustStrip.doctorCount` description | მაგ: 54 ექიმი | e.g. 54 doctors |
| `trustStrip.patientCount` description | მაგ: 15,000+ პაციენტი | e.g. 15,000+ patients |
| `symptomNavigator` label | სიმპტომების ნავიგატორი | Symptom navigator |
| `symptomNavigator.placeholder` description | საძიებო ველის placeholder | Search-field placeholder |

---

### 2.2 AboutPage (`src/globals/AboutPage.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | ჩვენ შესახებ | About us |
| Group | გვერდები | Pages |
| Global description | "ჩვენ შესახებ" გვერდის კონტენტის მართვა. | Manage "About us" page content. |
| `description` field description | მთავარი აღწერა | Main description |
| `highlights` label | მთავარი მახასიათებლები | Main highlights |
| `highlights` description | მაგ: ხარისხი, პროფესიონალიზმი, დაარსდა 2015... | e.g. Quality, professionalism, founded 2015... |
| `highlights.icon` description | ემოჯი ან ხატულა (მაგ: ✓) | Emoji or icon (e.g. ✓) |
| `stats` label | სტატისტიკა | Statistics |
| `stats` description | მაგ: დაარსდა 2015, 40 საწოლი... | e.g. Founded 2015, 40 beds... |

---

### 2.3 ContactPage (`src/globals/ContactPage.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | საკონტაქტო გვერდი | Contact page |
| Group | გვერდები | Pages |
| Global description | საკონტაქტო გვერდის კონტენტის მართვა. | Manage contact page content. |
| `address` group label | მისამართი | Address |
| `address.mapLatitude` description | Google Maps განედი | Google Maps latitude |
| `address.mapLongitude` description | Google Maps გრძედი | Google Maps longitude |
| `phone` group label | ტელეფონი | Phone |
| `phone.display` description | საჩვენებელი ფორმატი (მაგ: +995 (0422) 227171) | Display format (e.g. +995 (0422) 227171) |
| `email` group label | ელფოსტა | Email |
| `workingHours` group label | სამუშაო საათები | Working hours |
| `workingHours.weekdays` description | მაგ: ორშაბათი - პარასკევი: 09:00-18:00 | e.g. Monday - Friday: 09:00-18:00 |
| `workingHours.weekends` description | მაგ: შაბათი - კვირა: 09:30-17:00 | e.g. Saturday - Sunday: 09:30-17:00 |
| `contactFormTitle` description | საკონტაქტო ფორმის სათაური | Contact form title |

---

### 2.4 Footer (`src/globals/Footer.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | ფუტერი | Footer |
| Group | საიტის ელემენტები | Site elements |
| Global description | საიტის ქვედა ნაწილის (ფუტერის) კონტენტის მართვა. | Manage site footer content. |
| `description` field description | კლინიკის მოკლე აღწერა ფუტერში | Brief clinic description in footer |
| `quickLinks` label | სწრაფი ბმულები | Quick links |
| `quickLinks.href` description | ბმული (მაგ: /services) | Link (e.g. /services) |
| `socialLinks` label | სოციალური ქსელები | Social networks |
| `copyright` description | საავტორო უფლებების ტექსტი | Copyright text |
| `whatsappNumber` description | WhatsApp ნომერი (მაგ: 995422227171) | WhatsApp number (e.g. 995422227171) |

---

### 2.5 Navigation (`src/globals/Navigation.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | ნავიგაცია | Navigation |
| Group | საიტის ელემენტები | Site elements |
| Global description | საიტის ნავიგაციის მენიუს მართვა. | Manage site navigation menu. |
| `mainMenu` label | მთავარი მენიუ | Main menu |
| `mainMenu` description | ზედა ნავიგაციის ბმულები | Top navigation links |
| `mainMenu.label` description | მენიუს ელემენტის სახელი | Menu-item name |
| `mainMenu.href` description | ბმული (მაგ: /services, /doctors) | Link (e.g. /services, /doctors) |
| `mainMenu.isHighlighted` description | გამოყოფილი ღილაკის სტილით (მაგ: "ჯავშანი") | Highlighted button style (e.g. "Book") |
| `ctaButton` label | CTA ღილაკი | CTA button |
| `ctaButton` description | ნავიგაციის მარჯვენა მხარეს ღილაკი | Button on the right side of navigation |

---

### 2.6 BookingPage (`src/globals/BookingPage.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | ჯავშნის გვერდი | Booking page |
| Group | გვერდები | Pages |
| Global description | ონლაინ ჯავშნის გვერდის კონტენტის მართვა. | Manage online booking page content. |
| `steps` label | ნაბიჯების ტექსტები | Step texts |
| `form` label | ფორმის ტექსტები | Form texts |

---

### 2.7 SiteSettings (`src/globals/SiteSettings.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Label | საიტის პარამეტრები | Site settings |
| Global description | მთავარ გვერდზე ნაჩვენები სტატისტიკის რიცხვები. საკონტაქტო მონაცემები არის "საკონტაქტო გვერდი" გლობალში (გვერდები → საკონტაქტო გვერდი). | Statistics numbers shown on the home page. Contact data lives in the "Contact page" global (Pages → Contact page). |
| `stats` group label | სტატისტიკა | Statistics |
| `stats` description | მთავარ გვერდზე ნაჩვენები რიცხვები — შეგიძლია ცვალო | Numbers shown on the home page — you can change them |
| `stats.patients` description | პაციენტების რაოდენობა (მაგ: 15000) | Number of patients (e.g. 15000) |
| `stats.doctors` description | ექიმების რაოდენობა (მაგ: 54) | Number of doctors (e.g. 54) |
| `stats.operations` description | ოპერაციების რაოდენობა (მაგ: 5000) | Number of operations (e.g. 5000) |
| `stats.experience` description | წლების გამოცდილება (მაგ: 9) | Years of experience (e.g. 9) |
| `lastDoctraSync` description | ბოლო Doctra სინქრონიზაციის დრო — ავტომატურად განახლდება იმპორტის შემდეგ | Last Doctra sync time — auto-updated after import |

---

## 3. Locale picker (`src/payload.config.ts`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Locale label `ge` | ქართული ვერსია (საიტი /ge) | Georgian version (site /ge) |
| Locale label `en` | English version (site /en) | *(English already)* |
| Locale label `ru` | რუსული ვერსია (საიტი /ru) | Russian version (site /ru) |

---

## 4. SEO fields (`src/fields/seo.ts`) — used inside Doctors, Services, News, Pages

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Group label | SEO | SEO |
| Group description | საძიებო სისტემების ოპტიმიზაცია | Search-engine optimization |
| `metaTitle` description | დატოვეთ ცარიელი ავტომატური გენერაციისთვის. მაქს. 60 სიმბოლო. | Leave empty for auto-generation. Max 60 chars. |
| `metaDescription` description | დატოვეთ ცარიელი excerpt-ის გამოსაყენებლად. მაქს. 160 სიმბოლო. | Leave empty to use the excerpt. Max 160 chars. |
| `ogImage` description | სოციალური ქსელებისთვის სურათი. დატოვეთ ცარიელი featured image-ის გამოსაყენებლად. | Image for social networks. Leave empty to use featured image. |
| `noIndex` description | ჩართვით ეს გვერდი არ მოხვდება Google-ის ძიებაში. | If checked, this page won't appear in Google search. |

---

## 5. Dashboard (`src/components/admin/Dashboard.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Welcome banner heading | მოგესალმებით 👋 | Welcome 👋 |
| Welcome banner subtitle | ხოზრევანიძის კლინიკის ადმინ-პანელი | Khozrevanidze Clinic admin panel |
| Section header | კონტენტი | Content |
| Section header | სწრაფი მოქმედებები | Quick actions |
| Stat card | ექიმები | Doctors |
| Stat card | სერვისები | Services |
| Stat card | სიახლეები | News |
| Stat card | გვერდები | Pages |
| Stat card | შეფასებები | Reviews |
| Stat card | ჩექაფები | Checkups |
| Quick action | სიახლის დამატება | Add news |
| Quick action | გვერდის შექმნა | Create page |
| Quick action | ექიმის დამატება | Add doctor |
| View site button | საიტის ნახვა | View site |

---

## 6. Doctra Sync Card (`src/components/admin/DoctraSyncCard.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Card heading | Doctra სინქრონიზაცია | Doctra synchronization |
| Last-sync prefix | ბოლო სინქრონი: | Last sync: |
| Never synced | ჯერ არ არის სინქრონიზებული | Not synced yet |
| Just now | ახლახანს | Just now |
| Minutes ago suffix | წუთის წინ | minute(s) ago |
| Hours ago suffix | საათის წინ | hour(s) ago |
| Days ago suffix | დღის წინ | day(s) ago |
| Description line 1 | ⤓ რას აკეთებს: ჩამოვა Doctra-დან ექიმების და სერვისების სია, ჩაიწერება Payload-ში. ახალი ექიმი დაიწერება ქართულად + ინგლისურად + რუსულად (RU = placeholder). | ⤓ What it does: pulls list of doctors and services from Doctra, writes to Payload. New doctor is written in Georgian + English + Russian (RU = placeholder). |
| Description line 2 | ✋ რას არ ცვლის: უკვე რედაქტირებული ექიმის სახელი / სპეციალობა / ბიოგრაფია / ფოტო. შენი ცვლილებები დაცულია. | ✋ What it doesn't change: already-edited doctor name / specialty / biography / photo. Your edits are preserved. |
| Description line 3 | ⏱ დრო: ~5–15 წამი (Doctra-ს სიჩქარის მიხედვით). | ⏱ Time: ~5–15 seconds (depending on Doctra's speed). |
| Action button | სინქრონიზაცია ახლა | Sync now |
| Running step 1 | ვითხოვ Doctra-ს განყოფილებებს... | Requesting Doctra departments... |
| Running step 2 | ვიღებ ექიმებს... | Fetching doctors... |
| Running step 3 | ვწერ Payload-ში... | Writing to Payload... |
| Success heading | ✓ სინქრონიზაცია დასრულდა | ✓ Sync completed |
| Success summary | ექიმები: +X ახალი, X განახლებული, X გამოტოვებული · სერვისები: +X ახალი, X განახლებული · X შეცდომა | Doctors: +X new, X updated, X skipped · Services: +X new, X updated · X errors |
| Hide errors | დამალე შეცდომები | Hide errors |
| Show errors | იხილე X შეცდომა | View X error(s) |
| Close button | დახურვა | Close |
| Already current | ბაზა უკვე განახლებული იყო | Database was already up to date |
| Error heading | ✗ სინქრონიზაცია ვერ მოხერხდა | ✗ Sync failed |
| Retry button | თავიდან ცდა | Try again |
| Generic error | ქსელის პრობლემა | Network problem |

---

## 7. Needs Attention Card (`src/components/admin/NeedsAttentionCard.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Section header | საჭიროებს ყურადღებას | Needs attention |
| All-clear summary | ✓ ყველაფერი წესრიგშია — შესასწორებელი არაფერია | ✓ Everything is in order — nothing to fix |
| Has-issues summary | ⚠ X ჯამური საქმე — დააწექი კარტას სრული სიის სანახავად | ⚠ X total issues — click a card to see the full list |
| Tile 1 label | ფოტო აკლია | Photo missing |
| Tile 2 label | სპეციალობა შესავსებია | Specialty needs filling |
| Tile 3 label | დამალული ექიმები | Hidden doctors |
| Tile 4 label | რუსული თარგმანი აკლია | Russian translation missing |
| Tile clear status | ✓ წესრიგშია — შესასწორებელი არაა | ✓ In order — nothing to fix |
| Tile issue status | X-მა საქმემ ყურადღება სჭირდება → იხილე სია | X issues need attention → see the list |

---

## 8. Doctor List Filters (`src/components/admin/DoctorListFilters.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Preset chip | ყველა ექიმი | All doctors |
| Preset chip | ფოტო აკლია | Photo missing |
| Preset chip | სპეციალობა შესავსებია | Specialty needs filling |
| Preset chip | დამალული | Hidden |
| Preset explainer 2 | ექიმები რომელთაც ფოტო ჯერ არ აქვთ ატვირთული | Doctors who haven't uploaded a photo yet |
| Preset explainer 3 | ექიმები რომელთა სპეციალობა Doctra-დან ცარიელია ("—" placeholder-ით) | Doctors whose specialty is empty from Doctra (with "—" placeholder) |
| Preset explainer 4 | ექიმები რომელთა inactive checkbox მონიშნულია — საიტზე არ ჩანან, ჩაწერა გათიშულია | Doctors with inactive checkbox checked — not visible on site, booking disabled |
| Active filter banner | 🔍 აქტიური ფილტრი: | 🔍 Active filter: |
| Clear button | ↺ ფილტრის გასუფთავება | ↺ Clear filter |

---

## 9. Google Reviews Sync Card (`src/components/admin/GoogleReviewsSyncCard.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Card heading | Google შეფასებების სინქი | Google reviews sync |
| Description line 1 | ⤓ რას აკეთებს: Google Places API-დან ჩამოვა კლინიკის შესახებ დაწერილი შეფასებები (5 ყველაზე რელევანტური). ჩაიწერება Payload-ში. | ⤓ What it does: Pulls reviews about the clinic from Google Places API (5 most-relevant). Writes to Payload. |
| Description line 2 | 🔒 გამოუქვეყნებელია: ახალი შეფასებები ჯერ არ გამოჩნდება საიტზე — შენ უნდა გადახედო და "გამოქვეყნებული" ჩექბოქსი მონიშნო. | 🔒 Unpublished: new reviews won't appear on the site yet — you must review and check the "published" checkbox. |
| Description line 3 | ⚙️ დაყენება: საჭიროა Vercel env ცვლადები — GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. ინსტრუქცია: docs/HANDOVER.md. | ⚙️ Setup: requires Vercel env vars — GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. Instructions: docs/HANDOVER.md. |
| Sync button | სინქი ახლა | Sync now |
| Running message | Google-დან შეფასებების მოპოვება… | Fetching reviews from Google… |
| Running ETA | ~5 წამი | ~5 seconds |
| Success heading | ✓ Google შეფასებების სინქი დასრულდა | ✓ Google reviews sync completed |
| Success stats | მოპოვებული: X · ახალი: +X · განახლებული: X · გამოტოვებული: X | Fetched: X · New: +X · Updated: X · Skipped: X |
| Post-success hint | ⚠ ახალი შეფასებები გამოუქვეყნებელია. გადით შეფასებების სია და მონიშნე "გამოქვეყნებული" იმათ ვინც გნებავთ ჩვენება. | ⚠ New reviews are unpublished. Go to the reviews list and check "published" for the ones you want shown. |
| Hint link text | შეფასებების სია | Reviews list |
| Close button | დახურვა | Close |
| Error heading | ✗ Google შეფასებების სინქი ვერ მოხერხდა | ✗ Google reviews sync failed |
| Error hint | შეამოწმე Vercel-ის env ცვლადები: GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. დაყენების ინსტრუქცია: docs/HANDOVER.md → Google Reviews setup. | Check Vercel env vars: GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID. Setup instructions: docs/HANDOVER.md → Google Reviews setup. |
| Retry button | თავიდან ცდა | Try again |
| Generic error | ქსელის პრობლემა | Network problem |
| Empty-fetch hint | არცერთი შეფასება არ წამოვიდა — შეამოწმე GOOGLE_PLACES_API_KEY და GOOGLE_PLACE_ID env ცვლადები. | No reviews came in — check GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID env vars. |

---

## 10. Locale Hint Banner (`src/components/admin/LocaleHintBanner.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Heading prefix | ამჟამად რედაქტირებთ: | Currently editing: |
| Body | ცარიელი ველი ნიშნავს, რომ ეს ჩანაწერი ამ ენაზე ჯერ არ ითარგმნა. სხვა ენაში გადასასვლელად — ზედა მარჯვენა "Locale" გადამრთველი. | An empty field means this record hasn't been translated to this language yet. To switch to another language — use the top-right "Locale" switcher. |

---

## 11. After-Nav Links (`src/components/admin/AfterNavLinks.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Dashboard link | 🏠 მთავარი (Dashboard) | 🏠 Home (Dashboard) |
| Site link | 🌐 საიტის ნახვა | 🌐 View site |

---

## 12. Login Page (`src/components/admin/BeforeLogin.tsx` + `AfterLogin.tsx`)

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Login heading | ხოზრევანიძის კლინიკა | Khozrevanidze Clinic |
| Login subtitle | ადმინისტრაციული პანელი | Administrative panel |

---

## 13. Doctor Row Actions / View Live Button

| Where | Georgian (current) | English (meaning) |
|---|---|---|
| Disabled tooltip (list cell) | ექიმი დამალულია — საიტზე ვერ ნახავთ | Doctor is hidden — won't see on site |
| Enabled tooltip (list cell) | საიტზე ნახვა | View on site |
| Enabled tooltip (edit form button) | ექიმის გვერდი ახალ ფანჯარაში | Doctor page in new window |
| Button text (edit form) | საიტზე ნახვა | View on site |

---

## How to send corrections

Easiest: just edit the **Georgian** column directly in this file (in VS Code or any markdown editor) with the corrected wording, then either:
1. commit + push, or
2. send me the diff, or
3. send back this file with the corrections.

I'll apply changes in a single commit.
