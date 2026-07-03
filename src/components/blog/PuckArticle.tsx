'use client'

import '@/puck/puck-blocks.css'
import { Render, type Data } from '@puckeditor/core'
import { config } from '@/puck/config'
import type { BuilderLocale } from '@/puck/types'

// Renders a published Puck layout for the given locale. Client component so
// Puck's <Render> runs without RSC edge-cases; Next still SSRs the markup
// for SEO (initial HTML is generated on the server).
export default function PuckArticle({ data, locale }: { data: Data; locale: BuilderLocale }) {
  return <Render config={config} data={data} metadata={{ locale }} />
}
