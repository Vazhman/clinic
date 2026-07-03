# Pages Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pages collection with a drag-and-drop block-based page builder, letting clinic staff create arbitrary pages with Hero, FAQ, CTA, Gallery, Stats, Doctors Grid, Divider blocks — plus Live Preview so they see changes in real time.

**Architecture:** A new `Pages` Payload collection with a `layout` blocks field containing all available page-builder blocks. A dynamic catch-all frontend route `/[locale]/pages/[slug]` renders any page by slug. The existing `ContentBlocks` renderer is extended with new block types. Payload's Live Preview feature is configured so staff sees the page update as they edit.

**Tech Stack:** Payload CMS 3.83, existing blocks infrastructure, Payload Live Preview

---

## File Structure

### New files:

```
src/
  collections/Pages.ts                          # Pages collection with layout blocks field
  blocks/HeroBlock.ts                            # Hero: title, subtitle, background image, CTA
  blocks/FAQBlock.ts                             # FAQ: array of question/answer pairs
  blocks/CTABlock.ts                             # CTA banner: heading, text, button
  blocks/GalleryBlock.ts                         # Gallery: grid of images
  blocks/DoctorsGridBlock.ts                     # Pick doctors to showcase
  blocks/StatsBlock.ts                           # Customizable stat counters
  blocks/DividerBlock.ts                         # Visual separator/spacer
  components/pages/PageBlocks.tsx                # Master block renderer for pages
  components/pages/HeroBlockRenderer.tsx         # Hero component
  components/pages/FAQBlockRenderer.tsx          # FAQ with accordion
  components/pages/CTABlockRenderer.tsx          # CTA banner
  components/pages/GalleryBlockRenderer.tsx      # Image gallery grid
  components/pages/DoctorsGridBlockRenderer.tsx  # Doctors card grid
  components/pages/StatsBlockRenderer.tsx        # Animated stats
  components/pages/DividerBlockRenderer.tsx      # Spacer/divider
  app/[locale]/pages/[slug]/page.tsx             # Dynamic page route
  lib/payload-pages.ts                           # Data fetching for pages
```

### Modified files:

```
src/payload.config.ts                            # Add Pages collection, Live Preview config
src/proxy.ts                                     # Ensure /pages routes work with locale
```

---

## Task 1: Create New Page-Builder Blocks

**Files:**
- Create: `src/blocks/HeroBlock.ts`
- Create: `src/blocks/FAQBlock.ts`
- Create: `src/blocks/CTABlock.ts`
- Create: `src/blocks/GalleryBlock.ts`
- Create: `src/blocks/DoctorsGridBlock.ts`
- Create: `src/blocks/StatsBlock.ts`
- Create: `src/blocks/DividerBlock.ts`

- [ ] **Step 1: Create HeroBlock**

Create `src/blocks/HeroBlock.ts`:

```ts
import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'ჰერო სექცია', plural: 'ჰერო სექციები' },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'subtitle', type: 'textarea', localized: true },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    {
      name: 'overlay',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'None', value: 'none' },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Create FAQBlock**

Create `src/blocks/FAQBlock.ts`:

```ts
import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ სექცია', plural: 'FAQ სექციები' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'question', type: 'text', required: true, localized: true },
        { name: 'answer', type: 'textarea', required: true, localized: true },
      ],
    },
  ],
}
```

- [ ] **Step 3: Create CTABlock**

Create `src/blocks/CTABlock.ts`:

```ts
import type { Block } from 'payload'

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'CTA ბანერი', plural: 'CTA ბანერები' },
  fields: [
    { name: 'heading', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'buttonText', type: 'text', required: true, localized: true },
    { name: 'buttonLink', type: 'text', required: true },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Dark (blackberry)', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'Pink', value: 'pink' },
      ],
    },
  ],
}
```

- [ ] **Step 4: Create GalleryBlock**

Create `src/blocks/GalleryBlock.ts`:

```ts
import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'გალერეა', plural: 'გალერეები' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 სვეტი', value: '2' },
        { label: '3 სვეტი', value: '3' },
        { label: '4 სვეტი', value: '4' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
  ],
}
```

- [ ] **Step 5: Create DoctorsGridBlock**

Create `src/blocks/DoctorsGridBlock.ts`:

```ts
import type { Block } from 'payload'

