import { formatCurrency, formatDate } from '../../lib/formatters';
import type { ServiceRequest } from '../../types';
import { Badge } from '../ui/Badge';

function budget(job: ServiceRequest): string {
    if (job.budget_min && job.budget_max) return `${formatCurrency(job.budget_min)} – ${formatCurrency(job.budget_max)}`;
    if (job.budget_min || job.budget_max) return formatCurrency(job.budget_min ?? job.budget_max ?? 0);
    return 'Negociável';
}

export function JobDetailHeader({ job }: { job: ServiceRequest }) {
    const location = [job.city, job.province].filter(Boolean).join(', ');

    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-5 py-8 text-white shadow-elevated sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl"><div className="flex flex-wrap gap-2"><Badge className="bg-white/15 text-white ring-white/20">{job.category?.name ?? 'Serviço'}</Badge><Badge className="bg-white/15 text-white ring-white/20">{job.service_type === 'remote' ? 'Remoto' : job.service_type === 'hybrid' ? 'Híbrido' : 'No local'}</Badge></div><h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{job.title}</h1><p className="mt-3 text-sm text-blue-100">{location || 'Localização não indicada'}</p></div>
                <div className="grid min-w-64 gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15"><div><p className="text-xs text-blue-100">Orçamento</p><p className="mt-1 font-semibold">{budget(job)}</p></div><div><p className="text-xs text-blue-100">Prazo</p><p className="mt-1 font-semibold">{job.deadline_at ? formatDate(job.deadline_at) : 'Sem prazo definido'}</p></div></div>
            </div>
        </section>
    );
}
