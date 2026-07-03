# Payload CMS — Translation Reference

Every user-facing string in the Payload admin, grouped by file. Strings already in Georgian are marked **[already Georgian]**. English strings need translation if you want a fully-Georgian admin.

The "Path" column gives you a breadcrumb so you can find the string when editing the file.

---

## Collections

### `src/collections/News.ts` — Articles

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | სიახლე | Georgian | Collection singular name |
| labels.plural | სიახლეები | Georgian | Collection plural name |
| admin.description | სიახლეების და სტატიების მართვა. აქ შეგიძლიათ შექმნათ ბლოგ პოსტები. | Georgian | Description on the collection list page |
| admin.group | კონტენტი | Georgian | Sidebar group label |
| collapsible[0].label | სტატიის შინაარსი | Georgian | Collapsible card label for the article body section |
| collapsible[1].label | საძიებო სისტემები (SEO) | Georgian | Collapsible card label for the SEO section |
| title.admin.description | სტატიის სათაური | Georgian | Helper text under the Title input |
| body.admin.description | დაიწერეთ ტექსტი, ჩასვით სურათები სასურველ ადგილას, აირჩიეთ მათი სტილი (ჩარჩო, ჩრდილი). „+" ღილაკით ჩასვით შენიშვნა ან გალერეა. | Georgian | Helper text under the Body rich-text editor |
| slug.admin.description | URL მისამართი (მაგ: my-article) | Georgian | Helper text under the Slug input |
| featuredImage.admin.description | ბარათზე და სტატიის თავში გამოსაჩენი სურათი | Georgian | Helper text under the Featured Image upload |
| excerpt.admin.description | მოკლე აღწერა — გამოჩნდება ბარათზე და SEO meta-description-ში. | Georgian | Helper text under the Excerpt textarea |
| category.options[0].label | Health Tips | English | Select option label |
| category.options[1].label | Clinic News | English | Select option label |
| category.options[2].label | Medical Info | English | Select option label |
| category.options[3].label | Announcements | English | Select option label |
| author.admin.description | ავტორის სახელი (არასავალდებულო) | Georgian | Helper text under the Author input |
| status.options[0].label | Draft | English | Select option label |
| status.options[1].label | Published | English | Select option label |
| showOnHomepage.admin.description | Show this article on the home page | English | Helper text under the Show on Homepage checkbox |
| homepageOrder.admin.description | Order on home page (lower = first) | English | Helper text under the Homepage Order number input |

---

