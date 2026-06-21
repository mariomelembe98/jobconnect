import { Link } from '@inertiajs/react';

import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { ServiceRequest } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

function budgetLabel(job: ServiceRequest): string {
    if (job.budget_min && job.budget_max) return `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`;
    if (job.budget_min || job.budget_max) return formatCurrency(job.budget_min ?? job.budget_max ?? 0);
    return 'A combinar';
}

export function ProfessionalJobCard({ job }: { job: ServiceRequest }) {
    const location = [job.city, job.province].filter(Boolean).join(', ');

    return (
        <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">{job.category?.name ?? 'Serviço'}</p><h2 className="mt-1 line-clamp-2 font-semibold text-slate-950">{job.title}</h2></div>
                    <Badge variant={job.status === 'receiving_proposals' ? 'amber' : 'blue'}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-slate-500">{job.description}</p>
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div><p className="text-xs text-slate-500">Orçamento</p><p className="mt-1 font-semibold text-slate-950">{budgetLabel(job)}</p></div>
                    <div className="text-right"><p className="text-xs text-slate-500">Prazo</p><p className="mt-1 font-semibold text-slate-950">{job.deadline_at ? formatDate(job.deadline_at) : 'A combinar'}</p></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{location || (job.service_type === 'remote' ? 'Serviço remoto' : 'Local a confirmar')}</span>{typeof job.proposals_count === 'number' ? <span>{job.proposals_count} propostas</span> : null}</div>
                <Link href={`/professional/jobs/${job.id}`} className="mt-auto inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Ver detalhes</Link>
            </CardContent>
        </Card>
    );
}
