interface BadgeProps {
  children: React.ReactNode;
  variant?: "blackberry" | "pink" | "grey";
  className?: string;
}

const variants = {
  blackberry: "bg-blackberry/10 text-blackberry",
  pink: "bg-pink-light text-pink-dark",
  grey: "bg-grey-lighter text-grey",
};

export default function Badge({
  children,
  variant = "blackberry",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
