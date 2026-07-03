interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered";
  hover?: boolean;
}

const variants = {
  default: "bg-white",
  elevated: "bg-white shadow-xl shadow-blackberry/5",
  bordered: "bg-white border border-grey-lighter",
};

export default function Card({
  children,
  className = "",
  variant = "default",
  hover = false,
}: CardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden break-words ${variants[variant]} ${hover ? "transition-all duration-300 hover:shadow-2xl hover:shadow-blackberry/10 hover:-translate-y-1" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
