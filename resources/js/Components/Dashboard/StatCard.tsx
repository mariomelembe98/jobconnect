import type { ReactNode } from 'react';

import { Card, CardContent } from '../ui/Card';

interface StatCardProps {
    label: string;
    value: string;
    detail: string;
    icon: ReactNode;
    tone?: 'blue' | 'green' | 'amber' | 'violet';
}

const tones = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
};

export function StatCard({ label, value, detail, icon, tone = 'blue' }: StatCardProps) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </div>
                <span className={`flex size-11 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
            </CardContent>
        </Card>
    );
}

export function MiniIcon({ path }: { path: string }) {
    return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>;
}
