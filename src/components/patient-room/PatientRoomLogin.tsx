'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

type Locale = 'ge' | 'en' | 'ru'

// Cosmetic copy only — the field NAMES and API contract never change. Ported
// verbatim from the former public/patient-room.html so the wording is identical.
const T: Record<Locale, {
  htmlLang: string
  kicker: string; brandTitle: string; brandSub: string
  f1: string; f2: string; f3: string
  step1: string; step2: string; title: string; subtitle: string
  userIdLabel: string; userIdPh: string; captchaLabel: string; captchaPh: string
  continueBtn: string; otpHint: string; otpLabel: string; loginBtn: string; backBtn: string
  loading: string; help: string; clinic: string
}> = {
  ge: {
    htmlLang: 'ka',
    kicker: 'პაციენტის პორტალი',
    brandTitle: 'თქვენი ჯანმრთელობა — ერთ სივრცეში',
    brandSub: 'ლაბორატორიული კვლევის პასუხები ხელმისაწვდომია ნებისმიერ დროს, უსაფრთხო პირადი კაბინეტიდან.',
    f1: 'ლაბორატორიული პასუხები ონლაინ',
    f2: 'SMS-ით დაცული ავტორიზაცია',
    f3: 'წვდომა 24/7, ნებისმიერი მოწყობილობიდან',
    step1: 'იდენტიფიკაცია', step2: 'დადასტურება',
    title: 'ჩემი ოთახი',
    subtitle: 'შემოდით ლაბორატორიული კვლევის პასუხების სანახავად.',
    userIdLabel: 'პირადი ნომერი ან პასპორტი', userIdPh: 'პირადი ნომერი / პასპორტი',
    captchaLabel: 'უსაფრთხოების კოდი', captchaPh: 'შეიყვანეთ კოდი',
    continueBtn: 'გაგრძელება',
    otpHint: 'თქვენს მობილურ ნომერზე გამოგზავნილია 4-ნიშნა ერთჯერადი კოდი.',
    otpLabel: 'ერთჯერადი კოდი',
    loginBtn: 'შესვლა',
    backBtn: '← უკან, ნომრის შესწორება',
    loading: 'მუშავდება…',
    help: 'დახმარება გჭირდებათ? დაგვირეკეთ',
    clinic: 'ხოზრევანიძის კლინიკა',
  },
  en: {
    htmlLang: 'en',
    kicker: 'PATIENT PORTAL',
    brandTitle: 'Your health — all in one place',
    brandSub: 'Your laboratory results are available any time from a secure personal account.',
    f1: 'Lab results online',
    f2: 'Secure SMS authentication',
    f3: '24/7 access from any device',
    step1: 'Identify', step2: 'Verify',
    title: 'My Room',
    subtitle: 'Sign in to view your laboratory test results.',
    userIdLabel: 'Personal ID / Passport', userIdPh: 'Personal number or passport',
    captchaLabel: 'Security code', captchaPh: 'Enter the code',
    continueBtn: 'Continue',
    otpHint: 'A 4-digit one-time code has been sent to your mobile number.',
    otpLabel: 'One-time code',
    loginBtn: 'Sign in',
    backBtn: '← Back, edit ID',
    loading: 'Processing…',
    help: 'Need help? Call',
    clinic: 'Khozrevanidze Clinic',
  },
  ru: {
    htmlLang: 'ru',
    kicker: 'ЛИЧНЫЙ КАБИНЕТ',
    brandTitle: 'Ваше здоровье — в одном месте',
    brandSub: 'Результаты лабораторных исследований доступны в любое время в защищённом личном кабинете.',
    f1: 'Результаты анализов онлайн',
    f2: 'Защищённая SMS-авторизация',
    f3: 'Доступ 24/7 с любого устройства',
    step1: 'Идентификация', step2: 'Подтверждение',
    title: 'Мой кабинет',
    subtitle: 'Войдите, чтобы посмотреть результаты лабораторных исследований.',
    userIdLabel: 'Личный номер или паспорт', userIdPh: 'Личный номер / паспорт',
    captchaLabel: 'Код безопасности', captchaPh: 'Введите код',
    continueBtn: 'Продолжить',
    otpHint: 'На ваш мобильный номер отправлен 4-значный одноразовый код.',
    otpLabel: 'Одноразовый код',
    loginBtn: 'Войти',
    backBtn: '← Назад, изменить номер',
    loading: 'Обработка…',
    help: 'Нужна помощь? Позвоните',
    clinic: 'Клиника Хозреванидзе',
  },
}

