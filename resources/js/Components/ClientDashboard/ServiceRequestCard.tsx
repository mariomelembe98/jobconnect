import { Link } from '@inertiajs/react';

import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { ServiceRequest } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface ServiceRequestCardProps {
    serviceRequest: ServiceRequest;
}

const statusVariants: Record<ServiceRequest['status'], 'blue' | 'green' | 'amber' | 'red' | 'gray'> = {
    draft: 'gray',
    published: 'blue',
    receiving_proposals: 'amber',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red',
};

function budgetLabel(serviceRequest: ServiceRequest): string {
    if (!serviceRequest.budget_min && !serviceRequest.budget_max) {
        return 'Orçamento a combinar';
    }

    if (serviceRequest.budget_min && serviceRequest.budget_max) {
        return `${formatCurrency(serviceRequest.budget_min)} – ${formatCurrency(serviceRequest.budget_max)}`;
    }

    return formatCurrency(serviceRequest.budget_min ?? serviceRequest.budget_max ?? 0);
}

export function ServiceRequestCard({ serviceRequest }: ServiceRequestCardProps) {
    const location = [serviceRequest.city, serviceRequest.province].filter(Boolean).join(', ');

    return (
        <Card className="h-full transition hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
                            {serviceRequest.category?.name ?? 'Serviço'}
                        </p>
                        <h3 className="mt-1 line-clamp-1 font-semibold text-slate-950"><Link href={`/client/service-requests/${serviceRequest.id}`} className="hover:text-brand-700">{serviceRequest.title}</Link></h3>
                    </div>
                    <Badge variant={statusVariants[serviceRequest.status]}>{STATUS_LABELS[serviceRequest.status] ?? serviceRequest.status}</Badge>
                </div>

                <p className="line-clamp-2 text-sm leading-6 text-slate-500">{serviceRequest.description}</p>

                <div className="mt-auto grid gap-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                    <div>
                        <p className="text-xs text-slate-500">Orçamento</p>
                        <p className="mt-0.5 font-semibold text-slate-900">{budgetLabel(serviceRequest)}</p>
                    </div>
                    <div className="sm:text-center">
                        <p className="text-xs text-slate-500">Publicado</p>
                        <p className="mt-0.5 font-medium text-slate-700">{formatDate(serviceRequest.created_at)}</p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-xs text-slate-500">Propostas</p>
                        <p className="mt-0.5 font-semibold text-slate-900">{serviceRequest.proposals_count ?? 0}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                    {location ? <p className="min-w-0 flex-1 text-xs text-slate-500">{location}</p> : <span className="flex-1" />}
                    <Link href={`/client/service-requests/${serviceRequest.id}`} className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                        Ver detalhes
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
