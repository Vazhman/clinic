interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  centered = true,
  light = false,
}: SectionHeaderProps) {
  return (
    <div className={`mb-8 sm:mb-12 ${centered ? "text-center" : ""}`}>
      <h2
        className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 break-words ${light ? "text-white" : "text-blackberry"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-base sm:text-lg max-w-2xl break-words ${centered ? "mx-auto" : ""} ${light ? "text-white/80" : "text-grey-light"}`}
        >
          {subtitle}
        </p>
      )}
      <div
        className={`w-16 sm:w-20 h-1 rounded-full mt-4 sm:mt-6 ${centered ? "mx-auto" : ""} ${light ? "bg-pink" : "bg-pink"}`}
      />
    </div>
  );
}
