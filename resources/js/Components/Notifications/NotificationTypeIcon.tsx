import type { NotificationType } from '../../types';

export function NotificationTypeIcon({ type }: { type: NotificationType }) {
    const group = notificationGroup(type);
    const presentation = {
        messages: { classes: 'bg-violet-50 text-violet-600', path: 'M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-5A9 9 0 1 1 21 12Z' },
        proposals: { classes: 'bg-brand-50 text-brand-600', path: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4' },
        contracts: { classes: 'bg-emerald-50 text-emerald-600', path: 'M4 7h16v13H4zM8 7V4h8v3M4 12h16' },
        verification: { classes: 'bg-amber-50 text-amber-600', path: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-10 2 2 4-5' },
        other: { classes: 'bg-slate-100 text-slate-600', path: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4' },
    }[group];

    return <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${presentation.classes}`}><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={presentation.path} /></svg></span>;
}

function notificationGroup(type: NotificationType): 'messages' | 'proposals' | 'contracts' | 'verification' | 'other' {
    if (type === 'new_message') return 'messages';
    if (type.startsWith('proposal_')) return 'proposals';
    if (type.startsWith('contract_')) return 'contracts';
    if (type.startsWith('verification_')) return 'verification';
    return 'other';
}
