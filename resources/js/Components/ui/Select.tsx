import type { SelectHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    placeholder?: string;
    options: SelectOption[];
}

export function Select({ id, label, error, placeholder, options, className, ...props }: SelectProps) {
    const selectId = id ?? props.name;

    return (
        <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={selectId}>
            {label ? <span>{label}</span> : null}
            <select
                id={selectId}
                className={cn(
                    'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100',
                    error ? 'border-red-400' : 'border-slate-300',
                    className,
                )}
                aria-invalid={Boolean(error)}
                {...props}
            >
                {placeholder ? <option value="">{placeholder}</option> : null}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
        </label>
    );
}
