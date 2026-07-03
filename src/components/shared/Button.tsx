import { Link } from "@/i18n/navigation";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-blackberry text-white hover:bg-blackberry-light active:bg-blackberry-dark shadow-lg shadow-blackberry/20",
  secondary:
    "bg-pink text-white hover:bg-pink-dark active:bg-pink shadow-lg shadow-pink/20",
  outline:
    "border-2 border-blackberry text-blackberry hover:bg-blackberry hover:text-white",
  ghost: "text-blackberry hover:bg-pink-light",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm min-h-[40px]",
  md: "px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base min-h-[44px]",
  lg: "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[48px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = `inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 cursor-pointer text-center break-words whitespace-normal ${variants[variant]} ${sizes[size]} ${className}`;

  if ("href" in props && props.href) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const href = props.href as any;
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = props as ButtonAsButton;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