### `src/collections/Doctors.ts` — Doctors

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | ექიმი | Georgian | Collection singular name |
| labels.plural | ექიმები | Georgian | Collection plural name |
| admin.description | ექიმების პროფილების მართვა. ფოტო, ბიოგრაფია, სპეციალიზაცია. | Georgian | Description on the collection list page |
| admin.group | კონტენტი | Georgian | Sidebar group label |
| viewLive.label | (single space) | — | UI-only field; the space is intentional (no visible label) |
| slug.admin.description | URL მისამართი (მაგ: vasil-khozrevanidze) | Georgian | Helper text under the Slug input |
| doctraId.admin.description | Doctra API ექიმის ID — დაკავშირებულია ჩაწერის სისტემასთან | Georgian | Helper text under the Doctra ID input |
| doctraBranchId.admin.description | Doctra განყოფილების ID — პროფილზე ხელმისაწვდომი დროების საჩვენებლად | Georgian | Helper text under the Doctra Branch ID input |
| inactive.admin.description | მონიშვნისას ექიმი დამალულია საიტზე და ჩაწერის ფორმაში (ჩანაწერი არ წაიშლება) | Georgian | Helper text under the Inactive checkbox |
| lastUpdated.label | Last Updated | English | Field label for the date picker |
| lastUpdated.admin.description | ექიმის ინფორმაციის ბოლო განახლების თარიღი — გამოჩნდება პროფილის გვერდზე | Georgian | Helper text under the Last Updated date picker |
| tabs[0].label | იდენტობა | Georgian | Tab label |
| tabs[0].description | სახელი და ფოტო — პირველი რაც პაციენტი ხედავს | Georgian | Tab description |
| tabs[1].label | პროფილი | Georgian | Tab label |
| tabs[1].description | სპეციალიზაცია, ბიოგრაფია, კვალიფიკაცია | Georgian | Tab description |
| tabs[2].label | SEO | English | Tab label (intentionally English) |
| tabs[2].description | საძიებო სისტემებისთვის (Google) — სურვილისამებრ | Georgian | Tab description |
| phone.admin.description | ექიმის ტელეფონი (Doctra-დან). რედაქცია სავალდებულო არ არის — საიტზე ჩვენების გადაწყვეტილება ცალკეა. | Georgian | Helper text under the Phone input |
| email.admin.description | ექიმის ელფოსტა (Doctra-დან). იხილე phone-ის შენიშვნა. | Georgian | Helper text under the Email input |
| biography.admin.description | ექიმის ბიოგრაფია და გამოცდილება | Georgian | Helper text under the Biography rich-text editor |
| qualifications.admin.description | აკადემიური ხარისხები და სერტიფიკატები | Georgian | Helper text under the Qualifications array |
| specializations.admin.description | სამედიცინო სპეციალიზაციები | Georgian | Helper text under the Specializations array |
| experienceYears.admin.description | სამუშაო გამოცდილება წლებში | Georgian | Helper text under the Experience Years number input |
| languagesSpoken.language.options[0].label | ქართული 🇬🇪 / Georgian | Georgian | Select option label |
| languagesSpoken.language.options[1].label | English 🇬🇧 | English | Select option label |
| languagesSpoken.language.options[2].label | Русский 🇷🇺 / Russian | Russian | Select option label |
| languagesSpoken.language.options[3].label | Türkçe 🇹🇷 / Turkish | Turkish | Select option label |
| languagesSpoken.language.options[4].label | Deutsch 🇩🇪 / German | German | Select option label |
| languagesSpoken.language.options[5].label | Français 🇫🇷 / French | French | Select option label |
| languagesSpoken.language.options[6].label | Español 🇪🇸 / Spanish | Spanish | Select option label |
| languagesSpoken.language.options[7].label | Italiano 🇮🇹 / Italian | Italian | Select option label |
| languagesSpoken.language.options[8].label | עברית 🇮🇱 / Hebrew | Hebrew | Select option label |
| languagesSpoken.language.options[9].label | العربية 🇸🇦 / Arabic | Arabic | Select option label |
| languagesSpoken.language.options[10].label | Azərbaycanca 🇦🇿 / Azerbaijani | Azerbaijani | Select option label |
| languagesSpoken.language.options[11].label | Հայերեն 🇦🇲 / Armenian | Armenian | Select option label |
| languagesSpoken.language.options[12].label | Українська 🇺🇦 / Ukrainian | Ukrainian | Select option label |
| languagesSpoken.language.options[13].label | فارسی 🇮🇷 / Persian | Persian | Select option label |
| languagesSpoken.language.options[14].label | 中文 🇨🇳 / Chinese | Chinese | Select option label |
| isDepartmentHead.label | განყოფილების ხელმძღვანელი | Georgian | Checkbox label |

---

### `src/collections/Services.ts` — Services

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | სერვისი | Georgian | Collection singular name |
| labels.plural | სერვისები | Georgian | Collection plural name |
| admin.description | კლინიკის სერვისების და განყოფილებების მართვა. | Georgian | Description on the collection list page |
| admin.group | კონტენტი | Georgian | Sidebar group label |
| slug.admin.description | URL მისამართი (მაგ: cardiology) | Georgian | Helper text under the Slug input |
| doctraBranchId.admin.description | Doctra განყოფილების ID — ჩაწერისთვის (UUID ფორმატი) | Georgian | Helper text under the Doctra Branch ID input |
| category.admin.description | ჩაწერის გვერდზე კატეგორიის ფილტრი | Georgian | Helper text under the Category select |
| category.options[0].label | Cardiology | English | Select option label |
| category.options[1].label | Neurology | English | Select option label |
| category.options[2].label | Surgery | English | Select option label |
| category.options[3].label | Pediatric | English | Select option label |
| category.options[4].label | Diagnostics | English | Select option label |
| category.options[5].label | Other | English | Select option label |
| shortDescription.admin.description | 1 წინადადება (მოკლე ფრაზა). ჩანს 3 ადგილზე: (1) სერვისების სიის ბარათზე /services-ზე, (2) მთავარი გვერდის სერვისების ბადეზე, (3) სერვისის გვერდის ჰერო-სათაურის ქვეშ /services/<slug>. ასევე SEO meta description-ად Google-ისთვის. | Georgian | Helper text under the Short Description input |
| description.admin.description | სრული აღწერა — რამდენიმე წინადადება ან აბზაცი. ჩანს მხოლოდ ერთ ადგილზე: სერვისის გვერდის სხეულში /services/<slug>, ჰერო-სათაურის ქვემოთ. სიის ბარათებზე და მთავარ გვერდზე არ ჩანს. | Georgian | Helper text under the Description textarea |
| icon.options[0].label | Heart | English | Select option label (displayed by custom IconPicker component) |
| icon.options[1].label | Brain | English | Select option label |
| icon.options[2].label | Baby | English | Select option label |
| icon.options[3].label | Brain Circuit | English | Select option label |
| icon.options[4].label | Flask | English | Select option label |
| icon.options[5].label | Ear | English | Select option label |
| icon.options[6].label | Scissors | English | Select option label |
| icon.options[7].label | Activity | English | Select option label |

