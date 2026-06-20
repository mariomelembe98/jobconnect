import { APP_NAME } from '../lib/constants';
import { cn } from '../lib/utils';

interface BrandMarkProps {
    compact?: boolean;
    inverse?: boolean;
    className?: string;
}

export function BrandMark({ compact = false, inverse = false, className }: BrandMarkProps) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <span className={cn('flex size-10 items-center justify-center rounded-xl shadow-sm', inverse ? 'bg-white text-brand-700' : 'bg-brand-600 text-white')}>
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M7 8.5h10M7 12h7M8.5 19l-3.25-2.5A3 3 0 0 1 4 14.1V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-5.5L8.5 19Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            {!compact ? (
                <span className={cn('text-lg font-bold tracking-tight', inverse ? 'text-white' : 'text-slate-950')}>{APP_NAME}</span>
            ) : null}
        </div>
    );
}
