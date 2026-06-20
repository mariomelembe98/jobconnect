import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utils';

type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: ReactNode;
}

const variants: Record<BadgeVariant, string> = {
    blue: 'bg-brand-50 text-brand-700 ring-brand-600/10',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    red: 'bg-red-50 text-red-700 ring-red-600/10',
    gray: 'bg-slate-100 text-slate-600 ring-slate-500/10',
    violet: 'bg-violet-50 text-violet-700 ring-violet-600/10',
};

export function Badge({ variant = 'blue', className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', variants[variant], className)}
            {...props}
        >
            {children}
        </span>
    );
}