---

### `src/collections/CheckupPackages.ts` — Checkup Packages

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | ჩექაფ პაკეტი | Georgian | Collection singular name |
| labels.plural | ჩექაფ პაკეტები | Georgian | Collection plural name |
| admin.description | ჩექაფ პაკეტების მართვა: ფასი, ჩართული სერვისები. | Georgian | Description on the collection list page |
| admin.group | კონტენტი | Georgian | Sidebar group label |
| includedServices.admin.description | ჩექაფ-პაკეტში ჩართული სერვისები — სიიდან აირჩიე ნაცვლად ხელით ჩაწერისა | Georgian | Helper text under the Included Services array |
| includedServices.service.admin.description | ნაცვლად სამივე ენაზე ცალკე ხელით ჩაწერისა — სერვისს ვირჩევთ Services კოლექციიდან და ავტომატურად მოვა მისი სახელი მიმდინარე ენაზე. | Georgian | Helper text under the relationship picker inside each row |

---

### `src/collections/Reviews.ts` — Reviews

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | შეფასება | Georgian | Collection singular name |
| labels.plural | შეფასებები | Georgian | Collection plural name |
| admin.description | პაციენტების შეფასებების მართვა. 'გამოქვეყნებული' ჩექბოქსი აკონტროლებს რა გამოჩნდეს საიტზე. Google-დან სინქრონიზაცია Dashboard-ის "Google შეფასებები" ღილაკით. | Georgian | Description on the collection list page |
| admin.group | კონტენტი | Georgian | Sidebar group label |
| source.options[0].label | Google | English | Select option label |
| source.options[1].label | Internal | English | Select option label |
| published.admin.description | მონიშნულია — ჩანს საიტზე. გაუქმებულია — დამალულია. | Georgian | Helper text under the Published checkbox |
| googleReviewId.admin.description | Google-დან სინქის ID. ცარიელია "internal" შეფასებებზე. | Georgian | Helper text under the Google Review ID input |
| authorPhotoUrl.admin.description | მომხმარებლის ფოტოს URL Google-დან (ავტომატური). | Georgian | Helper text under the Author Photo URL input |

---

### `src/collections/Pages.ts` — Pages

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | გვერდი | Georgian | Collection singular name |
| labels.plural | გვერდები | Georgian | Collection plural name |
| admin.description | საიტის გვერდების შექმნა და მართვა. გამოიყენეთ ბლოკები გვერდის ასაწყობად. | Georgian | Description on the collection list page |
| admin.group | კონტენტი | Georgian | Sidebar group label |
| title.admin.description | გვერდის სათაური. გამოჩნდება ბრაუზერის ჩანართზე + breadcrumb-ში. | Georgian | Helper text under the Title input |
| slug.admin.description | URL მისამართი (მხოლოდ ლათინური ასოები, ციფრები, "-"; მაგ: about-us). გვერდი იხსნება /pages/<slug>-ზე. უნდა იყოს უნიკალური. | Georgian | Helper text under the Slug input |
| status.options[0].label | მონახაზი (საიტზე არ ჩანს) | Georgian | Select option label |
| status.options[1].label | გამოქვეყნებული (ხილვადია საიტზე) | Georgian | Select option label |
| status.admin.description | ახალი გვერდი იწყება "მონახაზად". შევსების შემდეგ ცვალე "გამოქვეყნებულზე" — საიტზე გამოჩნდება მხოლოდ მაშინ. | Georgian | Helper text under the Status select |
| layout.admin.description | გვერდის ბლოკები: ჰერო, ტექსტი, FAQ, გალერეა და სხვა. გადაათრიეთ თანმიმდევრობის შესაცვლელად. ⚠️ ბლოკის სტრუქტურა ლოკალური ენაზე — ენის ცვლისას ცარიელად დაიწყება და უნდა აიწყოს ხელახლა. | Georgian | Helper text under the Layout blocks editor |

