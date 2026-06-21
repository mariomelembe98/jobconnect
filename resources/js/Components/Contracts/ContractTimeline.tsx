import { STATUS_LABELS } from '../../lib/constants';
import { formatDateTime } from '../../lib/formatters';
import type { ContractStatusLog } from '../../types';

export function ContractTimeline({ logs }: { logs: ContractStatusLog[] }) {
    if (logs.length === 0) {
        return <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Ainda não existem alterações registadas neste contrato.</p>;
    }

    return (
        <ol className="grid gap-0">
            {logs.map((log, index) => (
                <li key={log.id} className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 pb-6 last:pb-0">
                    {index < logs.length - 1 ? <span className="absolute left-[0.7rem] top-5 h-full w-px bg-slate-200" aria-hidden="true" /> : null}
                    <span className="relative z-10 mt-1 size-6 rounded-full border-4 border-white bg-brand-600 shadow-sm" aria-hidden="true" />
                    <div>
                        <p className="font-semibold text-slate-900">
                            {log.old_status ? `${STATUS_LABELS[log.old_status] ?? log.old_status} → ` : ''}{STATUS_LABELS[log.new_status] ?? log.new_status}
                        </p>
                        {log.note ? <p className="mt-1 text-sm leading-6 text-slate-600">{log.note}</p> : null}
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(log.created_at)}{log.changed_by?.name ? ` · ${log.changed_by.name}` : ''}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
