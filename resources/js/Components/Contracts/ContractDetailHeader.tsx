import { Badge, type BadgeProps } from '../ui/Badge';
import { STATUS_LABELS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';
import type { Contract } from '../../types';

const statusVariants: Record<Contract['status'], BadgeProps['variant']> = {
    active: 'blue',
    completed: 'green',
    cancelled: 'gray',
    disputed: 'amber',
};

export function ContractDetailHeader({ contract }: { contract: Contract }) {
    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 p-6 text-white shadow-elevated sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-brand-100">Contrato #{contract.id}</p>
                        <Badge variant={statusVariants[contract.status]} className="bg-white/90">{STATUS_LABELS[contract.status]}</Badge>
                    </div>
                    <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{contract.service_request?.title ?? 'Serviço contratado'}</h1>
                    <p className="mt-2 text-sm text-brand-100">Valor acordado: <strong className="text-white">{formatCurrency(contract.amount)}</strong></p>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-3">
                    <Metric label="Taxa" value={formatCurrency(contract.platform_fee ?? 0)} />
                    <Metric label="Profissional" value={formatCurrency(contract.professional_amount ?? contract.amount)} />
                    <Metric className="col-span-2 sm:col-span-1" label="Estado" value={STATUS_LABELS[contract.status]} />
                </div>
            </div>
        </section>
    );
}

function Metric({ label, value, className = '' }: { label: string; value: string; className?: string }) {
    return <div className={className}><p className="text-xs text-brand-100">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>;
}