---

### `src/collections/Media.ts` — Media

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | მედია | Georgian | Collection singular name |
| labels.plural | მედია | Georgian | Collection plural name |

---

### `src/collections/Users.ts` — Users

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | მომხმარებელი | Georgian | Collection singular name |
| labels.plural | მომხმარებლები | Georgian | Collection plural name |
| admin.group | ადმინი | Georgian | Sidebar group label |
| role.options[0].label | Admin | English | Select option label |
| role.options[1].label | Editor | English | Select option label |

---

## Globals

### `src/globals/SiteSettings.ts` — Site Settings

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | საიტის პარამეტრები | Georgian | Global label in the admin sidebar |
| admin.description | მთავარ გვერდზე ნაჩვენები სტატისტიკის რიცხვები. საკონტაქტო მონაცემები არის "საკონტაქტო გვერდი" გლობალში (გვერდები → საკონტაქტო გვერდი). | Georgian | Description shown at the top of the settings form |
| stats.label | სტატისტიკა | Georgian | Group label |
| stats.admin.description | მთავარ გვერდზე ნაჩვენები რიცხვები — შეგიძლია ცვალო | Georgian | Helper text under the Stats group |
| stats.patients.admin.description | პაციენტების რაოდენობა (მაგ: 15000) | Georgian | Helper text under the Patients number input |
| stats.doctors.admin.description | ექიმების რაოდენობა (მაგ: 54) | Georgian | Helper text under the Doctors number input |
| stats.operations.admin.description | ოპერაციების რაოდენობა (მაგ: 5000) | Georgian | Helper text under the Operations number input |
| stats.experience.admin.description | წლების გამოცდილება (მაგ: 9) | Georgian | Helper text under the Experience Years number input |
| lastDoctraSync.admin.description | ბოლო Doctra სინქრონიზაციის დრო — ავტომატურად განახლდება იმპორტის შემდეგ | Georgian | Helper text — field is hidden; only seen if unhidden |

---

### `src/globals/HomePage.ts` — Home Page

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | მთავარი გვერდი | Georgian | Global label in the admin sidebar |
| admin.description | მთავარი გვერდის კონტენტის მართვა: ჰერო სექცია, გალერეა, CTA ტექსტები. | Georgian | Description shown at the top of the form |
| admin.group | გვერდები | Georgian | Sidebar group label |
| hero.label | ჰერო სექცია | Georgian | Group label |
| hero.headline.admin.description | მთავარი სათაური | Georgian | Helper text under the Headline input |
| hero.subheadline.admin.description | ქვესათაური | Georgian | Helper text under the Subheadline input |
| hero.bookButtonText.admin.description | ჯავშნის ღილაკის ტექსტი | Georgian | Helper text under the Book Button Text input |
| hero.consultButtonText.admin.description | კონსულტაციის ღილაკის ტექსტი | Georgian | Helper text under the Consult Button Text input |
| hero.badgeText.admin.description | პატარა ტექსტი ზემოთ (მაგ: 2015 წლიდან მოქმედი) | Georgian | Helper text under the Badge Text input |
| heroSlides.label | გალერეის სლაიდები | Georgian | Array label |
| heroSlides.admin.description | ჰერო სექციის სურათები (5 რეკომენდებული) | Georgian | Helper text under the Hero Slides array |
| heroSlides.label.admin.description | სლაიდის ტექსტი | Georgian | Helper text under each slide's Label input |
| trustStrip.label | სანდოობის ზოლი | Georgian | Group label |
| trustStrip.admin.description | ჰერო სექციის ქვედა ნაწილი | Georgian | Helper text under the Trust Strip group |
| trustStrip.doctorCount.admin.description | მაგ: 54 ექიმი | Georgian | Helper text under the Doctor Count input |
| trustStrip.patientCount.admin.description | მაგ: 15,000+ პაციენტი | Georgian | Helper text under the Patient Count input |
| symptomNavigator.label | სიმპტომების ნავიგატორი | Georgian | Group label |
| symptomNavigator.placeholder.admin.description | საძიებო ველის placeholder | Georgian | Helper text under the Placeholder input |

