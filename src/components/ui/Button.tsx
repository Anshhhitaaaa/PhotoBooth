import { clsx } from '@/lib/utils';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: BtnProps) {
  const variants: Record<string, string> = {
    primary:
      'bg-pink-500 text-white hover:bg-pink-600 shadow-md shadow-pink-500/25',
    soft: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    ghost: 'bg-transparent text-stone-600 hover:bg-pink-100/70',
    danger: 'bg-red-100 text-red-600 hover:bg-red-200',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
