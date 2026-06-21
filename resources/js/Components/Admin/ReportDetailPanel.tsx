import type { ReactNode } from 'react';

import { AdminStatusBadge } from './AdminStatusBadge';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { formatDateTime } from '../../lib/formatters';

export interface AdminReportItem {
    id: number;
    report_type: 'user' | 'service_request' | 'contract' | 'message' | 'review';
    reason: string;
    description: string | null;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    reviewed_by: number | null;
    reviewed_at: string | null;
    resolution_note: string | null;
    reporter?: { id: number; name: string } | null;
    reported_user?: { id: number; name: string } | null;
    service_request_id?: number | null;
    contract_id?: number | null;
    created_at?: string;
    updated_at?: string;
}

interface ReportDetailPanelProps {
    report: AdminReportItem | null;
    actionSlot?: ReactNode;
    onReview: () => void;
    onResolve: () => void;
    onDismiss: () => void;
}

export function ReportDetailPanel({ report, actionSlot, onReview, onResolve, onDismiss }: ReportDetailPanelProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                {report ? (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Detalhe da denúncia</p>
                                <h3 className="mt-1 text-xl font-bold text-slate-950"># {report.id}</h3>
                                <p className="mt-1 text-sm text-slate-500">{formatDateTime(report.created_at ?? new Date())}</p>
                            </div>
                            <AdminStatusBadge kind="report" value={report.status} />
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                            <Info label="Tipo" value={reportTypeLabel(report.report_type)} />
                            <Info label="Motivo" value={report.reason} />
                            <Info label="Denunciante" value={report.reporter?.name ?? '—'} />
                            <Info label="Denunciado" value={report.reported_user?.name ?? '—'} />
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                            <Info label="Pedido" value={report.service_request_id ? `#${report.service_request_id}` : '—'} />
                            <Info label="Contrato" value={report.contract_id ? `#${report.contract_id}` : '—'} />
                            <Info label="Revisado por" value={report.reviewed_by ? `Utilizador #${report.reviewed_by}` : '—'} />
                            <Info label="Revisado em" value={report.reviewed_at ? formatDateTime(report.reviewed_at) : '—'} />
                        </div>

                        {report.description ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{report.description}</p> : <EmptyState title="Sem descrição" description="A denúncia não inclui descrição adicional." />}

                        {report.resolution_note ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{report.resolution_note}</p> : null}

                        {actionSlot}

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={onReview}>Marcar como em análise</Button>
                            <Button onClick={onResolve}>Resolver</Button>
                            <Button variant="danger" onClick={onDismiss}>Descartar</Button>
                        </div>
                    </>
                ) : (
                    <EmptyState title="Selecione uma denúncia" description="Clique numa linha da lista para abrir os detalhes e iniciar a moderação." />
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

function reportTypeLabel(type: AdminReportItem['report_type']): string {
    return {
        user: 'Utilizador',
        service_request: 'Pedido',
        contract: 'Contrato',
        message: 'Mensagem',
        review: 'Avaliação',
    }[type];
}
