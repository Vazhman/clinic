import { buildConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import {
  lexicalEditor,
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  ChecklistFeature,
  FixedToolbarFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineToolbarFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { payloadTotp } from 'payload-totp'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { Services } from './collections/Services'
import { Doctors } from './collections/Doctors'
import { CheckupPackages } from './collections/CheckupPackages'
import { Reviews } from './collections/Reviews'
import { News } from './collections/News'
import { Pages } from './collections/Pages'
import { LabTests } from './collections/LabTests'
import { ChatLogs } from './collections/ChatLogs'
import { BuilderTemplates } from './collections/BuilderTemplates'
import { SiteSettings } from './globals/SiteSettings'
import { HomePage } from './globals/HomePage'
import { AboutPage } from './globals/AboutPage'
import { Footer } from './globals/Footer'
import { ContactPage } from './globals/ContactPage'
import { Navigation } from './globals/Navigation'
import { BookingPage } from './globals/BookingPage'
import { ServicesPage } from './globals/ServicesPage'
import { DoctorsPage } from './globals/DoctorsPage'
import { Policies } from './globals/Policies'
import { ka } from './i18n/payload-ka'
import { en } from '@payloadcms/translations/languages/en'
import { CalloutBlock } from './blocks/lexical/CalloutBlock'
import { GalleryBlock } from './blocks/lexical/GalleryBlock'
import { ColumnsBlock } from './blocks/lexical/ColumnsBlock'
import { ResizableUploadFeature } from './lexical/features/resizable-upload/feature'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ---------------------------------------------------------------------------
// On-demand cache revalidation
//
// The public site serves its CMS content from Next's data cache (see the
// `cached(...)` wrappers in src/lib/payload-data.ts). Each cached getter is
// tagged with the slug(s) of the collection/global it reads. Here we inject an
// afterChange/afterDelete hook into every one of those collections/globals so
// that the moment an editor saves, the matching tag is invalidated and the next
// public request re-renders with fresh content — i.e. CMS edits stay instant
// while everything else is cached.
//
// Tag name === slug. A getter that reads more than one source (getNavigation
// reads `navigation` + `pages`; getStats reads `home-page` + `site-settings`)
// carries every relevant tag, so each entity only needs to bust its own slug.
//
// `revalidateTag` throws when called outside a request scope (during `next
// build` or a standalone seed script). That's expected — there is no cache to
// bust there — so we swallow it.
const REVALIDATED_SLUGS = new Set([
  'services',
  'doctors',
  'checkup-packages',
  'reviews',
  'news',
  'pages',
  'policies',
  'lab-tests',
  'site-settings',
  'home-page',
  'about-page',
  'footer',
  'contact-page',
  'navigation',
  'booking-page',
  'services-page',
  'doctors-page',
])

function bustSlugTag(slug: string): void {
  try {
    // `{ expire: 0 }` expires the tag immediately so the editor sees their
    // change on the very next reload (blocking revalidate), rather than the
    // stale-while-revalidate behavior of `'max'`. This matches the project's
    // "CMS edits are instant" requirement. Hooks run inside the Payload admin
    // route handler, which is a valid server scope for revalidateTag.
    revalidateTag(slug, { expire: 0 })
  } catch {
    // Outside a request scope (build / seed) — no cache to revalidate.
  }
}

// Wrap a collection or global config with revalidation hooks, without touching
// each entity's own file. Only entities whose content feeds a cached public
// getter (REVALIDATED_SLUGS) are wrapped; Media / Users / ChatLogs / etc. are
// returned untouched. Globals have no afterDelete (they can't be deleted).
function withRevalidate<T extends { slug: string }>(entity: T, isGlobal: boolean): T {
  if (!REVALIDATED_SLUGS.has(entity.slug)) return entity
  const slug = entity.slug
  const hooks = ((entity as { hooks?: Record<string, unknown[]> }).hooks ?? {}) as Record<string, unknown[]>
  const onMutate = () => bustSlugTag(slug)
  return {
    ...entity,
    hooks: {
      ...hooks,
      afterChange: [...(hooks.afterChange ?? []), onMutate],
      ...(isGlobal ? {} : { afterDelete: [...(hooks.afterDelete ?? []), onMutate] }),
    },
  } as T
}

// Fail fast when the PRODUCTION SERVER boots without the auth secret — the
// insecure default would make admin tokens forgeable. Skipped during `next
// build` (NEXT_PHASE === 'phase-production-build'), which runs with
// NODE_ENV=production but doesn't serve requests, and skipped in dev.
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  !process.env.PAYLOAD_SECRET
) {
  throw new Error('PAYLOAD_SECRET is required in production — set it in the environment.')
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',

  // Database adapter is switchable so the same codebase can be deployed
  // either to Vercel (Postgres on Neon) or to a Node-capable cPanel host
  // (SQLite — a single file on disk, no external service required).
  //
  //   DATABASE_TYPE=sqlite + DATABASE_URL=file:./database.sqlite  → SQLite
  //   anything else (incl. unset) + DATABASE_URL=postgres://...    → Postgres
  //
  // push:true syncs schema additions on every boot. Demo phase: keep on
  // until we move to migration files. Additive-only changes have been verified
  // safe; renames/removes would still be destructive — review every schema
  // edit before deploying. (Payload does not honour push in serverless prod
  // anyway — see scripts/apply-translations.py and the Neon ALTER TABLEs.)
  db:
    process.env.DATABASE_TYPE === 'sqlite'
      ? sqliteAdapter({
          client: {
            url: process.env.DATABASE_URL || 'file:./database.sqlite',
          },
          push: process.env.PAYLOAD_DISABLE_PUSH !== 'true',
        })
      : postgresAdapter({
          pool: {
            connectionString: process.env.DATABASE_URL,
          },
          push: process.env.PAYLOAD_DISABLE_PUSH !== 'true',
        }),

  // Editor features:
  //  - default Lexical kit (paragraph, marks, headings, link, lists)
  //  - sticky + inline toolbars
  //  - alignment, indent, blockquote, checklist, horizontal rule
  //  - UploadFeature: inline images via the Media collection, with extra
  //    per-image fields (alignment, borderStyle, shadow, radius, caption)
  //    that the public renderer reads to apply brand styling. Editors pick
  //    these from dropdowns — they cannot type free-form CSS.
  //  - BlocksFeature: inline Callout + Gallery blocks (slash-menu insertable)
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      AlignFeature(),
      IndentFeature(),
      BlockquoteFeature(),
      ChecklistFeature(),
      HorizontalRuleFeature(),
      UploadFeature({
        collections: {
          media: {
            // Radio fields render all options inline so editors don't have to
            // open a dropdown to compare choices. Short English labels with
            // direction emoji prefixes make the alignment options obvious at
            // a glance. The values themselves stay machine-stable; only the
            // labels change.
            fields: [
              {
                name: 'alignment',
                type: 'radio',
                defaultValue: 'center',
                options: [
                  { label: '⬅ სურათი მარცხნივ — ტექსტი მარჯვნივ', value: 'left' },
                  { label: 'ცენტრში', value: 'center' },
                  { label: 'სურათი მარჯვნივ — ტექსტი მარცხნივ ➡', value: 'right' },
                  { label: 'სრული სიგანე', value: 'fullWidth' },
                ],
              },
              {
                name: 'borderStyle',
                type: 'radio',
                defaultValue: 'none',
                options: [
                  { label: 'ჩარჩოს გარეშე', value: 'none' },
                  { label: 'ვარდისფერი ჩარჩო', value: 'pink' },
                  { label: 'მაყვლისფერი ჩარჩო', value: 'blackberry' },
                  { label: 'რუხი ჩარჩო', value: 'grey' },
                ],
              },
              {
                name: 'shadow',
                type: 'radio',
                defaultValue: 'none',
                options: [
                  { label: 'ჩრდილის გარეშე', value: 'none' },
                  { label: 'რბილი ჩრდილი', value: 'soft' },
                  { label: 'ძლიერი ჩრდილი', value: 'strong' },
                ],
              },
              {
                name: 'radius',
                type: 'radio',
                defaultValue: 'lg',
                options: [
                  { label: 'მკვეთრი კუთხეები', value: 'none' },
                  { label: 'მომრგვალებული კუთხეები', value: 'lg' },
                  { label: 'წრიული', value: 'full' },
                ],
              },
              // Size = how WIDE the image renders inside the article column.
              // Independent of alignment (left/center/right). For full-width
              // alignment the size is ignored — full means full. The mapping
              // to Tailwind widths lives in StyledUpload.tsx.
              {
                name: 'size',
                type: 'radio',
                defaultValue: 'large',
                options: [
                  { label: 'პატარა (≈33%)', value: 'small' },
                  { label: 'საშუალო (≈50%)', value: 'medium' },
                  { label: 'დიდი (≈75%)', value: 'large' },
                  { label: 'სრული სიგანე', value: 'full' },
                ],
              },
              { name: 'caption', type: 'text', localized: true, label: 'წარწერა (სურვილისამებრ)' },
              // Hidden numeric override set by the new ResizableUploadFeature
              // (drag handles + floating toolbar in the admin canvas). When
              // present it wins over the `size` preset on the public renderer.
              // Editors never see this field directly — they manipulate width
              // via the inline UI, not a form input.
              { name: 'widthPercent', type: 'number', min: 10, max: 100, admin: { hidden: true } },
            ],
          },
        },
      }),
      // ResizableUploadFeature replaces only the editor-canvas React
      // component for upload nodes — same serialized `type: 'upload'`, same
      // `fields` shape, so existing news posts deserialize unchanged. The
      // feature must come AFTER UploadFeature() so the node-replacement
      // registers against the already-installed UploadNode class.
      ResizableUploadFeature(),
      BlocksFeature({
        blocks: [CalloutBlock, GalleryBlock, ColumnsBlock],
      }),
    ],
  }),

  collections: [Media, Users, Services, Doctors, CheckupPackages, Reviews, News, Pages, LabTests, ChatLogs, BuilderTemplates].map(
    (c) => withRevalidate(c, false),
  ),

  globals: [SiteSettings, HomePage, AboutPage, Footer, ContactPage, Navigation, BookingPage, ServicesPage, DoctorsPage, Policies].map(
    (g) => withRevalidate(g, true),
  ),

  i18n: {
    // Include the bundled English translations alongside our Georgian
    // overrides so:
    //   1. Lexical's i18n keys (`lexical:blocks:label`, `lexical:upload:*`, etc.)
    //      have somewhere to fall back to — without `en` in supportedLanguages,
    //      Payload prints the raw keys instead of human-readable text.
    //   2. Editors can optionally switch the admin UI to English from the
    //      user-account language picker.
    supportedLanguages: { ka, en } as never,
    fallbackLanguage: 'en',
  },

  // Content locale picker (the dropdown at the top of every edit form). The
  // labels deliberately spell out which public-site path each locale feeds —
  // editors otherwise see "ქართული / English / Русский" and don't realise
  // switching here changes WHICH language version of the SAME record they
  // are editing (the record that powers /ge/..., /en/..., /ru/... on the
  // public site). Do NOT remove this picker — the public site has three
  // locale routes and reads these fields per request locale.
  localization: {
    locales: [
      { label: 'ქართული ვერსია (საიტი /ge)', code: 'ge' },
      { label: 'English version (site /en)', code: 'en' },
      { label: 'რუსული ვერსია (საიტი /ru)', code: 'ru' },
    ],
    defaultLocale: 'ge',
    fallback: true,
  },

  admin: {
    user: 'users',
    // Lock the admin to light mode — our custom components (Dashboard,
    // sync card, needs-attention card, login polish) use fixed colors from
    // tokens.ts and don't have dark-mode variants. Letting users toggle dark
    // mode would render those components with white/blackberry on Payload's
    // dark surface, which looks broken. Revisit if we ever need dark mode.
    theme: 'light',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — ხოზრევანიძის კლინიკა',
      icons: [{ url: '/images/logo-icon.png' }],
      openGraph: {
        title: 'ხოზრევანიძის კლინიკა — ადმინი',
        images: [{ url: '/images/logo-icon.png' }],
      },
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo',
        Icon: '/components/admin/Icon',
      },
      beforeLogin: ['/components/admin/BeforeLogin'],
      afterLogin: ['/components/admin/AfterLogin'],
      // BeforeNavLinks sits at the TOP of the sidebar (right under the
      // logo) so the "Dashboard" + "View site" buttons stay visible no
      // matter how tall the nav grows. The previous `afterNavLinks` slot
      // fell below the fold for tall sidebars.
      beforeNavLinks: ['/components/admin/BeforeNavLinks'],
      beforeDashboard: ['/components/admin/Dashboard'],
    },
  },

  typescript: {
    autoGenerate: true,
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  sharp,

  plugins: [
    // Vercel Blob storage for the Media collection. Local dev: only enabled
    // when BLOB_READ_WRITE_TOKEN is present (otherwise falls through to the
    // default disk uploads at staticDir). Production (Vercel): always enabled.
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
      // Vercel serverless functions hard-cap request bodies at 4.5MB — real
      // doctor/news photos routinely exceed that and 413 before reaching
      // Payload. clientUploads sends the file straight from the browser to
      // Vercel Blob instead of proxying it through the server function.
      clientUploads: true,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),

    // TOTP 2FA temporarily DISABLED everywhere (local + Vercel demo) while
    // we stabilise the demo deployment. The plugin's own `disabled` flag is
    // dead code in the compiled package — only way to truly skip TOTP is to
    // not register it. Flip the literal `false` below back to
    // `process.env.TOTP_DISABLED !== 'true'` to re-enable; production
    // ENV var TOTP_DISABLED was never being set.
    //
    // When re-enabling, `disableAccessWrapper: true` is REQUIRED — without
    // it, the plugin's `totpAccess` wrapper returns false on every public
    // request without a user, killing public reads (doctor photos via
    // /api/media/file/*, all globals the public site fetches).
    ...(false ? [
      payloadTotp({
        collection: 'users',
        forceSetup: true,
        disableAccessWrapper: true,
        totp: {
          issuer: 'Khozrevanidze Clinic',
        },
        forceWhiteBackgroundOnQrCode: true,
      }),
    ] : []),
  ],
  telemetry: false,
})
