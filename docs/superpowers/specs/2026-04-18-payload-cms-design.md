# Payload CMS Design — Khozrevanidze Clinic

## Overview

Integrate Payload CMS 3.x directly into the existing Next.js 16.2.2 clinic website. Payload runs embedded in the same app — admin panel at `/admin`, website at all other routes. Database: SQLite (file-based). Zero extra infrastructure cost.

## Goals

- Give non-technical clinic staff a visual admin dashboard to manage all content
- Replace hardcoded `src/lib/data.ts` with CMS-managed content
- Build a full News/Blog system with block-based rich content editor
- Support 3 languages (Georgian, English, Russian) for all content
- Secure admin access with email/password auth, account locking, optional 2FA

## Architecture

Single Next.js app with Payload embedded:
- `khozrevanidze.ge/*` → Public website
- `khozrevanidze.ge/admin` → Payload CMS dashboard (staff only)

Content flow: Payload SQLite DB → Payload Local API → Server Components → Rendered HTML

## Collections

### News (Blog Posts)
- `title` (localized: ge, en, ru)
- `slug` (auto-generated from title)
- `excerpt` (localized, short summary for cards)
- `featuredImage` (upload relationship to Media)
- `category` (select: health-tips, clinic-news, medical-info, announcements)
- `content` (blocks field — see Content Blocks below)
- `publishedDate` (date)
- `status` (draft | published)
- `showOnHomepage` (checkbox)
- `homepageOrder` (number, for ordering on home page)
- `author` (text)

### Doctors
- `name` (localized)
- `slug` (auto-generated)
- `photo` (upload)
- `specialty` (localized)
- `biography` (localized, rich text)
- `qualifications` (array of localized strings)
- `specializations` (array of localized strings)
- `experienceYears` (number)
- `languagesSpoken` (array of strings)
- `isDepartmentHead` (checkbox)

### Services
- `name` (localized)
- `slug` (auto-generated)
- `description` (localized, rich text)
- `shortDescription` (localized)
- `icon` (select from predefined icon set)
- `image` (upload)

### Checkup Packages
- `name` (localized)
- `description` (localized)
- `price` (number)
- `currency` (text, default "GEL")
- `duration` (localized)
- `includedServices` (array of localized strings)
- `isFeatured` (checkbox)

### Reviews
- `author` (text)
- `rating` (number, 1-5)
- `text` (localized)
- `date` (date)
- `source` (select: google | internal)

### Media
- Managed automatically by Payload
- Stores uploaded images with auto-generated sizes
- Alt text field (localized)

### Users
- Email + password (Payload built-in)
- Role (select: admin | editor)
- `maxLoginAttempts: 5`, `lockTime: 600000` (10 min)

## Globals

### Site Settings
- `stats.patients` (number)
- `stats.doctors` (number)
- `stats.operations` (number)
- `stats.experience` (number)
- `contact.address` (localized)
- `contact.phone` (text)
- `contact.email` (text)
- `contact.workingHours.weekdays` (localized)
- `contact.workingHours.weekends` (localized)

## News Content Blocks

The `content` field on News uses Payload's blocks field type:

### RichText Block
- `richText` (Lexical rich text editor — headings, paragraphs, bold, italic, lists, links)

### Image Block
- `image` (upload)
- `alignment` (select: left | center | right)
- `caption` (localized, optional)

### ImageText Block
- `image` (upload)
- `imagePosition` (select: left | right)
- `richText` (Lexical rich text)

### Quote Block
- `quoteText` (localized)
- `attribution` (localized, optional)

## Multilingual Strategy

Payload's built-in localization:
- Configure locales: `ge` (default), `en`, `ru`
- All text/richText fields marked `localized: true`
- Admin panel shows language tabs per field
- Existing `next-intl` remains for UI strings (navigation, buttons, labels)
- CMS handles content strings (doctor bios, service descriptions, news articles)

## Homepage News Display

- Home page queries: `payload.find({ collection: 'news', where: { showOnHomepage: { equals: true }, status: { equals: 'published' } }, sort: 'homepageOrder' })`
- Renders news cards in a grid section (similar to existing ServicesGrid style)
- Each card: featured image, title, excerpt, date, "Read More" link
- Links to `/[locale]/blog/[slug]`

## Blog Page

- Queries all published news, sorted by `publishedDate` descending
- Paginated card grid
- Each card: featured image, title, excerpt, category badge, date
- Links to detail page

## Blog Detail Page (`/[locale]/blog/[slug]`)

- Fetches single news post by slug
- Renders content blocks in order:
  - RichText → rendered HTML
  - Image → `<img>` with alignment class (float-left, centered, float-right)
  - ImageText → two-column flex layout
  - Quote → styled blockquote
- Shows: title, date, category, featured image hero, then content blocks
- Related news at bottom (same category, exclude current)

## Migration Plan

1. Install Payload CMS + SQLite adapter + Lexical rich text
2. Define all collections and globals
3. Write seed script to migrate existing `data.ts` content into Payload DB
4. Update all components to fetch from Payload Local API instead of importing data.ts
5. Build News section components (cards, detail page, content block renderers)
6. Add News section to home page
7. Configure auth (roles, account locking)
8. Remove `data.ts` after migration verified

## Security

- Email/password authentication for admin panel
- maxLoginAttempts: 5, lockTime: 10 minutes
- Role-based access: admin (full), editor (content only)
- HTTP-only cookies + JWT
- Optional: payload-2fa TOTP plugin for 2FA
- Admin panel at `/admin` — hidden from public navigation

## What Stays in next-intl

UI strings stay in `messages/*.json`:
- Navigation labels, button text, form labels
- Section headings, CTAs
- Error messages, loading states

These are developer-managed, rarely change, and don't need a CMS.
