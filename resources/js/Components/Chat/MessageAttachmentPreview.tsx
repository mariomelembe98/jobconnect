import { formatFileSize } from '../../lib/formatters';
import type { MessageAttachment } from '../../types';

interface MessageAttachmentPreviewProps {
    attachment?: MessageAttachment;
    file?: File;
    onRemove?: () => void;
}

export function MessageAttachmentPreview({ attachment, file, onRemove }: MessageAttachmentPreviewProps) {
    const name = attachment?.file_name ?? file?.name ?? 'Ficheiro';
    const size = attachment?.file_size ?? file?.size ?? null;
    const content = (
        <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v5h5M10 13h5M10 17h5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{name}</span><span className="mt-0.5 block text-xs text-slate-500">{formatFileSize(size)}</span></span>
        </>
    );

    if (attachment?.file_url) {
        return <a href={attachment.file_url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-brand-200 hover:bg-brand-50">{content}</a>;
    }

    return <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">{content}{onRemove ? <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={onRemove}>Remover</button> : null}</div>;
}
