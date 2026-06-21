import { Link } from '@inertiajs/react';

import { Badge, type BadgeProps } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/formatters';
import type { Contract, UserType } from '../../types';

interface ContractCardProps {
    contract: Contract;
    viewerType?: UserType;
    onOpenChat: () => void;
}

const statusVariants: Record<Contract['status'], BadgeProps['variant']> = {
    active: 'blue',
    completed: 'green',
    cancelled: 'gray',
    disputed: 'amber',
};

export function ContractCard({ contract, viewerType, onOpenChat }: ContractCardProps) {
    const participantName = viewerType === 'client'
        ? contract.professional_profile?.user?.name
        : contract.client?.name;

    return (
        <Card className="flex h-full flex-col transition hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Contrato #{contract.id}</p>
                        <h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-950">{contract.service_request?.title ?? 'Serviço contratado'}</h2>
                    </div>
                    <Badge variant={statusVariants[contract.status]}>{STATUS_LABELS[contract.status]}</Badge>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                    <div>
                        <dt className="text-xs text-slate-500">Valor do contrato</dt>
                        <dd className="mt-1 font-bold text-slate-950">{formatCurrency(contract.amount)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-500">Início</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-800">{contract.started_at ? formatDate(contract.started_at) : 'Por iniciar'}</dd>
                    </div>
                </dl>

                <div className="mt-4 flex-1 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-800">{viewerType === 'client' ? 'Profissional' : 'Cliente'}:</span> {participantName ?? 'Informação indisponível'}</p>
                    {contract.platform_fee ? <p className="mt-2"><span className="font-semibold text-slate-800">Taxa da plataforma:</span> {formatCurrency(contract.platform_fee)}</p> : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Link
                        href={`/contracts/${contract.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                    >
                        Ver detalhes
                    </Link>
                    {contract.conversation?.id ? <Button variant="outline" size="sm" onClick={onOpenChat}>Abrir conversa</Button> : null}
                </div>
            </CardContent>
        </Card>
    );
}
