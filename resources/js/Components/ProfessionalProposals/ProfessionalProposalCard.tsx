import { Link } from '@inertiajs/react';

import { Badge, type BadgeProps } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Proposal } from '../../types';

interface ProfessionalProposalCardProps {
    proposal: Proposal;
    onWithdraw: (proposal: Proposal) => void;
}

const statusPresentation: Record<Proposal['status'], { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pendente', variant: 'amber' },
    accepted: { label: 'Aceite', variant: 'green' },
    rejected: { label: 'Rejeitada', variant: 'red' },
    withdrawn: { label: 'Retirada', variant: 'gray' },
    expired: { label: 'Expirada', variant: 'gray' },
};

export function ProfessionalProposalCard({ proposal, onWithdraw }: ProfessionalProposalCardProps) {
    const status = statusPresentation[proposal.status];
    const job = proposal.service_request;

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CardContent className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Proposta #{proposal.id}</p>
                        <h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-950">{job?.title ?? 'Pedido de serviço'}</h2>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                    <div>
                        <dt className="text-xs text-slate-500">Valor proposto</dt>
                        <dd className="mt-1 font-bold text-slate-950">{formatCurrency(proposal.amount)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-500">Prazo de entrega</dt>
                        <dd className="mt-1 font-semibold text-slate-800">
                            {proposal.delivery_days ? `${proposal.delivery_days} ${proposal.delivery_days === 1 ? 'dia' : 'dias'}` : 'A combinar'}
                        </dd>
                    </div>
                </dl>

                <div className="mt-4 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mensagem</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {proposal.message || 'Nenhuma mensagem incluída nesta proposta.'}
                    </p>
                </div>

                <p className="mt-5 text-xs text-slate-400">
                    Enviada em {proposal.created_at ? formatDate(proposal.created_at) : 'data não disponível'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {job?.id ? (
                        <Link
                            href={`/professional/jobs/${job.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                        >
                            Ver trabalho
                        </Link>
                    ) : null}
                    {proposal.status === 'pending' ? (
                        <Button variant="danger" size="sm" onClick={() => onWithdraw(proposal)}>
                            Retirar proposta
                        </Button>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
