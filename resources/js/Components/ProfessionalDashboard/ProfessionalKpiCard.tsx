import type { ReactNode } from 'react';

import { Card, CardContent } from '../ui/Card';

interface ProfessionalKpiCardProps {
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

export function ProfessionalKpiCard({ label, value, detail, icon, tone = 'blue' }: ProfessionalKpiCardProps) {
    return (
        <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </div>
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
            </CardContent>
        </Card>
    );
}
