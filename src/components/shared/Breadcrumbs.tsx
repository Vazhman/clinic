import { Link } from "@/i18n/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-[12px] md:text-sm text-grey-light">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 min-w-0">
            {index > 0 && (
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.href ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={item.href as any}
                className="hover:text-blackberry transition-colors break-words"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-blackberry font-medium break-words">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
