'use client'

import { createContext, useContext } from 'react'
import type { BuilderLocale } from './types'

// The locale currently being *edited* in the builder. Custom fields read
// this so a single shared layout edits the right language's text. Display
// (block render) uses Puck `metadata.locale` instead — see config.tsx.
export const BuilderLocaleContext = createContext<BuilderLocale>('ge')

export function useBuilderLocale(): BuilderLocale {
  return useContext(BuilderLocaleContext)
}
