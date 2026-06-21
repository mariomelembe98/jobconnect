import { formatFileSize } from '../../lib/formatters';
import type { ServiceRequestAttachment } from '../../types';

export function ServiceRequestAttachments({ attachments }: { attachments: ServiceRequestAttachment[] }) {
    if (attachments.length === 0) {
        return <p className="mt-3 text-sm leading-6 text-slate-500">Este pedido não possui anexos.</p>;
    }

    return (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v5h5" strokeLinejoin="round" /></svg>
                    </span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{attachment.file_name}</p><p className="mt-0.5 text-xs text-slate-500">{formatFileSize(attachment.file_size)}</p></div>
                    {attachment.file_url ? <a href={attachment.file_url} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">Abrir</a> : null}
                </li>
            ))}
        </ul>
    );
}
