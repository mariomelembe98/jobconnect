import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Proposal } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface ProposalSummaryCardProps {
    proposal: Proposal;
}

const variants: Record<Proposal['status'], 'blue' | 'green' | 'red' | 'gray' | 'amber'> = {
    pending: 'amber',
    accepted: 'green',
    rejected: 'red',
    withdrawn: 'gray',
    expired: 'gray',
};

export function ProposalSummaryCard({ proposal }: ProposalSummaryCardProps) {
    const location = [proposal.service_request?.city, proposal.service_request?.province].filter(Boolean).join(', ');

    return (
        <Card className="h-full transition hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Proposta #{proposal.id}</p>
                        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-950">{proposal.service_request?.title ?? 'Pedido de serviço'}</h3>
                    </div>
                    <Badge variant={variants[proposal.status]}>{STATUS_LABELS[proposal.status] ?? proposal.status}</Badge>
                </div>
                {location ? <p className="text-sm text-slate-500">{location}</p> : null}
                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                        <p className="text-xs text-slate-500">Valor proposto</p>
                        <p className="mt-1 font-semibold text-slate-950">{formatCurrency(proposal.amount)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Enviada</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{proposal.created_at ? formatDate(proposal.created_at) : '—'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
