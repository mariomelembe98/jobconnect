import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Input({ id, label, error, hint, className, ...props }: InputProps) {
    const inputId = id ?? props.name;
    const descriptionId = inputId ? `${inputId}-description` : undefined;

    return (
        <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={inputId}>
            {label ? <span>{label}</span> : null}
            <input
                id={inputId}
                className={cn(
                    'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
                    error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
                    className,
                )}
                aria-invalid={Boolean(error)}
                aria-describedby={error || hint ? descriptionId : undefined}
                {...props}
            />
            {error || hint ? (
                <span id={descriptionId} className={cn('text-xs', error ? 'text-red-600' : 'text-slate-500')}>
                    {error ?? hint}
                </span>
            ) : null}
        </label>
    );
}
