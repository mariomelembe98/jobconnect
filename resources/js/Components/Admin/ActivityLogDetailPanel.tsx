import { useEffect } from 'react';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { formatDateTime } from '../../lib/formatters';
import { ACTIVITY_ACTION_LABELS, ACTIVITY_MODULE_LABELS } from '../../lib/constants';
import type { ActivityLog } from '../../types';

interface ActivityLogDetailPanelProps {
    open: boolean;
    log: ActivityLog | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onRetry: () => void;
}

export function ActivityLogDetailPanel({ open, log, isLoading, error, onClose, onRetry }: ActivityLogDetailPanelProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        function closeOnEscape(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="ml-auto flex h-full w-full max-w-2xl flex-col bg-surface shadow-elevated">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Detalhe do registo</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">{log ? (ACTIVITY_ACTION_LABELS[log.action] ?? log.action) : 'Registo de actividade'}</h2>
                    </div>
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <Card>
                            <CardContent className="grid gap-4 p-6">
                                <div className="h-5 w-44 animate-pulse rounded-full bg-slate-200" />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                                </div>
                            </CardContent>
                        </Card>
                    ) : error ? (
                        <EmptyState title="Não foi possível carregar o registo" description={error} action={<Button onClick={onRetry}>Tentar novamente</Button>} />
                    ) : log ? (
                        <div className="grid gap-5">
                            <Card>
                                <CardContent className="grid gap-5 p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-slate-500">{formatDateTime(log.created_at)}</p>
                                            <h3 className="mt-1 text-2xl font-bold text-slate-950">{log.user_name ?? 'Utilizador removido'}</h3>
                                            <p className="mt-1 text-sm text-slate-500">ID do utilizador #{log.user_id ?? '—'}</p>
                                        </div>
                                        <Badge variant={actionVariant(log.action)}>{ACTIVITY_ACTION_LABELS[log.action] ?? log.action}</Badge>
                                    </div>

                                    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                                        <Info label="Módulo" value={ACTIVITY_MODULE_LABELS[log.module] ?? log.module} />
                                        <Info label="Acção" value={log.action} />
                                        <Info label="Sujeito" value={log.subject_type ?? '—'} />
                                        <Info label="ID do sujeito" value={log.subject_id?.toString() ?? '—'} />
                                        <Info label="IP" value={log.ip_address ?? '—'} />
                                        <Info label="Criado em" value={formatDateTime(log.created_at)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="grid gap-4 p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="text-base font-semibold text-slate-950">Metadados</h4>
                                        <Badge variant="gray">{Object.keys(log.metadata ?? {}).length} entradas</Badge>
                                    </div>
                                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                        <div className="grid gap-3">
                                            {Object.entries(log.metadata).map(([key, value]) => (
                                                <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{key}</p>
                                                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm text-slate-700">{formatMetadataValue(value)}</pre>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState title="Sem metadados" description="Este registo não inclui informação adicional." />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <EmptyState title="Selecione um registo" description="Escolha uma linha da tabela para ver os detalhes completos." />
                    )}
                </div>
            </div>
        </div>
    );
}

function formatMetadataValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '—';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return JSON.stringify(value, null, 2);
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function actionVariant(action: string): 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet' {
    switch (action) {
        case 'user_login':
        case 'proposal_submitted':
        case 'service_request_created':
            return 'blue';
        case 'proposal_accepted':
        case 'contract_completed':
        case 'verification_approved':
            return 'green';
        case 'user_suspended':
            return 'amber';
        case 'user_blocked':
        case 'contract_cancelled':
        case 'verification_rejected':
            return 'red';
        case 'report_created':
        case 'dispute_created':
            return 'violet';
        default:
            return 'gray';
    }
}
