import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Contract } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface ContractSummaryCardProps {
    contract: Contract;
}

export function ContractSummaryCard({ contract }: ContractSummaryCardProps) {
    return (
        <Card className="h-full transition hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">Contrato #{contract.id}</p>
                        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-950">{contract.service_request?.title ?? 'Serviço contratado'}</h3>
                    </div>
                    <Badge variant="green">{STATUS_LABELS[contract.status] ?? contract.status}</Badge>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div>
                        <p className="text-xs text-slate-500">Valor profissional</p>
                        <p className="mt-1 font-semibold text-slate-950">{formatCurrency(contract.professional_amount ?? contract.amount)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Início</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{contract.started_at ? formatDate(contract.started_at) : '—'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