export const DoctorsGridBlock: Block = {
  slug: 'doctorsGrid',
  labels: { singular: 'ექიმების ბადე', plural: 'ექიმების ბადეები' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'doctors',
      type: 'relationship',
      relationTo: 'doctors',
      hasMany: true,
      required: true,
      admin: {
        description: 'აირჩიეთ ექიმები საჩვენებლად',
      },
    },
  ],
}
```

- [ ] **Step 6: Create StatsBlock**

Create `src/blocks/StatsBlock.ts`:

```ts
import type { Block } from 'payload'

export const StatsBlock: Block = {
  slug: 'stats',
  labels: { singular: 'სტატისტიკა', plural: 'სტატისტიკები' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text', defaultValue: '+' },
        { name: 'label', type: 'text', required: true, localized: true },
      ],
    },
  ],
}
```

- [ ] **Step 7: Create DividerBlock**

Create `src/blocks/DividerBlock.ts`:

```ts
import type { Block } from 'payload'

export const DividerBlock: Block = {
  slug: 'divider',
  labels: { singular: 'გამყოფი', plural: 'გამყოფები' },
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'line',
      options: [
        { label: 'ხაზი', value: 'line' },
        { label: 'სივრცე (პატარა)', value: 'spaceSmall' },
        { label: 'სივრცე (დიდი)', value: 'spaceLarge' },
      ],
    },
  ],
}
```

- [ ] **Step 8: Commit**

```bash
git add src/blocks/HeroBlock.ts src/blocks/FAQBlock.ts src/blocks/CTABlock.ts src/blocks/GalleryBlock.ts src/blocks/DoctorsGridBlock.ts src/blocks/StatsBlock.ts src/blocks/DividerBlock.ts
git commit -m "feat: add page-builder blocks (Hero, FAQ, CTA, Gallery, DoctorsGrid, Stats, Divider)"
```

---

## Task 2: Create Pages Collection and Update Config

**Files:**
- Create: `src/collections/Pages.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create Pages collection**

Create `src/collections/Pages.ts`:

```ts
import type { CollectionConfig } from 'payload'

import { RichTextBlock } from '../blocks/RichTextBlock'
import { ImageBlock } from '../blocks/ImageBlock'
import { ImageTextBlock } from '../blocks/ImageTextBlock'
import { QuoteBlock } from '../blocks/QuoteBlock'
import { HeroBlock } from '../blocks/HeroBlock'
import { FAQBlock } from '../blocks/FAQBlock'
import { CTABlock } from '../blocks/CTABlock'
import { GalleryBlock } from '../blocks/GalleryBlock'
import { DoctorsGridBlock } from '../blocks/DoctorsGridBlock'
import { StatsBlock } from '../blocks/StatsBlock'
import { DividerBlock } from '../blocks/DividerBlock'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'გვერდი', plural: 'გვერდები' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'კონტენტი',
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${locale?.code || 'ge'}/pages/${data?.slug || ''}`,
    },
  },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'მონახაზი', value: 'draft' },
        { label: 'გამოქვეყნებული', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        HeroBlock,
        RichTextBlock,
        ImageBlock,
        ImageTextBlock,
        QuoteBlock,
        FAQBlock,
        CTABlock,
        GalleryBlock,
        DoctorsGridBlock,
        StatsBlock,
        DividerBlock,
      ],
      required: true,
      localized: true,
    },
  ],
}
```

- [ ] **Step 2: Add Pages to payload.config.ts**

In `src/payload.config.ts`:

Add import at top:
```ts
import { Pages } from './collections/Pages'
```

Add `Pages` to the collections array:
```ts
collections: [Media, Users, Services, Doctors, CheckupPackages, Reviews, News, Pages],
```

Add `NEXT_PUBLIC_SITE_URL` to `.env`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add src/collections/Pages.ts src/payload.config.ts .env
git commit -m "feat: add Pages collection with 11 block types and Live Preview"
```