const ERR: Record<Locale, Record<'captcha' | 'id' | 'otp' | 'expired' | 'net' | 'fail' | 'terms', string>> = {
  ge: { captcha: 'უსაფრთხოების კოდი არასწორია.', id: 'შეიყვანეთ სწორი პირადი ნომერი.', otp: 'კოდი არასწორია, სცადეთ თავიდან.', expired: 'სესია ამოიწურა, სცადეთ თავიდან.', net: 'კავშირის შეცდომა, სცადეთ თავიდან.', fail: 'ავტორიზაცია ვერ მოხერხდა. გადაამოწმეთ მონაცემები.', terms: 'გთხოვთ, დაეთანხმოთ წესებსა და პირობებს.' },
  en: { captcha: 'Wrong security code.', id: 'Enter a valid personal number.', otp: 'Incorrect code, please try again.', expired: 'Session expired, please try again.', net: 'Connection error, please try again.', fail: 'Authentication failed. Check your details.', terms: 'Please agree to the Terms & Privacy Policy.' },
  ru: { captcha: 'Неверный код безопасности.', id: 'Введите корректный личный номер.', otp: 'Неверный код, попробуйте снова.', expired: 'Сессия истекла, попробуйте снова.', net: 'Ошибка соединения, попробуйте снова.', fail: 'Ошибка авторизации. Проверьте данные.', terms: 'Пожалуйста, согласитесь с условиями.' },
}

const NOISE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"