---

### `src/globals/AboutPage.ts` — About Page

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | ჩვენ შესახებ | Georgian | Global label in the admin sidebar |
| admin.description | "ჩვენ შესახებ" გვერდის კონტენტის მართვა. | Georgian | Description shown at the top of the form |
| admin.group | გვერდები | Georgian | Sidebar group label |
| description.admin.description | მთავარი აღწერა | Georgian | Helper text under the Description rich-text editor |
| highlights.label | მთავარი მახასიათებლები | Georgian | Array label |
| highlights.admin.description | მაგ: ხარისხი, პროფესიონალიზმი, დაარსდა 2015... | Georgian | Helper text under the Highlights array |
| highlights.icon.admin.description | ემოჯი ან ხატულა (მაგ: ✓) | Georgian | Helper text under the Icon text input |
| stats.label | სტატისტიკა | Georgian | Array label |
| stats.admin.description | მაგ: დაარსდა 2015, 40 საწოლი... | Georgian | Helper text under the Stats array |

---

### `src/globals/Footer.ts` — Footer

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | ფუტერი | Georgian | Global label in the admin sidebar |
| admin.description | საიტის ქვედა ნაწილის (ფუტერის) კონტენტის მართვა. | Georgian | Description shown at the top of the form |
| admin.group | საიტის ელემენტები | Georgian | Sidebar group label |
| description.admin.description | კლინიკის მოკლე აღწერა ფუტერში | Georgian | Helper text under the Description textarea |
| quickLinks.label | სწრაფი ბმულები | Georgian | Array label |
| quickLinks.href.admin.description | ბმული (მაგ: /services) | Georgian | Helper text under the href input |
| socialLinks.label | სოციალური ქსელები | Georgian | Array label |
| socialLinks.platform.options[0].label | Facebook | English | Select option label |
| socialLinks.platform.options[1].label | Instagram | English | Select option label |
| socialLinks.platform.options[2].label | YouTube | English | Select option label |
| socialLinks.platform.options[3].label | LinkedIn | English | Select option label |
| socialLinks.platform.options[4].label | TikTok | English | Select option label |
| copyright.admin.description | საავტორო უფლებების ტექსტი | Georgian | Helper text under the Copyright input |
| whatsappNumber.admin.description | WhatsApp ნომერი (მაგ: 995422227171) | Georgian | Helper text under the WhatsApp Number input |

---

### `src/globals/ContactPage.ts` — Contact Page

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | საკონტაქტო გვერდი | Georgian | Global label in the admin sidebar |
| admin.description | საკონტაქტო გვერდის კონტენტის მართვა. | Georgian | Description shown at the top of the form |
| admin.group | გვერდები | Georgian | Sidebar group label |
| address.label | მისამართი | Georgian | Group label |
| address.mapLatitude.admin.description | Google Maps განედი | Georgian | Helper text under the Latitude number input |
| address.mapLongitude.admin.description | Google Maps გრძედი | Georgian | Helper text under the Longitude number input |
| phone.label | ტელეფონი | Georgian | Group label |
| phone.display.admin.description | საჩვენებელი ფორმატი (მაგ: +995 (0422) 227171) | Georgian | Helper text under the Display input |
| email.label | ელფოსტა | Georgian | Group label |
| workingHours.label | სამუშაო საათები | Georgian | Group label |
| workingHours.weekdays.admin.description | მაგ: ორშაბათი - პარასკევი: 09:00-18:00 | Georgian | Helper text under the Weekdays input |
| workingHours.weekends.admin.description | მაგ: შაბათი - კვირა: 09:30-17:00 | Georgian | Helper text under the Weekends input |
| contactFormTitle.admin.description | საკონტაქტო ფორმის სათაური | Georgian | Helper text under the Contact Form Title input |

---

