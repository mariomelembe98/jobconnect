import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { REPORT_REASON_LABELS, REPORT_TYPE_LABELS, STATUS_LABELS } from '../../lib/constants';
import { formatDateTime } from '../../lib/formatters';
import type { Report } from '../../types';

const statusVariant: Record<Report['status'], 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'> = {
    pending: 'amber',
    reviewing: 'blue',
    resolved: 'green',
    dismissed: 'gray',
};

interface ReportHistoryCardProps {
    report: Report;
    active?: boolean;
    onSelect: () => void;
}

export function ReportHistoryCard({ report, active = false, onSelect }: ReportHistoryCardProps) {
    return (
        <Card className={active ? 'border-brand-300 shadow-elevated ring-2 ring-brand-100' : undefined}>
            <CardContent className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Denúncia #{report.id}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950">{REPORT_TYPE_LABELS[report.report_type] ?? 'Denúncia'}</h3>
                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(report.created_at ?? new Date())}</p>
                    </div>
                    <Badge variant={statusVariant[report.status]}>{STATUS_LABELS[report.status]}</Badge>
                </div>

                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                    <Info label="Motivo" value={REPORT_REASON_LABELS[report.reason] ?? report.reason} />
                    <Info label="Denunciado" value={report.reported_user?.name ?? report.reported_user_id?.toString() ?? '—'} />
                    <Info label="Pedido" value={report.service_request_id ? `#${report.service_request_id}` : '—'} />
                    <Info label="Contrato" value={report.contract_id ? `#${report.contract_id}` : '—'} />
                </div>

                {report.description ? <p className="text-sm leading-6 text-slate-600">{report.description}</p> : null}

                <div className="flex justify-end">
                    <Button variant={active ? 'secondary' : 'outline'} size="sm" onClick={onSelect}>
                        {active ? 'Detalhes abertos' : 'Ver detalhes'}
                    </Button>
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
