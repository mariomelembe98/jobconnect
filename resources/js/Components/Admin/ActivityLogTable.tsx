import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDateTime } from '../../lib/formatters';
import { ACTIVITY_ACTION_LABELS, ACTIVITY_MODULE_LABELS } from '../../lib/constants';
import type { ActivityLog } from '../../types';

interface ActivityLogTableProps {
    logs: ActivityLog[];
    selectedId: number | null;
    onSelect: (log: ActivityLog) => void;
}

export function ActivityLogTable({ logs, selectedId, onSelect }: ActivityLogTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Utilizador</th>
                                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acção</th>
                                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Módulo</th>
                                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">IP</th>
                                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Criado em</th>
                                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Detalhe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const selected = selectedId === log.id;

                                return (
                                    <tr key={log.id} className={selected ? 'bg-brand-50/60' : ''}>
                                        <td className="border-b border-slate-100 px-4 py-4 align-top">
                                            <div className="grid gap-1">
                                                <span className="font-semibold text-slate-950">{log.user_name ?? '—'}</span>
                                                <span className="text-xs text-slate-500">#{log.user_id ?? '—'}</span>
                                            </div>
                                        </td>
                                        <td className="border-b border-slate-100 px-4 py-4 align-top">
                                            <Badge variant={actionVariant(log.action)}>{ACTIVITY_ACTION_LABELS[log.action] ?? log.action}</Badge>
                                        </td>
                                        <td className="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-600">{ACTIVITY_MODULE_LABELS[log.module] ?? log.module}</td>
                                        <td className="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-600">{log.ip_address ?? '—'}</td>
                                        <td className="border-b border-slate-100 px-4 py-4 align-top text-sm text-slate-600">{formatDateTime(log.created_at)}</td>
                                        <td className="border-b border-slate-100 px-4 py-4 align-top text-right">
                                            <Button variant="outline" size="sm" onClick={() => onSelect(log)}>Ver detalhe</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
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