### `src/globals/Navigation.ts` — Navigation

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | ნავიგაცია | Georgian | Global label in the admin sidebar |
| admin.description | საიტის ნავიგაციის მენიუს მართვა. | Georgian | Description shown at the top of the form |
| admin.group | საიტის ელემენტები | Georgian | Sidebar group label |
| mainMenu.label | მთავარი მენიუ | Georgian | Array label |
| mainMenu.admin.description | ზედა ნავიგაციის ბმულები | Georgian | Helper text under the Main Menu array |
| mainMenu.label.admin.description | მენიუს ელემენტის სახელი | Georgian | Helper text under each menu item's Label input |
| mainMenu.href.admin.description | ბმული (მაგ: /services, /doctors) | Georgian | Helper text under each menu item's Href input |
| mainMenu.isHighlighted.admin.description | გამოყოფილი ღილაკის სტილით (მაგ: "ჯავშანი") | Georgian | Helper text under the Is Highlighted checkbox |
| ctaButton.label | CTA ღილაკი | Georgian | Group label |
| ctaButton.admin.description | ნავიგაციის მარჯვენა მხარეს ღილაკი | Georgian | Helper text under the CTA Button group |

---

### `src/globals/BookingPage.ts` — Booking Page

| Path | Current text | Language | Notes |
|---|---|---|---|
| label | ჯავშნის გვერდი | Georgian | Global label in the admin sidebar |
| admin.description | ონლაინ ჯავშნის გვერდის კონტენტის მართვა. | Georgian | Description shown at the top of the form |
| admin.group | გვერდები | Georgian | Sidebar group label |
| steps.label | ნაბიჯების ტექსტები | Georgian | Group label |
| form.label | ფორმის ტექსტები | Georgian | Group label |

---

## Blocks (used in Pages + the Lexical editor)

### `src/blocks/HeroBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | ჰერო სექცია | Georgian | Block singular name (shown in the block picker) |
| labels.plural | ჰერო სექციები | Georgian | Block plural name |
| overlay.options[0].label | Dark | English | Select option label |
| overlay.options[1].label | Light | English | Select option label |
| overlay.options[2].label | None | English | Select option label |

---

### `src/blocks/CTABlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | CTA ბანერი | Georgian | Block singular name |
| labels.plural | CTA ბანერები | Georgian | Block plural name |
| style.options[0].label | Dark (blackberry) | English | Select option label |
| style.options[1].label | Light | English | Select option label |
| style.options[2].label | Pink | English | Select option label |

---

### `src/blocks/DividerBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | გამყოფი | Georgian | Block singular name |
| labels.plural | გამყოფები | Georgian | Block plural name |
| style.options[0].label | ხაზი | Georgian | Select option label |
| style.options[1].label | სივრცე (პატარა) | Georgian | Select option label |
| style.options[2].label | სივრცე (დიდი) | Georgian | Select option label |

---

### `src/blocks/DoctorsGridBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | ექიმების ბადე | Georgian | Block singular name |
| labels.plural | ექიმების ბადეები | Georgian | Block plural name |
| doctors.admin.description | აირჩიეთ ექიმები საჩვენებლად | Georgian | Helper text under the Doctors relationship picker |

---

### `src/blocks/FAQBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | FAQ სექცია | Georgian | Block singular name |
| labels.plural | FAQ სექციები | Georgian | Block plural name |

---

### `src/blocks/GalleryBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | გალერეა | Georgian | Block singular name |
| labels.plural | გალერეები | Georgian | Block plural name |
| columns.options[0].label | 2 სვეტი | Georgian | Select option label |
| columns.options[1].label | 3 სვეტი | Georgian | Select option label |
| columns.options[2].label | 4 სვეტი | Georgian | Select option label |

---

### `src/blocks/ImageBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | Image | English | Block singular name |
| labels.plural | Image Blocks | English | Block plural name |
| alignment.options[0].label | Left | English | Select option label |
| alignment.options[1].label | Center | English | Select option label |
| alignment.options[2].label | Right | English | Select option label |
| alignment.options[3].label | Full Width | English | Select option label |

---

### `src/blocks/ImageTextBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | Image + Text | English | Block singular name |
| labels.plural | Image + Text Blocks | English | Block plural name |
| imagePosition.options[0].label | Left | English | Select option label |
| imagePosition.options[1].label | Right | English | Select option label |

---

### `src/blocks/QuoteBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | Quote | English | Block singular name |
| labels.plural | Quote Blocks | English | Block plural name |

---

### `src/blocks/RichTextBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | Rich Text | English | Block singular name |
| labels.plural | Rich Text Blocks | English | Block plural name |

---

### `src/blocks/StatsBlock.ts`

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | სტატისტიკა | Georgian | Block singular name |
| labels.plural | სტატისტიკები | Georgian | Block plural name |

---

