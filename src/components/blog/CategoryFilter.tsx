import { Link } from "@/i18n/navigation";

type Category = { slug: string; name: string };

export default function CategoryFilter({
  categories,
  activeSlug,
  allLabel,
}: {
  categories: Category[];
  activeSlug?: string;
  allLabel: string;
}) {
  if (categories.length === 0) return null;

  const pill = (active: boolean) =>
    `inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-all duration-300 whitespace-nowrap ${
      active
        ? "bg-blackberry text-white shadow-sm"
        : "bg-white text-blackberry border border-grey-lighter hover:border-pink/40 hover:text-pink"
    }`;

  return (
    <div className="flex flex-wrap gap-2.5 mb-10 sm:mb-12" role="navigation" aria-label={allLabel}>
      <Link href="/blog" className={pill(!activeSlug)}>
        {allLabel}
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={{ pathname: "/blog", query: { category: cat.slug } }}
          className={pill(activeSlug === cat.slug)}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
