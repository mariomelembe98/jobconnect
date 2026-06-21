import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { REPORT_REASON_LABELS, REPORT_TYPE_LABELS, STATUS_LABELS } from '../../lib/constants';
import { formatDateTime } from '../../lib/formatters';
import type { Report } from '../../types';

const statusVariant: Record<Report['status'], 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'> = {
    pending: 'amber',
    reviewing: 'blue',
    resolved: 'green',
    dismissed: 'gray',
};

interface ReportDetailPanelProps {
    report: Report | null;
}

export function ReportDetailPanel({ report }: ReportDetailPanelProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                {report ? (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Detalhe da denúncia</p>
                                <h3 className="mt-1 text-xl font-bold text-slate-950">#{report.id}</h3>
                                <p className="mt-1 text-sm text-slate-500">{formatDateTime(report.created_at ?? new Date())}</p>
                            </div>
                            <Badge variant={statusVariant[report.status]}>{STATUS_LABELS[report.status]}</Badge>
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                            <Info label="Tipo" value={REPORT_TYPE_LABELS[report.report_type] ?? report.report_type} />
                            <Info label="Motivo" value={REPORT_REASON_LABELS[report.reason] ?? report.reason} />
                            <Info label="Denunciante" value={report.reporter?.name ?? `Utilizador #${report.reporter_id}`} />
                            <Info label="Denunciado" value={report.reported_user?.name ?? (report.reported_user_id ? `Utilizador #${report.reported_user_id}` : '—')} />
                            <Info label="Pedido" value={report.service_request_id ? `#${report.service_request_id}` : '—'} />
                            <Info label="Contrato" value={report.contract_id ? `#${report.contract_id}` : '—'} />
                        </div>

                        {report.description ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{report.description}</p> : <EmptyState title="Sem descrição" description="Esta denúncia não inclui descrição adicional." />}

                        {report.resolution_note ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{report.resolution_note}</p> : null}

                        <div className="grid gap-3 text-sm text-slate-600">
                            <Info label="Revisado por" value={report.reviewed_by ? `Utilizador #${report.reviewed_by}` : '—'} />
                            <Info label="Revisado em" value={report.reviewed_at ? formatDateTime(report.reviewed_at) : '—'} />
                        </div>
                    </>
                ) : (
                    <EmptyState title="Selecione uma denúncia" description="Abra um item da lista para ver os detalhes completos." />
                )}
            </CardContent>
        </Card>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
    );
}
