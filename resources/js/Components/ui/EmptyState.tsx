import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center', className)}>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                {icon ?? (
                    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M5 12h14M12 5v14" strokeLinecap="round" />
                    </svg>
                )}
            </div>
            <div className="grid max-w-sm gap-1.5">
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <p className="text-sm leading-6 text-slate-500">{description}</p>
            </div>
            {action}
        </div>
    );
}