---

## Task 3: Create Page Block Renderers

**Files:**
- Create: `src/components/pages/HeroBlockRenderer.tsx`
- Create: `src/components/pages/FAQBlockRenderer.tsx`
- Create: `src/components/pages/CTABlockRenderer.tsx`
- Create: `src/components/pages/GalleryBlockRenderer.tsx`
- Create: `src/components/pages/DoctorsGridBlockRenderer.tsx`
- Create: `src/components/pages/StatsBlockRenderer.tsx`
- Create: `src/components/pages/DividerBlockRenderer.tsx`

- [ ] **Step 1: Create HeroBlockRenderer**

Create `src/components/pages/HeroBlockRenderer.tsx`:

```tsx
export default function HeroBlockRenderer({
  title,
  subtitle,
  backgroundImage,
  overlay,
  cta,
}: {
  title: string;
  subtitle?: string;
  backgroundImage?: { url?: string; alt?: string } | number | null;
  overlay?: string;
  cta?: { label?: string; href?: string } | null;
}) {
  const bgUrl = typeof backgroundImage === 'object' && backgroundImage ? backgroundImage.url : '';
  const overlayClass = overlay === 'light' ? 'bg-white/60' : overlay === 'none' ? '' : 'bg-blackberry/70';

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {bgUrl && (
        <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className={`absolute inset-0 ${overlayClass}`} />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center">
        <h1 className={`text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-tight mb-4 ${overlay === 'light' ? 'text-blackberry' : 'text-white'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-xl max-w-2xl mx-auto mb-8 ${overlay === 'light' ? 'text-grey' : 'text-white/70'}`}>
            {subtitle}
          </p>
        )}
        {cta?.label && cta?.href && (
          <a
            href={cta.href}
            className="inline-flex items-center gap-2 bg-pink text-white text-[15px] font-bold px-8 py-4 rounded-full hover:bg-pink-dark transition-all duration-300"
          >
            {cta.label}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create FAQBlockRenderer**

Create `src/components/pages/FAQBlockRenderer.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function FAQBlockRenderer({
  heading,
  items,
}: {
  heading?: string;
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        {heading && (
          <h2 className="text-2xl font-bold text-blackberry mb-8">{heading}</h2>
        )}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="border border-grey-lighter rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left font-medium text-grey hover:bg-pink-light/30 transition-colors cursor-pointer"
              >
                <span>{item.question}</span>
                <svg
                  className={`w-5 h-5 text-blackberry transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`transition-all duration-300 ${openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
                <div className="p-5 pt-0 text-grey-light leading-relaxed">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create CTABlockRenderer**

Create `src/components/pages/CTABlockRenderer.tsx`:

```tsx
export default function CTABlockRenderer({
  heading,
  description,
  buttonText,
  buttonLink,
  style,
}: {
  heading: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  style?: string;
}) {
  const bgClass = style === 'pink' ? 'bg-pink' : style === 'light' ? 'bg-grey-lighter' : 'bg-blackberry';
  const textClass = style === 'light' ? 'text-blackberry' : 'text-white';
  const descClass = style === 'light' ? 'text-grey' : 'text-white/60';
  const btnClass = style === 'pink' ? 'bg-blackberry text-white hover:bg-blackberry-light' : 'bg-pink text-white hover:bg-pink-dark';

  return (
    <section className={`py-16 text-center ${bgClass}`}>
      <div className="max-w-2xl mx-auto px-6">
        <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${textClass}`}>{heading}</h2>
        {description && <p className={`mb-8 ${descClass}`}>{description}</p>}
        <a
          href={buttonLink}
          className={`inline-flex items-center gap-2 text-[15px] font-bold px-8 py-4 rounded-full transition-all duration-300 ${btnClass}`}
        >
          {buttonText}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create GalleryBlockRenderer**

Create `src/components/pages/GalleryBlockRenderer.tsx`:

```tsx
export default function GalleryBlockRenderer({
  heading,
  columns,
  images,
}: {
  heading?: string;
  columns?: string;
  images: { image: { url?: string; alt?: string } | number; caption?: string }[];
}) {
  const colClass = columns === '2' ? 'sm:grid-cols-2' : columns === '4' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        {heading && <h2 className="text-2xl font-bold text-blackberry mb-8">{heading}</h2>}
        <div className={`grid grid-cols-1 ${colClass} gap-4`}>
          {images.map((item, index) => {
            const url = typeof item.image === 'object' ? item.image.url : '';
            const alt = typeof item.image === 'object' ? item.image.alt : '';
            return (
              <figure key={index} className="rounded-2xl overflow-hidden group">
                {url && (
                  <img src={url} alt={alt || ''} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                )}
                {item.caption && (
                  <figcaption className="text-[13px] text-grey-light text-center mt-2 italic">{item.caption}</figcaption>
                )}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create DoctorsGridBlockRenderer**

Create `src/components/pages/DoctorsGridBlockRenderer.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

type Doctor = {
  id: number;
  slug: string;
  name: string;
  specialty: string;
  photo?: { url?: string; alt?: string } | number | null;
};

export default function DoctorsGridBlockRenderer({
  heading,
  doctors,
}: {
  heading?: string;
  doctors: Doctor[] | number[];
}) {
  const resolved = doctors.filter((d): d is Doctor => typeof d === 'object' && d !== null);

  return (
    <section className="py-16 bg-grey-lighter">
      <div className="max-w-7xl mx-auto px-6">
        {heading && <h2 className="text-2xl font-bold text-blackberry mb-8">{heading}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {resolved.map((doctor) => {
            const photoUrl = typeof doctor.photo === 'object' && doctor.photo ? doctor.photo.url : '';
            return (
              <Link key={doctor.id} href={`/doctors/${doctor.slug}`} className="block group">
                <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blackberry/[0.06] transition-all duration-400">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {photoUrl && (
                      <img src={photoUrl} alt={doctor.name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-blackberry/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-[15px] font-bold text-white mb-1 drop-shadow-md">{doctor.name}</h3>
                      <p className="text-[12px] text-pink-light font-medium drop-shadow-md">{doctor.specialty}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create StatsBlockRenderer**

Create `src/components/pages/StatsBlockRenderer.tsx`:

```tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const timer = setInterval(() => {
      start += Math.ceil(value / (duration / 30));
      if (start >= value) { setCount(value); clearInterval(timer); }
      else { setCount(start); }
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, value, duration]);
  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function StatsBlockRenderer({
  items,
}: {
  items: { value: number; suffix?: string; label: string }[];
}) {
  return (
    <section className="py-20 bg-pink-light/50">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className={`grid grid-cols-2 ${items.length >= 3 ? 'lg:grid-cols-' + Math.min(items.length, 4) : ''} gap-8`}>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-tight leading-none mb-2">
                <span className="gradient-text"><AnimatedNumber value={item.value} /></span>
                <span className="text-pink">{item.suffix || ''}</span>
              </p>
              <p className="text-[12px] text-grey-light font-medium tracking-[0.15em] uppercase">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create DividerBlockRenderer**

Create `src/components/pages/DividerBlockRenderer.tsx`:

```tsx
export default function DividerBlockRenderer({ style }: { style?: string }) {
  if (style === 'spaceSmall') return <div className="py-6" />;
  if (style === 'spaceLarge') return <div className="py-16" />;
  return (
    <div className="max-w-7xl mx-auto px-6">
      <hr className="border-grey-lighter my-12" />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/pages/
git commit -m "feat: add page block renderers (Hero, FAQ, CTA, Gallery, DoctorsGrid, Stats, Divider)"
```

---

## Task 4: Create Master PageBlocks Renderer

**Files:**
- Create: `src/components/pages/PageBlocks.tsx`

- [ ] **Step 1: Create the master renderer**

Create `src/components/pages/PageBlocks.tsx`:

```tsx
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import HeroBlockRenderer from "./HeroBlockRenderer";
import FAQBlockRenderer from "./FAQBlockRenderer";
import CTABlockRenderer from "./CTABlockRenderer";
import GalleryBlockRenderer from "./GalleryBlockRenderer";
import DoctorsGridBlockRenderer from "./DoctorsGridBlockRenderer";
import StatsBlockRenderer from "./StatsBlockRenderer";
import DividerBlockRenderer from "./DividerBlockRenderer";

type PageBlock =
  | { blockType: "hero"; title: string; subtitle?: string; backgroundImage?: any; overlay?: string; cta?: { label?: string; href?: string } }
  | { blockType: "richText"; content: SerializedEditorState }
  | { blockType: "image"; image: any; alignment: string; caption?: string }
  | { blockType: "imageText"; image: any; imagePosition: string; content: SerializedEditorState }
  | { blockType: "quote"; quoteText: string; attribution?: string }
  | { blockType: "faq"; heading?: string; items: { question: string; answer: string }[] }
  | { blockType: "cta"; heading: string; description?: string; buttonText: string; buttonLink: string; style?: string }
  | { blockType: "gallery"; heading?: string; columns?: string; images: any[] }
  | { blockType: "doctorsGrid"; heading?: string; doctors: any[] }
  | { blockType: "stats"; items: { value: number; suffix?: string; label: string }[] }
  | { blockType: "divider"; style?: string };

export default function PageBlocks({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case "hero":
            return <HeroBlockRenderer key={index} {...block} />;
          case "richText":
            return (
              <section key={index} className="py-12">
                <div className="max-w-3xl mx-auto px-6 prose prose-lg max-w-none prose-headings:text-blackberry prose-p:text-grey prose-a:text-pink">
                  <RichText data={block.content} />
                </div>
              </section>
            );
          case "image": {
            const imgUrl = typeof block.image === "object" ? block.image?.url : "";
            const imgAlt = typeof block.image === "object" ? block.image?.alt : "";
            const alignClasses: Record<string, string> = {
              left: "float-left mr-8 mb-4 max-w-md",
              center: "mx-auto max-w-3xl",
              right: "float-right ml-8 mb-4 max-w-md",
              fullWidth: "w-full",
            };
            return (
              <section key={index} className="py-8">
                <div className="max-w-7xl mx-auto px-6">
                  <figure className={alignClasses[block.alignment] || alignClasses.center}>
                    {imgUrl && <img src={imgUrl} alt={imgAlt || ""} className="rounded-2xl w-full" loading="lazy" />}
                    {block.caption && <figcaption className="text-[13px] text-grey-light text-center mt-3 italic">{block.caption}</figcaption>}
                  </figure>
                </div>
              </section>
            );
          }
          case "imageText": {
            const imgUrl = typeof block.image === "object" ? block.image?.url : "";
            const imgAlt = typeof block.image === "object" ? block.image?.alt : "";
            return (
              <section key={index} className="py-12">
                <div className={`max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-8 items-center ${block.imagePosition === "right" ? "md:flex-row-reverse" : ""}`}>
                  <div className="md:w-1/2">
                    {imgUrl && <img src={imgUrl} alt={imgAlt || ""} className="rounded-2xl w-full" loading="lazy" />}
                  </div>
                  <div className="md:w-1/2 prose prose-lg max-w-none prose-headings:text-blackberry prose-p:text-grey prose-a:text-pink">
                    <RichText data={block.content} />
                  </div>
                </div>
              </section>
            );
          }
          case "quote":
            return (
              <section key={index} className="py-8">
                <div className="max-w-3xl mx-auto px-6">
                  <blockquote className="border-l-4 border-pink pl-6 py-4 bg-pink-light/30 rounded-r-2xl">
                    <p className="text-[18px] text-blackberry italic leading-relaxed">&ldquo;{block.quoteText}&rdquo;</p>
                    {block.attribution && <cite className="block mt-3 text-[14px] text-grey-light not-italic font-medium">— {block.attribution}</cite>}
                  </blockquote>
                </div>
              </section>
            );
          case "faq":
            return <FAQBlockRenderer key={index} {...block} />;
          case "cta":
            return <CTABlockRenderer key={index} {...block} />;
          case "gallery":
            return <GalleryBlockRenderer key={index} {...block} />;
          case "doctorsGrid":
            return <DoctorsGridBlockRenderer key={index} {...block} />;
          case "stats":
            return <StatsBlockRenderer key={index} {...block} />;
          case "divider":
            return <DividerBlockRenderer key={index} {...block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pages/PageBlocks.tsx
git commit -m "feat: add master PageBlocks renderer supporting all 11 block types"
```

---

## Task 5: Create Dynamic Page Route and Data Fetching

**Files:**
- Create: `src/lib/payload-pages.ts`
- Create: `src/app/[locale]/pages/[slug]/page.tsx`

- [ ] **Step 1: Create data fetching functions**

Create `src/lib/payload-pages.ts`:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'

type Locale = 'ge' | 'en' | 'ru'

export async function getPageBySlug(slug: string, locale: Locale) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pages',
    locale,
    depth: 2,
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
  })

  return result.docs[0] ?? null
}

export async function getAllPages(locale: Locale) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pages',
    locale,
    depth: 0,
    where: {
      status: { equals: 'published' },
    },
    limit: 100,
  })

  return result.docs.map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
  }))
}
```

- [ ] **Step 2: Create the dynamic page route**

Create `src/app/[locale]/pages/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import PageBlocks from "@/components/pages/PageBlocks";
import { getPageBySlug } from "@/lib/payload-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPageBySlug(slug, locale as "ge" | "en" | "ru");

  if (!page) return { title: "Not Found" };

  return {
    title: `${page.title} | ხოზრევანიძის კლინიკა`,
    alternates: {
      canonical: `https://www.khozrevanidze.ge/${locale}/pages/${slug}`,
      languages: {
        ka: `https://www.khozrevanidze.ge/ge/pages/${slug}`,
        en: `https://www.khozrevanidze.ge/en/pages/${slug}`,
        ru: `https://www.khozrevanidze.ge/ru/pages/${slug}`,
      },
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const nav = await getTranslations("Navigation");
  const page = await getPageBySlug(slug, locale as "ge" | "en" | "ru");

  if (!page) notFound();

  return (
    <>
      <div className="max-w-7xl mx-auto px-6">
        <Breadcrumbs
          items={[
            { label: nav("home"), href: "/" },
            { label: page.title },
          ]}
        />
      </div>
      {page.layout && Array.isArray(page.layout) && (
        <PageBlocks blocks={page.layout} />
      )}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/payload-pages.ts src/app/\\[locale\\]/pages/
git commit -m "feat: add dynamic page route with data fetching"
```

---

## Task 6: Verify End-to-End

- [ ] **Step 1: Start dev server and verify**

```bash
npm run dev
```

- [ ] **Step 2: Test in admin panel**

1. Go to `http://localhost:3000/admin`
2. Click "გვერდები" (Pages) in sidebar
3. Create a new page:
   - Title: "ტესტ გვერდი"
   - Slug: "test-page"
   - Status: "გამოქვეყნებული"
   - Add blocks: Hero, Rich Text, FAQ, CTA, Gallery
   - Verify drag-and-drop reordering works
4. Save the page

- [ ] **Step 3: View on frontend**

Visit `http://localhost:3000/ge/pages/test-page` — all blocks should render correctly.

- [ ] **Step 4: Test Live Preview**

In the admin panel while editing the page, click "ცოცხალი გადახედვა" (Live Preview). A side panel should show the page updating in real time as you edit.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve issues from pages builder verification"
```
