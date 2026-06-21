import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Proposal } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface ProposalReceivedCardProps {
    proposal: Proposal;
    disabled?: boolean;
    onAccept: (proposal: Proposal) => void;
    onReject: (proposal: Proposal) => void;
}

const statusVariants: Record<Proposal['status'], 'green' | 'amber' | 'red' | 'gray'> = {
    pending: 'amber',
    accepted: 'green',
    rejected: 'red',
    withdrawn: 'gray',
    expired: 'gray',
};

export function ProposalReceivedCard({ proposal, disabled, onAccept, onReject }: ProposalReceivedCardProps) {
    const profile = proposal.professional_profile;

    return (
        <Card className="h-full transition hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Proposta #{proposal.id}</p>
                        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-950">{profile?.headline || `Profissional #${profile?.id ?? proposal.professional_profile_id}`}</h3>
                    </div>
                    <Badge variant={statusVariants[proposal.status]}>{STATUS_LABELS[proposal.status] ?? proposal.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div><p className="text-xs text-slate-500">Valor</p><p className="mt-1 font-semibold text-slate-950">{formatCurrency(proposal.amount)}</p></div>
                    <div className="text-right"><p className="text-xs text-slate-500">Entrega</p><p className="mt-1 font-semibold text-slate-950">{proposal.delivery_days ? `${proposal.delivery_days} dias` : 'A combinar'}</p></div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>★ {Number(profile?.average_rating ?? 0).toFixed(1)}</span>
                    <span>{proposal.created_at ? formatDate(proposal.created_at) : ''}</span>
                </div>

                {proposal.status === 'pending' ? (
                    <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                        <Button variant="outline" size="sm" disabled={disabled} onClick={() => onReject(proposal)}>Rejeitar</Button>
                        <Button size="sm" disabled={disabled} onClick={() => onAccept(proposal)}>Aceitar</Button>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
