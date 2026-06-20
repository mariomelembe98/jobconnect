import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-200',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-100',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-brand-100',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-slate-200',
    danger: 'bg-danger text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-100',
};

const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 rounded-lg px-3 text-sm',
    md: 'h-11 rounded-xl px-4 text-sm',
    lg: 'h-12 rounded-xl px-5 text-base',
    icon: 'size-10 rounded-xl',
};

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    children,
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                'inline-flex items-center justify-center gap-2 font-semibold transition-colors outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className,
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
            ) : null}
            {children}
        </button>
    );
}
