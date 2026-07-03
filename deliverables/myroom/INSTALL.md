# "ჩემი ოთახი" — ახალი დიზაინი / new login page

A restyled, modern version of the patient-portal login at
`https://www.khozrevanidze.ge/myroom/`. **Front-end only** — the login logic,
SMS code, captcha and lab-results page are unchanged.

---

## ⚠ მნიშვნელოვანი / Important

ეს ფაილი **არ ცვლის** backend-ს. ის იყენებს იმავე ფაილებს, რაც ახლა:
This file does **not** change the backend. It uses the same files you already
have in the `/myroom/` folder:

- `api.php` — ავტორიზაცია და კოდის გადამოწმება / login + code verification
- `securitycode.php` — captcha
- `lab.php` — შესვლის შემდეგ პასუხების გვერდი / page shown after login

**ეს სამი ფაილი არ უნდა შეიცვალოს. / Do NOT change those three files.**

---

## დაყენება / How to install (≈2 minutes)

1. **გააკეთეთ backup.** გახსენით სერვერზე საქაღალდე `/myroom/` და დააკოპირეთ
   არსებული მთავარი ფაილი (`index.php` ან `index.html`) როგორც
   `index.backup.php` — რომ საჭიროების შემთხვევაში დააბრუნოთ.
   **Back up first:** in the `/myroom/` folder, copy the current home file
   (`index.php` or `index.html`) to `index.backup.php` so you can roll back.

2. **ატვირთეთ ახალი ფაილი იმავე სახელით.** ჩაანაცვლეთ არსებული მთავარი ფაილი
   ამ `index.html`-ის შიგთავსით. **თუ ახლა `index.php`-ია — შეინახეთ ისევ
   `index.php` სახელით** (ფაილი წმინდა HTML-ია, `.php` გაფართოებაში მუშაობს და
   გარანტირებულად გაიხსნება იმავე URL-ზე).
   **Upload the new file with the SAME name as the current one.** Replace the
   existing home file with the contents of this `index.html`. **If the current
   one is `index.php`, save the new content as `index.php`** (it's plain HTML,
   works fine with a `.php` extension, and guarantees it opens at the same URL).

3. **დატოვეთ `api.php`, `securitycode.php`, `lab.php` ისე, როგორც არის.**
   Leave `api.php`, `securitycode.php`, `lab.php` exactly as they are, in the
   same folder.

4. **შეამოწმეთ.** გახსენით `https://www.khozrevanidze.ge/myroom/` და გაიარეთ
   ნამდვილი ავტორიზაცია (პირადი ნომერი → SMS კოდი). შესვლის შემდეგ უნდა
   გადახვიდეთ `lab.php`-ზე, როგორც ადრე.
   **Test:** open `https://www.khozrevanidze.ge/myroom/` and do a real login
   (personal ID → SMS code). After success it should go to `lab.php` as before.

5. **დაბრუნება საჭიროების შემთხვევაში / Rollback:** წაშალეთ ახალი ფაილი და
   დააბრუნეთ `index.backup.php` თავის ადგილზე.

---

## ტექნიკური შენიშვნები / Technical notes

- ერთი თვითმყოფადი ფაილია. ერთადერთი გარე რესურსები: **jQuery** (იგივე CDN,
  რასაც ძველი გვერდი იყენებდა) და **Google Fonts**. ორივე იტვირთება ინტერნეტიდან.
  Single self-contained file. The only external resources are **jQuery** (the
  same CDN the old page already used) and **Google Fonts**, both loaded online.
- ენა: `?lang=ge` / `?lang=en` / `?lang=ru` ბმულები მუშაობს — ენა ავტომატურად
  შეირჩევა. ხელითაც გადაირთვება გვერდზე.
  Language: existing `?lang=ge|en|ru` links still work and preselect the
  language; users can also switch it on the page.
- ბრენდის შრიფტი FiraGO: თუ სერვერზე უკვე ჩატვირთულია FiraGO, გვერდი
  ავტომატურად გამოიყენებს მას; თუ არა — იყენებს Noto-ს (Georgian).
  Brand font FiraGO: if FiraGO is already available on the site it is used
  automatically; otherwise the page falls back to Noto (Georgian).
- შესვლის ლოგიკა, SMS, captcha, შეცდომების ტექსტები — ყველაფერი იგივე backend-ით.
  Login logic, SMS, captcha and error messages all come from the same backend.

ფაილი: `index.html` (ამ საქაღალდეში). / The page is `index.html` in this folder.
