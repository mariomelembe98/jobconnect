import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export function LoadingSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} aria-hidden="true" {...props} />;
}

export function CardSkeleton() {
    return (
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card">
            <div className="flex items-center gap-3">
                <LoadingSkeleton className="size-10 rounded-xl" />
                <div className="grid flex-1 gap-2">
                    <LoadingSkeleton className="h-4 w-2/5" />
                    <LoadingSkeleton className="h-3 w-3/5" />
                </div>
            </div>
            <LoadingSkeleton className="h-20 w-full" />
        </div>
    );
}
