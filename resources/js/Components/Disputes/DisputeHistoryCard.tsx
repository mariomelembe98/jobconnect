import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { DISPUTE_RESOLUTION_LABELS, STATUS_LABELS } from '../../lib/constants';
import { formatDateTime } from '../../lib/formatters';
import type { Dispute } from '../../types';

const statusVariant: Record<Dispute['status'], 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'> = {
    pending: 'amber',
    under_review: 'blue',
    resolved: 'green',
    dismissed: 'gray',
};

interface DisputeHistoryCardProps {
    dispute: Dispute;
    onSelect: () => void;
}

export function DisputeHistoryCard({ dispute, onSelect }: DisputeHistoryCardProps) {
    return (
        <Card>
            <CardContent className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Disputa #{dispute.id}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950">{dispute.contract?.service_request?.title ?? `Contrato #${dispute.contract_id}`}</h3>
                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(dispute.created_at ?? new Date())}</p>
                    </div>
                    <Badge variant={statusVariant[dispute.status]}>{STATUS_LABELS[dispute.status]}</Badge>
                </div>

                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                    <Info label="Motivo" value={dispute.reason} />
                    <Info label="Resolução" value={dispute.resolution ? DISPUTE_RESOLUTION_LABELS[dispute.resolution] ?? dispute.resolution : '—'} />
                    <Info label="Aberta por" value={dispute.opener?.name ?? `Utilizador #${dispute.opened_by}`} />
                    <Info label="Contrato" value={`#${dispute.contract_id}`} />
                </div>

                {dispute.description ? <p className="text-sm leading-6 text-slate-600">{dispute.description}</p> : null}

                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={onSelect}>Ver detalhes</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
    );
}