function TermsLabel({ locale, checked, onChange }: { locale: Locale; checked: boolean; onChange: (v: boolean) => void }) {
  const terms = (
    <a href="/pages/terms" target="_blank" rel="noopener" style={{ color: '#682149', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
      {locale === 'ge' ? 'წესებსა და პირობებს' : locale === 'ru' ? 'Условиями' : 'Terms & Conditions'}
    </a>
  )
  const privacy = (
    <a href="/pages/privacy" target="_blank" rel="noopener" style={{ color: '#682149', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
      {locale === 'ge' ? 'კონფიდენციალურობის პოლიტიკას' : locale === 'ru' ? 'Политикой конфиденциальности' : 'Privacy Policy'}
    </a>
  )
  return (
    <label className="flex items-start gap-2.5 my-[0.1rem] mb-[1.15rem] text-[0.84rem] leading-[1.5] cursor-pointer" style={{ color: '#7a6b73' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-[0.15rem] w-[18px] h-[18px] shrink-0 cursor-pointer" style={{ accentColor: '#682149' }} />
      <span className="min-w-0">
        {locale === 'ge' ? <>ვეთანხმები {terms} და {privacy}</> : locale === 'ru' ? <>Я согласен с {terms} и {privacy}</> : <>I agree to the {terms} and the {privacy}</>}
      </span>
    </label>
  )
}

export default function PatientRoomLogin({ locale }: { locale: Locale }) {
  const t = T[locale] ?? T.ge
  const e = ERR[locale] ?? ERR.ge
  const router = useRouter()

  const [step, setStep] = React.useState<1 | 2>(1)
  const [loading, setLoading] = React.useState(false)
  const [authError, setAuthError] = React.useState('')
  const [verifyError, setVerifyError] = React.useState('')
  const [userId, setUserId] = React.useState('')
  const [code, setCode] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [agreed, setAgreed] = React.useState(false)
  const [captchaSrc, setCaptchaSrc] = React.useState('/api/patient-room/captcha')
  const otpRef = React.useRef<HTMLInputElement>(null)
  const userIdRef = React.useRef<HTMLInputElement>(null)

  const reloadCaptcha = React.useCallback(() => {
    setCaptchaSrc(`/api/patient-room/captcha?t=${Date.now()}`)
  }, [])

  // Fresh captcha + server cookie on mount (mirrors the old $(document).ready).
  React.useEffect(() => { reloadCaptcha() }, [reloadCaptcha])

  // STEP 1 — captcha check + send SMS OTP
  async function submitAuth(ev: React.FormEvent) {
    ev.preventDefault()
    setAuthError('')
    if (!agreed) { setAuthError(e.terms); return }
    setLoading(true)
    try {
      const r = await fetch('/api/patient-room/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, securityCode: code }),
      })
      const data = await r.json().catch(() => null)
      setLoading(false)
      if (data && data.status === 0) {
        setStep(2)
        requestAnimationFrame(() => otpRef.current?.focus())
      } else {
        const msg = !data ? e.net
          : data.status === 4 ? e.captcha
          : data.error_text === 'invalid_id' ? e.id
          : data.error_text === 'network' ? e.net
          : e.fail
        setAuthError(msg)
        reloadCaptcha()
        setCode('')
      }
    } catch {
      setLoading(false)
      setAuthError(e.net)
      reloadCaptcha()
    }
  }

  // STEP 2 — confirm OTP, then enter the patient room
  async function submitVerify(ev: React.FormEvent) {
    ev.preventDefault()
    setVerifyError('')
    setLoading(true)
    try {
      const r = await fetch('/api/patient-room/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      })
      const data = await r.json().catch(() => null)
      if (data && data.status === 0) {
        // Cookie is now set server-side — re-run the server page so it renders
        // the dashboard instead of this login.
        router.refresh()
        return
      }
      setLoading(false)
      if (data && data.status === 9) {
        setStep(1)
        setAuthError(e.expired)
        reloadCaptcha()
        requestAnimationFrame(() => userIdRef.current?.focus())
      } else {
        setVerifyError(e.otp)
      }
    } catch {
      setLoading(false)
      setVerifyError(e.net)
    }
  }

  function goBack() {
    setVerifyError('')
    setStep(1)
    requestAnimationFrame(() => userIdRef.current?.focus())
  }

  const langs: Locale[] = ['ge', 'en', 'ru']
  const langLabel: Record<Locale, string> = { ge: 'ქარ', en: 'EN', ru: 'RU' }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]" style={{ background: '#fafaf8', color: '#3d3d3d' }}>
      {/* scoped keyframes (ECG draw + reveal) — unique names, no global clash */}
      <style>{`
        @keyframes pr-draw { 0%{stroke-dashoffset:560} 55%{stroke-dashoffset:0} 100%{stroke-dashoffset:-560} }
        @keyframes pr-rise { to { opacity:1; transform:none } }
        .pr-reveal { opacity:0; transform:translateY(14px); animation:pr-rise .7s cubic-bezier(.22,1,.36,1) forwards; }
        .pr-reveal.d1{animation-delay:.08s}.pr-reveal.d2{animation-delay:.16s}.pr-reveal.d3{animation-delay:.24s}
        .pr-ecg path{stroke-dasharray:560;stroke-dashoffset:560;animation:pr-draw 4.5s cubic-bezier(.22,1,.36,1) infinite}
        @media (prefers-reduced-motion: reduce){ .pr-reveal{opacity:1;transform:none} .pr-ecg path{animation:none;stroke-dashoffset:0} }
        .pr-input { width:100%; font-size:1rem; color:#3d3d3d; padding:0.85rem 1rem; border:1.5px solid #ece6ea; border-radius:12px; background:#fafaf8; outline:none; transition:border-color .2s,box-shadow .2s,background .2s; }
        .pr-input::placeholder{color:#b3a4ac}
        .pr-input:hover{border-color:#d9cdd4}
        .pr-input:focus{border-color:#dd64a6;background:#fff;box-shadow:0 0 0 4px rgba(221,100,166,0.16)}
        .pr-reload{ flex:none;width:40px;border:1.5px solid #ece6ea;border-radius:12px;background:#fff;cursor:pointer;color:#682149;display:grid;place-items:center;transition:all .2s cubic-bezier(.22,1,.36,1) }
        .pr-reload:hover{border-color:#dd64a6;color:#dd64a6;transform:rotate(-30deg)}
        .pr-btn{ width:100%;border:0;cursor:pointer;font-size:1rem;font-weight:700;color:#fff;letter-spacing:.2px;padding:0.95rem 1rem;border-radius:12px;margin-top:0.4rem;background:linear-gradient(135deg,#682149,#7c2a59);box-shadow:0 16px 30px -16px rgba(104,33,73,0.8);transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .18s,filter .18s;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem }
        .pr-btn:hover{transform:translateY(-2px);box-shadow:0 22px 38px -16px rgba(104,33,73,0.85);filter:brightness(1.06)}
        .pr-btn:active{transform:translateY(0)}
      `}</style>

      {/* ── Brand panel ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white flex flex-col p-6 sm:p-10 lg:p-[clamp(2rem,5vw,4.5rem)]"
        style={{
          background:
            'radial-gradient(120% 90% at 85% 8%, rgba(221,100,166,0.42), transparent 55%),' +
            'radial-gradient(90% 70% at 0% 100%, rgba(221,100,166,0.18), transparent 60%),' +
            'linear-gradient(155deg,#682149 0%,#4a1735 100%)',
        }}
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: `url("${NOISE}")` }} />

        {/* Centered, comfortably-wide content column — fills the panel and keeps
            the brand block balanced instead of a thin, word-wrapping strip. */}
        <div className="relative z-[1] w-full max-w-[34rem] mx-auto flex-1 flex flex-col justify-between gap-12">

        <div className="flex items-center gap-3 pr-reveal">
          <span aria-hidden className="w-11 h-11 rounded-[13px] grid place-items-center bg-white/10 border border-white/20 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" /></svg>
          </span>
          <span>
            <b className="block font-semibold text-[1.12rem] tracking-[0.2px]">{t.clinic}</b>
            <span className="block text-[0.72rem] opacity-70 tracking-[2px] uppercase mt-0.5">{t.kicker}</span>
          </span>
        </div>

        <div className="pr-reveal d1 hidden lg:block">
          <h1 className="font-semibold text-[clamp(2.1rem,4.2vw,3.3rem)] leading-[1.3] tracking-[-0.5px] mb-[1.1rem] pb-[0.08em] text-balance">{t.brandTitle}</h1>
          <p className="text-[1.02rem] leading-[1.65] opacity-80 max-w-[34ch]">{t.brandSub}</p>
          <ul className="list-none p-0 mt-[1.8rem] grid gap-[0.85rem]">
            {[t.f1, t.f2, t.f3].map((f, i) => (
              <li key={i} className={`flex items-center gap-[0.7rem] text-[0.95rem] opacity-90 pr-reveal ${i < 2 ? 'd2' : 'd3'}`}>
                <span aria-hidden className="shrink-0 w-[26px] h-[26px] rounded-full grid place-items-center" style={{ background: 'rgba(221,100,166,0.25)', border: '1px solid rgba(244,201,224,0.4)' }}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden className="pr-ecg pr-reveal d3 relative z-[1] mt-[2.4rem] opacity-60 hidden lg:block">
          <svg viewBox="0 0 340 46" preserveAspectRatio="none" className="w-full max-w-[340px] h-[46px] block" style={{ fill: 'none', stroke: '#f4c9e0', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <path d="M0 23 H120 l8 -16 l10 32 l9 -28 l8 12 H200 l7 -7 l6 7 H340" />
          </svg>
        </div>
        </div>
      </section>

      {/* ── Auth side ───────────────────────────────────────────────────── */}
      <section className="relative flex flex-col p-6 sm:p-10 lg:p-[clamp(1.6rem,4vw,3.5rem)]">
        <div className="flex justify-between items-center gap-3">
          <a href={`/${locale}`} className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-grey hover:text-blackberry no-underline transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {({ ge: 'მთავარ გვერდზე', en: 'Back to site', ru: 'На сайт' } as Record<string, string>)[locale] ?? 'Back to site'}
          </a>
          <div role="group" aria-label="Language" className="inline-flex bg-white rounded-full p-1 gap-0.5" style={{ border: '1px solid #ece6ea', boxShadow: '0 6px 20px -16px rgba(74,23,53,.5)' }}>
            {langs.map((l) => (
              <a
                key={l}
                href={`/${l}/patient-room`}
                aria-pressed={l === locale}
                className={`px-3.5 py-1.5 rounded-full text-[0.82rem] font-semibold no-underline transition-colors duration-200 ${l === locale ? 'bg-blackberry text-white' : 'text-grey hover:text-blackberry'}`}
              >
                {langLabel[l]}
              </a>
            ))}
          </div>
        </div>

        <div className="flex-1 grid place-items-center py-9">
          <div className="pr-reveal d1 relative w-full max-w-[430px] bg-white rounded-[18px] overflow-hidden p-6 sm:p-[clamp(1.6rem,3vw,2.6rem)]" style={{ border: '1px solid #ece6ea', boxShadow: '0 30px 80px -40px rgba(74,23,53,0.55)' }}>
            <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg,#682149,#dd64a6)' }} />

            {/* step indicator */}
            <div aria-hidden className="flex items-center gap-2 mb-[1.6rem]">
              <span className="shrink-0 w-[26px] h-[26px] rounded-full grid place-items-center text-[0.78rem] font-bold transition-colors duration-300" style={step >= 1 ? { background: '#682149', color: '#fff', border: '1.5px solid #682149' } : { background: '#fafaf8', color: '#b3a4ac', border: '1.5px solid #ece6ea' }}>1</span>
              <span className="text-[0.78rem] font-semibold transition-colors duration-300" style={{ color: step >= 1 ? '#682149' : '#b3a4ac' }}>{t.step1}</span>
              <span className="flex-1 h-0.5 rounded-sm overflow-hidden" style={{ background: '#ece6ea' }}>
                <i className="block h-full transition-[width] duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)]" style={{ width: step === 2 ? '100%' : '0%', background: '#dd64a6' }} />
              </span>
              <span className="text-[0.78rem] font-semibold transition-colors duration-300" style={{ color: step === 2 ? '#682149' : '#b3a4ac' }}>{t.step2}</span>
              <span className="shrink-0 w-[26px] h-[26px] rounded-full grid place-items-center text-[0.78rem] font-bold transition-colors duration-300" style={step === 2 ? { background: '#682149', color: '#fff', border: '1.5px solid #682149' } : { background: '#fafaf8', color: '#b3a4ac', border: '1.5px solid #ece6ea' }}>2</span>
            </div>

            <h2 className="font-semibold text-[1.7rem] text-blackberry mt-[0.4rem] mb-[0.3rem]">{t.title}</h2>
            <p className="text-[0.92rem] leading-[1.55] mb-[1.6rem]" style={{ color: '#7a6b73' }}>{t.subtitle}</p>

            {step === 1 ? (
              /* ── STEP 1: identify ── */
              <form onSubmit={submitAuth} autoComplete="off" noValidate>
                {authError && <div role="alert" aria-live="polite" className="rounded-xl px-[0.95rem] py-3 text-[0.88rem] leading-[1.45] mb-4" style={{ background: '#fdeef0', color: '#c2334d', border: '1px solid #f5cdd4' }}>{authError}</div>}

                <div className="mb-[1.1rem]">
                  <label htmlFor="user_id" className="block text-[0.8rem] font-semibold mb-[0.4rem]" style={{ color: '#3d3d3d' }}>{t.userIdLabel}</label>
                  <input ref={userIdRef} id="user_id" name="user_id" type="text" inputMode="text" maxLength={20} required placeholder={t.userIdPh}
                    value={userId} onChange={(ev) => setUserId(ev.target.value)} className="pr-input" />
                </div>

                <div className="mb-[1.1rem]">
                  <label htmlFor="securityCode" className="block text-[0.8rem] font-semibold mb-[0.4rem]" style={{ color: '#3d3d3d' }}>{t.captchaLabel}</label>
                  <div className="grid grid-cols-[1fr_auto] gap-[0.6rem] items-stretch">
                    <input id="securityCode" name="securityCode" type="text" required placeholder={t.captchaPh} autoComplete="off"
                      value={code} onChange={(ev) => setCode(ev.target.value)} className="pr-input" />
                    <div className="flex items-center gap-[0.4rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img id="captcha" src={captchaSrc} alt="captcha" className="h-[52px] w-[118px] object-cover rounded-xl bg-white" style={{ border: '1.5px solid #ece6ea' }} />
                      <button type="button" onClick={reloadCaptcha} title="↻" aria-label="captcha reload" className="pr-reload">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v5h-5" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <TermsLabel locale={locale} checked={agreed} onChange={setAgreed} />

                <button type="submit" className="pr-btn">
                  {t.continueBtn}
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
                </button>
              </form>
            ) : (
              /* ── STEP 2: verify OTP ── */
              <form onSubmit={submitVerify} autoComplete="off" noValidate>
                {verifyError && <div role="alert" aria-live="polite" className="rounded-xl px-[0.95rem] py-3 text-[0.88rem] leading-[1.45] mb-4" style={{ background: '#fdeef0', color: '#c2334d', border: '1px solid #f5cdd4' }}>{verifyError}</div>}

                <p className="text-[0.85rem] leading-[1.5] mt-[-0.4rem] mb-[1.2rem]" style={{ color: '#7a6b73' }}>{t.otpHint}</p>

                <div className="mb-[1.1rem]">
                  <label htmlFor="otp" className="block text-[0.8rem] font-semibold mb-[0.4rem]" style={{ color: '#3d3d3d' }}>{t.otpLabel}</label>
                  <input ref={otpRef} id="otp" name="otp" type="text" inputMode="numeric" pattern="\d{4}" maxLength={4} required placeholder="••••" autoComplete="one-time-code"
                    value={otp} onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, ''))}
                    className="pr-input text-center text-[1.5rem] font-bold tracking-[0.7em] pl-[0.7em] tabular-nums" />
                </div>

                <button type="submit" className="pr-btn">
                  {t.loginBtn}
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></svg>
                </button>

                <button type="button" onClick={goBack} className="inline-block mt-[1.1rem] bg-none border-0 cursor-pointer text-[0.86rem] font-semibold text-blackberry hover:text-pink transition-colors">{t.backBtn}</button>
              </form>
            )}

            {/* loader overlay */}
            {loading && (
              <div aria-live="assertive" className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[0.8rem]" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(3px)' }}>
                <span aria-hidden className="w-[42px] h-[42px] rounded-full animate-spin" style={{ border: '3px solid #f4c9e0', borderTopColor: '#682149' }} />
                <span className="text-[0.85rem] font-semibold text-blackberry">{t.loading}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[0.78rem] mt-[1.4rem]" style={{ color: '#a5969e' }}>
          {t.help} <a href="tel:+995577777777" className="text-blackberry no-underline">+995 577 77 77 77</a>
        </p>
      </section>
    </main>
  )
}
