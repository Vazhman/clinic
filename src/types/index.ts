export interface SeoOverrides {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  /** Plain-text projection of the richText `description` field — for SEO
   * meta description / JSON-LD only. Render `descriptionRichText` via
   * `LexicalContent` for the actual page body to get full formatting. */
  description: string;
  /** Raw serialized Lexical richText state for `description` (upgraded from
   * a plain textarea for full editor-toolbar parity). `null` for legacy rows
   * saved before the upgrade that still hold a bare string, or when empty. */
  descriptionRichText?: unknown | null;
  shortDescription: string;
  icon: string;
  image?: string;
  seo?: SeoOverrides;
  // NOTE: `doctors` and `faqs` are NOT populated by getServices today —
  // dropped from the type to keep the contract honest. Add back once a
  // Payload relationship/array field is wired in and the getter returns it.
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  photo: string;
  biography: string;
  /**
   * Raw serialized Lexical richText state for `biography` (same underlying
   * Payload field as `biography` above, which is a flattened plain-text
   * projection used for search/meta-description). Render this via
   * `LexicalContent` to get full formatting (bold/lists/links/etc.) on the
   * doctor profile; `null` for legacy/seed doctors that never had a Payload
   * row, or when the admin left the field empty.
   */
  biographyRichText?: unknown | null;
  qualifications: string[];
  specializations: string[];
  experienceYears: number;
  languagesSpoken: string[];
  isDepartmentHead: boolean;
  lastUpdated?: string | null;
  /**
   * Payload's auto-managed timestamp of the record's last save. Used as a
   * fallback for the "Last updated" line on the doctor profile when admin
   * hasn't filled in the manual `lastUpdated` date. Always present on
   * any row Payload returned.
   */
  updatedAt?: string | null;
  // Doctra link fields drive the booking widget render on doctor profiles.
  // Read by DoctorProfileClient → DoctorMiniBooking. Without these the
  // profile page silently hides the booking CTA + widget.
  doctraId?: string | null;
  doctraBranchId?: string | null;
  /**
   * Admin-controlled switch (Payload `bookingEnabled` checkbox). When
   * false, the doctor profile renders without the booking CTA / widget
   * even when Doctra IDs are present. Used to hide booking for doctors
   * who have no Doctra slots, are on extended leave, or temporarily not
   * accepting bookings. Defaults to true on new records.
   */
  bookingEnabled?: boolean;
  /**
   * Admin-controlled (`showOnDoctorsPage` checkbox, default true). When false,
   * the doctor is hidden from the /doctors list + home featured grid, but the
   * profile stays reachable by direct link and the booking list is unaffected
   * (booking uses its own filter, never this field). Filtered in getDoctors()
   * unless `includeHidden` is passed (the profile page lookup).
   */
  showOnDoctorsPage?: boolean;
  seo?: SeoOverrides;
  // NOTE: `services` and `reviews` were never wired through getDoctors().
  // Dropped to keep type contract honest.
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  articleType: "condition" | "symptom" | "treatment";
  excerpt: string;
  content: ArticleSection[];
  relatedDoctors?: Doctor[];
  relatedArticles?: Article[];
  lastUpdated: string;
  image?: string;
}

export interface ArticleSection {
  type:
    | "what_is_it"
    | "symptoms"
    | "causes"
    | "risks"
    | "diagnostics"
    | "treatment"
    | "prevention";
  title: string;
  content: string;
}

export interface CheckupPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  includedServices: string[];
  isFeatured: boolean;
  phone?: string | null;
  audience?: 'woman' | 'man' | 'child' | null;
  tier?: string | null;
  includedTests?: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  source: "google" | "internal";
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedDate: string;
  category: string;
  featuredImage: string;
}
