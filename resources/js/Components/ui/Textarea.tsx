import type { TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Textarea({ id, label, error, hint, className, rows = 4, ...props }: TextareaProps) {
    const textareaId = id ?? props.name;
    const descriptionId = textareaId ? `${textareaId}-description` : undefined;

    return (
        <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={textareaId}>
            {label ? <span>{label}</span> : null}
            <textarea
                id={textareaId}
                rows={rows}
                className={cn(
                    'w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100',
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
