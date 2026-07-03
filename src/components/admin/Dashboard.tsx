// src/components/admin/Dashboard.tsx
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { colors, spacing, radii, fontSizes, letterSpacing, lineHeights } from './tokens'
import { DoctorIcon, ServiceIcon, NewsIcon, PageIcon, ReviewIcon, CheckupIcon, ExternalLinkIcon, ChevronRightIcon } from './icons'
import DoctraSyncCard from './DoctraSyncCard'
import GoogleReviewsSyncCard from './GoogleReviewsSyncCard'
import NeedsAttentionCard, { type NeedsAttentionCounts } from './NeedsAttentionCard'

type Stats = {
  doctors: number
  services: number
  news: number
  pages: number
  reviews: number
  checkups: number
}

type RecentItem = {
  id: string
  title: string
  collectionLabel: string
  editHref: string
  updatedAt: string
}

// Server-side relative time in Georgian. Editors recognise "5 წუთის წინ"
// faster than an ISO date. Falls back to a localized date past one week.
function relativeTimeKa(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (diffSec < 60) return 'ახლახ'
  const min = Math.round(diffSec / 60)
  if (min < 60) return `${min} წუთის წინ`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} საათის წინ`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day} დღის წინ`
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadDashboardData(): Promise<{
  stats: Stats
  attention: NeedsAttentionCounts
  lastSyncedAt: string | null
  recent: RecentItem[]
}> {
  try {
    const payload = await getPayload({ config })

    // 6 collection counts + 3 attention counts + global + all-locale doctors
    // + 4 recent-activity feeds, all in parallel. The all-locale doctors fetch
    // returns every doctor with every locale's value so we can detect
    // untranslated rows (RU === EN means the editor hasn't replaced the
    // placeholder seeded by Doctra import).
    const [
      doctorsTotal, servicesTotal, newsTotal, pagesTotal, reviewsTotal, checkupsTotal,
      noPhoto, placeholderSpec, hidden, settings, doctorsAllLocales,
      recentNews, recentDoctors, recentServices, recentLabTests,
    ] = await Promise.all([
      payload.find({ collection: 'doctors', limit: 0 }),
      payload.find({ collection: 'services', limit: 0 }),
      payload.find({ collection: 'news', limit: 0 }),
      payload.find({ collection: 'pages', limit: 0 }),
      payload.find({ collection: 'reviews', limit: 0 }),
      payload.find({ collection: 'checkup-packages', limit: 0 }),
      payload.find({ collection: 'doctors', where: { photo: { exists: false } } as never, limit: 0 }),
      payload.find({ collection: 'doctors', where: { specialty: { equals: '—' } } as never, limit: 0 }),
      payload.find({ collection: 'doctors', where: { inactive: { equals: true } } as never, limit: 0 }),
      payload.findGlobal({ slug: 'site-settings' }),
      payload.find({ collection: 'doctors', locale: 'all' as never, limit: 1000, depth: 0 }),
      payload.find({ collection: 'news', sort: '-updatedAt', limit: 5, depth: 0, locale: 'ge' as never }),
      payload.find({ collection: 'doctors', sort: '-updatedAt', limit: 5, depth: 0, locale: 'ge' as never }),
      payload.find({ collection: 'services', sort: '-updatedAt', limit: 5, depth: 0, locale: 'ge' as never }),
      payload.find({ collection: 'lab-tests', sort: '-updatedAt', limit: 5, depth: 0, locale: 'ge' as never }),
    ])

    const settingsAny = settings as { lastDoctraSync?: string | null }

    // Merge the four recent feeds into one "recently edited" stream. Each
    // collection exposes a different title field; normalise to {title}. Rows
    // with no title yet (freshly created) fall back to a generic label so the
    // widget never shows a blank line.
    type Row = { id: string | number; updatedAt?: string; title?: string; name?: string }
    const feed = (
      res: { docs: unknown[] },
      slug: string,
      collectionLabel: string,
      titleKey: 'title' | 'name',
    ): RecentItem[] =>
      (res.docs as Row[]).map((d) => ({
        id: String(d.id),
        title: (d[titleKey]?.toString().trim() || '(უსათაურო)'),
        collectionLabel,
        editHref: `/admin/collections/${slug}/${d.id}`,
        updatedAt: d.updatedAt ?? '',
      }))

    const recent: RecentItem[] = [
      ...feed(recentNews, 'news', 'სიახლე', 'title'),
      ...feed(recentDoctors, 'doctors', 'ექიმი', 'name'),
      ...feed(recentServices, 'services', 'სერვისი', 'name'),
      ...feed(recentLabTests, 'lab-tests', 'ანალიზი', 'title'),
    ]
      .filter((r) => r.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)

    // Count doctors needing Russian translation. After Doctra import seeds RU
    // from EN, an untranslated row has `name_ru === name_en` (and similarly
    // for specialty). Editor changes either field to mark it as translated.
    type LocalizedRow = {
      name?: { ge?: string | null; en?: string | null; ru?: string | null } | string | null
      specialty?: { ge?: string | null; en?: string | null; ru?: string | null } | string | null
    }
    let needsRuTranslation = 0
    for (const doc of doctorsAllLocales.docs as unknown as LocalizedRow[]) {
      const nameOk = typeof doc.name === 'object' && doc.name !== null
        ? (doc.name.ru?.trim() ?? '') !== '' && doc.name.ru?.trim() !== doc.name.en?.trim()
        : true
      const specOk = typeof doc.specialty === 'object' && doc.specialty !== null
        ? (doc.specialty.ru?.trim() ?? '') !== '' && doc.specialty.ru?.trim() !== doc.specialty.en?.trim()
        : true
      if (!nameOk || !specOk) needsRuTranslation++
    }

    return {
      stats: {
        doctors: doctorsTotal.totalDocs,
        services: servicesTotal.totalDocs,
        news: newsTotal.totalDocs,
        pages: pagesTotal.totalDocs,
        reviews: reviewsTotal.totalDocs,
        checkups: checkupsTotal.totalDocs,
      },
      attention: {
        noPhoto: noPhoto.totalDocs,
        placeholderSpecialty: placeholderSpec.totalDocs,
        hidden: hidden.totalDocs,
        needsRuTranslation,
      },
      lastSyncedAt: settingsAny.lastDoctraSync ?? null,
      recent,
    }
  } catch (err) {
    console.error('Dashboard load failed:', err)
    return {
      stats: { doctors: 0, services: 0, news: 0, pages: 0, reviews: 0, checkups: 0 },
      attention: { noPhoto: 0, placeholderSpecialty: 0, hidden: 0, needsRuTranslation: 0 },
      lastSyncedAt: null,
      recent: [],
    }
  }
}

