// Shared shapes for the demo-seed content (news + lab tests).
//
// Bodies are authored as a compact array of blocks (h2 / p / ul / quote)
// instead of raw Lexical JSON — readable in source, converted to a valid
// Payload Lexical editorState by `toLexical()` in ./lexical.ts. Inline
// **bold** inside any string is honoured by the converter.

/** One value per public-site locale. Same keys as payload.config localization. */
export type Localized<T> = { ge: T; en: T; ru: T }

/** A single content block in an authored body. */
export type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { quote: string }

export type NewsCategory = 'health-tips' | 'clinic-news' | 'medical-info' | 'announcements'

export type NewsSeed = {
  slug: string
  category: NewsCategory
  /** ISO date (yyyy-mm-dd) — taken from the source article on khozrevanidze.ge. */
  publishedDate: string
  /** Original article image on khozrevanidze.ge. Fetched at seed time; on
   *  failure the seeder substitutes a bundled category placeholder. */
  imageUrl: string
  imageAlt: Localized<string>
  author?: Localized<string>
  showOnHomepage?: boolean
  homepageOrder?: number
  title: Localized<string>
  excerpt: Localized<string>
  body: Localized<Block[]>
}

export type LabTestCategory =
  | 'hematology'
  | 'biochemistry'
  | 'hormones'
  | 'infections'
  | 'immunology'
  | 'genetics'
  | 'prenatal'
  | 'urinalysis'
  | 'cardiology'
  | 'oncology'
  | 'other'

export type LabTestSeed = {
  slug: string
  category: LabTestCategory
  published: boolean
  aliases?: Localized<string[]>
  /** slugs of other tests in this batch — resolved to relationships after all
   *  tests are created (avoids ordering problems). */
  relatedTestSlugs?: string[]
  /** service slugs to cross-link, if a matching Services doc exists. */
  relatedServiceSlugs?: string[]
  title: Localized<string>
  summary: Localized<string>
  overview: Localized<Block[]>
  whyDone: Localized<Block[]>
  preparation: Localized<Block[]>
  whatToExpect: Localized<Block[]>
  interpretation: Localized<Block[]>
}
