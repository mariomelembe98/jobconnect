import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { ServiceRequest } from '../../types';
import { Badge } from '../ui/Badge';

const statusVariants: Record<ServiceRequest['status'], 'blue' | 'green' | 'amber' | 'red' | 'gray'> = {
    draft: 'gray',
    published: 'blue',
    receiving_proposals: 'amber',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
};

function budgetLabel(serviceRequest: ServiceRequest): string {
    if (serviceRequest.budget_min && serviceRequest.budget_max) {
        return `${formatCurrency(serviceRequest.budget_min)} – ${formatCurrency(serviceRequest.budget_max)}`;
    }

    if (serviceRequest.budget_min || serviceRequest.budget_max) {
        return formatCurrency(serviceRequest.budget_min ?? serviceRequest.budget_max ?? 0);
    }

    return 'A combinar';
}

export function ServiceRequestDetailHeader({ serviceRequest }: { serviceRequest: ServiceRequest }) {
    const location = [serviceRequest.city, serviceRequest.province].filter(Boolean).join(', ');

    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-5 py-7 text-white shadow-elevated sm:px-8 sm:py-9">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-white/15 text-white ring-white/20">{serviceRequest.category?.name ?? 'Serviço'}</Badge>
                        <Badge variant={statusVariants[serviceRequest.status]}>{STATUS_LABELS[serviceRequest.status] ?? serviceRequest.status}</Badge>
                    </div>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{serviceRequest.title}</h1>
                    <p className="mt-3 text-sm text-blue-100">{location || 'Localização não indicada'}</p>
                </div>
                <div className="grid min-w-64 gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 sm:grid-cols-2 lg:grid-cols-1">
                    <div><p className="text-xs text-blue-100">Orçamento</p><p className="mt-1 font-semibold">{budgetLabel(serviceRequest)}</p></div>
                    <div><p className="text-xs text-blue-100">Prazo</p><p className="mt-1 font-semibold">{serviceRequest.deadline_at ? formatDate(serviceRequest.deadline_at) : 'Sem prazo definido'}</p></div>
                </div>
            </div>
        </section>
    );
}