export default async function Dashboard() {
  const { stats, attention, lastSyncedAt, recent } = await loadDashboardData()

  const statCards = [
    { label: 'ექიმები', value: stats.doctors, Icon: DoctorIcon, href: '/admin/collections/doctors', color: colors.blackberry },
    { label: 'სერვისები', value: stats.services, Icon: ServiceIcon, href: '/admin/collections/services', color: colors.pink },
    { label: 'სიახლეები', value: stats.news, Icon: NewsIcon, href: '/admin/collections/news', color: colors.accentPurple },
    { label: 'გვერდები', value: stats.pages, Icon: PageIcon, href: '/admin/collections/pages', color: colors.accentBlue },
    { label: 'შეფასებები', value: stats.reviews, Icon: ReviewIcon, href: '/admin/collections/reviews', color: colors.amberWarn },
    { label: 'ჩექაფები', value: stats.checkups, Icon: CheckupIcon, href: '/admin/collections/checkup-packages', color: colors.greenSuccess },
  ]

  const quickActions = [
    { label: 'სიახლის დამატება', Icon: NewsIcon, href: '/admin/collections/news/create' },
    { label: 'გვერდის შექმნა', Icon: PageIcon, href: '/admin/collections/pages/create' },
    { label: 'ექიმის დამატება', Icon: DoctorIcon, href: '/admin/collections/doctors/create' },
  ]

  return (
    <div style={{ padding: `${spacing.xl} ${spacing.xl}` }}>
      {/* Welcome banner */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.blackberry} 0%, ${colors.blackberryDark} 100%)`,
        borderRadius: radii.lg,
        padding: `${spacing.lg} ${spacing.xl}`,
        marginBottom: spacing.lg,
        color: colors.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}>
        <div>
          <h1 style={{ fontSize: fontSizes.xl, fontWeight: 700, margin: 0 }}>მოგესალმებით</h1>
          <p style={{ fontSize: fontSizes.md, opacity: 0.7, margin: `${spacing.xs} 0 0 0` }}>ხოზრევანიძის კლინიკის ადმინ-პანელი</p>
        </div>
        <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
          {statCards.slice(0, 4).map((card) => (
            <a key={card.label} href={card.href} className="clinic-focusable" style={{ textDecoration: 'none', color: colors.white, textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: fontSizes.xxl, fontWeight: 700, lineHeight: lineHeights.tight }}>{card.value}</div>
              <div style={{ fontSize: fontSizes.xs, opacity: 0.7, marginTop: spacing.xs }}>{card.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Doctra sync card */}
      <DoctraSyncCard lastSyncedAt={lastSyncedAt} />

      {/* Google Reviews sync card */}
      <GoogleReviewsSyncCard />

      {/* Needs attention */}
      <NeedsAttentionCard counts={attention} />

      {/* Stats list + Quick actions */}
      <div className="clinic-dash-grid">
        {/* Left: full stats list */}
        <div>
          <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyText, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, margin: `0 0 ${spacing.md} 0` }}>
            კონტენტი
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {statCards.map((card) => (
              <a key={card.label} href={card.href} className="clinic-focusable clinic-lift" style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                background: colors.white,
                borderRadius: radii.md,
                padding: `${spacing.md} ${spacing.lg}`,
                textDecoration: 'none',
                border: `1px solid ${colors.greySubtle}`,
              }}>
                <span style={{ width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  <card.Icon size={20} color={card.color} />
                </span>
                <span style={{ fontSize: fontSizes.md, fontWeight: 500, color: colors.greyDeep, flex: 1 }}>{card.label}</span>
                <span style={{ fontSize: fontSizes.xl, fontWeight: 700, color: card.color }}>{card.value}</span>
                <span style={{ color: colors.greyChevron, display: 'inline-flex' }} aria-hidden="true"><ChevronRightIcon size={16} /></span>
              </a>
            ))}
          </div>
        </div>

        {/* Right: quick actions + recent activity */}
        <div>
          <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyText, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, margin: `0 0 ${spacing.md} 0` }}>
            სწრაფი მოქმედებები
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {quickActions.map((action) => (
              <a key={action.label} href={action.href} className="clinic-focusable clinic-lift" style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                background: colors.white,
                borderRadius: radii.md,
                padding: `${spacing.md} ${spacing.lg}`,
                textDecoration: 'none',
                border: `1px solid ${colors.greySubtle}`,
                color: colors.greyDeep,
                fontSize: fontSizes.md,
                fontWeight: 500,
              }}>
                <span style={{ width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <action.Icon size={20} color={colors.blackberry} />
                </span>
                <span style={{ flex: 1 }}>{action.label}</span>
                <span style={{ color: colors.greyChevron, display: 'inline-flex' }} aria-hidden="true"><ChevronRightIcon size={16} /></span>
              </a>
            ))}
          </div>

          {/* View site button */}
          <a href="/" target="_blank" rel="noopener noreferrer" className="clinic-focusable" style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.md,
            background: colors.blackberry,
            borderRadius: radii.md,
            padding: `${spacing.md} ${spacing.lg}`,
            textDecoration: 'none',
            color: colors.white,
            fontSize: fontSizes.md,
            fontWeight: 600,
          }}>
            <span style={{ width: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLinkIcon size={18} color={colors.white} />
            </span>
            <span>საიტის ნახვა</span>
          </a>
        </div>
      </div>

      {/* Recently edited — a WordPress-style "what changed lately" feed across
          News / Doctors / Services / Lab tests, newest first. */}
      <div style={{ marginTop: spacing.xl }}>
        <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyText, textTransform: 'uppercase', letterSpacing: letterSpacing.wide, margin: `0 0 ${spacing.md} 0` }}>
          ბოლოს რედაქტირებული
        </h3>
        {recent.length === 0 ? (
          <p style={{ fontSize: fontSizes.sm, color: colors.greyText, margin: 0, lineHeight: lineHeights.normal }}>
            ჯერ არაფერია რედაქტირებული. როგორც კი დაამატებთ ან შეცვლით კონტენტს, აქ გამოჩნდება.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {recent.map((item) => (
              <a key={`${item.collectionLabel}-${item.id}`} href={item.editHref} className="clinic-focusable clinic-lift" style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                background: colors.white,
                borderRadius: radii.md,
                padding: `${spacing.sm} ${spacing.lg}`,
                textDecoration: 'none',
                border: `1px solid ${colors.greySubtle}`,
              }}>
                <span style={{
                  fontSize: fontSizes.xs,
                  fontWeight: 600,
                  color: colors.blackberry,
                  background: colors.pinkSoft,
                  border: `1px solid ${colors.pinkBorder}`,
                  borderRadius: radii.sm,
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                }}>{item.collectionLabel}</span>
                <span style={{ fontSize: fontSizes.md, color: colors.greyDeep, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                <span style={{ fontSize: fontSizes.xs, color: colors.greyLightText, whiteSpace: 'nowrap' }}>{relativeTimeKa(item.updatedAt)}</span>
                <span style={{ color: colors.greyChevron, display: 'inline-flex' }} aria-hidden="true"><ChevronRightIcon size={16} /></span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