### `src/blocks/lexical/CalloutBlock.ts` — Inline callout box

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | შენიშვნა (Callout) | Georgian | Block singular name (Georgian with parenthetical English) |
| labels.plural | შენიშვნები | Georgian | Block plural name |
| variant.options[0].label | ინფორმაცია (ცისფერი) | Georgian | Select option label |
| variant.options[1].label | რჩევა (ვარდისფერი) | Georgian | Select option label |
| variant.options[2].label | გაფრთხილება (ყვითელი) | Georgian | Select option label |
| variant.options[3].label | მნიშვნელოვანი (ჟოლოსფერი) | Georgian | Select option label |
| title.admin.description | სათაური (არასავალდებულო) | Georgian | Helper text under the Title input |

---

### `src/blocks/lexical/GalleryBlock.ts` — Inline image gallery

| Path | Current text | Language | Notes |
|---|---|---|---|
| labels.singular | სურათების გალერეა | Georgian | Block singular name |
| labels.plural | გალერეები | Georgian | Block plural name |
| columns.options[0].label | 2 სვეტი | Georgian | Select option label |
| columns.options[1].label | 3 სვეტი | Georgian | Select option label |
| columns.options[2].label | 4 სვეტი | Georgian | Select option label |
| images.labels.singular | სურათი | Georgian | Array row singular label |
| images.labels.plural | სურათები | Georgian | Array row plural label |

---

## Shared Field Helpers

### `src/fields/seo.ts` — SEO group (reused in News, Doctors, Services, Pages)

| Path | Current text | Language | Notes |
|---|---|---|---|
| seo.label | SEO | English | Group label |
| seo.admin.description | საძიებო სისტემების ოპტიმიზაცია | Georgian | Helper text under the SEO group |
| seo.metaTitle.label | Meta Title | English | Field label |
| seo.metaTitle.admin.description | დატოვეთ ცარიელი ავტომატური გენერაციისთვის. მაქს. 60 სიმბოლო. | Georgian | Helper text under the Meta Title input |
| seo.metaDescription.label | Meta Description | English | Field label |
| seo.metaDescription.admin.description | დატოვეთ ცარიელი excerpt-ის გამოსაყენებლად. მაქს. 160 სიმბოლო. | Georgian | Helper text under the Meta Description textarea |
| seo.ogImage.label | OG Image | English | Field label |
| seo.ogImage.admin.description (with imageSource) | სოციალური ქსელებისთვის სურათი. დატოვეთ ცარიელი — გამოყენდება "<imageSource>" ველი. | Georgian | Helper text when an imageSource is configured; the field name is interpolated at runtime |
| seo.ogImage.admin.description (no imageSource) | სოციალური ქსელებისთვის სურათი. დატოვეთ ცარიელი featured image-ის გამოსაყენებლად. | Georgian | Helper text when no imageSource is configured |
| seo.noIndex.label | No Index | English | Checkbox label |
| seo.noIndex.admin.description | ჩართვით ეს გვერდი არ მოხვდება Google-ის ძიებაში. | Georgian | Helper text under the No Index checkbox |

---

## Lexical Editor (in `src/payload.config.ts`)

### Image style controls (radio buttons that appear when inserting an inline image)

| Field | Option value | Current label | Language |
|---|---|---|---|
| alignment | left | ⬅ Image left — text wraps right | English |
| alignment | center | Center | English |
| alignment | right | Image right — text wraps left ➡ | English |
| alignment | fullWidth | Full width | English |
| borderStyle | none | No border | English |
| borderStyle | pink | Pink border | English |
| borderStyle | blackberry | Blackberry border | English |
| borderStyle | grey | Grey border | English |
| shadow | none | No shadow | English |
| shadow | soft | Soft shadow | English |
| shadow | strong | Strong shadow | English |
| radius | none | Sharp corners | English |
| radius | lg | Rounded corners | English |
| radius | full | Circular | English |
| caption | — | Caption (optional) | English |

### Locale picker labels (shown in the content locale dropdown at the top of every edit form)

| Locale code | Current label | Language |
|---|---|---|
| ge | ქართული ვერსია (საიტი /ge) | Georgian |
| en | English version (site /en) | English |
| ru | რუსული ვერსია (საიტი /ru) | Georgian |

### Admin meta (browser tab title and Open Graph)

| Path | Current text | Language |
|---|---|---|
| admin.meta.titleSuffix | — ხოზრევანიძის კლინიკა | Georgian |
| admin.meta.openGraph.title | ხოზრევანიძის კლინიკა — ადმინი | Georgian |
