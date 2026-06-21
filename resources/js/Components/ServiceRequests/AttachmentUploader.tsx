import { formatFileSize } from '../../lib/formatters';

interface AttachmentUploaderProps {
    files: File[];
    error?: string;
    disabled?: boolean;
    onChange: (files: File[]) => void;
}

export function AttachmentUploader({ files, error, disabled, onChange }: AttachmentUploaderProps) {
    function selectFiles(selectedFiles: FileList | null): void {
        if (!selectedFiles) return;
        onChange(Array.from(selectedFiles).slice(0, 10));
    }

    return (
        <section className="grid gap-4" aria-labelledby="attachments-title">
            <div><h2 id="attachments-title" className="text-lg font-semibold text-slate-950">Anexos</h2><p className="mt-1 text-sm text-slate-500">Até 10 ficheiros JPG, PNG, WebP ou PDF, com máximo de 20 MB cada.</p></div>
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/50">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span className="text-sm font-semibold text-slate-800">Seleccione ficheiros para anexar</span>
                <span className="text-xs text-slate-500">Pode escolher vários ficheiros de uma vez.</span>
                <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" disabled={disabled} onChange={(event) => selectFiles(event.target.files)} />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {files.length > 0 ? (
                <ul className="grid gap-2">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                            <div className="min-w-0"><p className="truncate font-medium text-slate-800">{file.name}</p><p className="mt-0.5 text-xs text-slate-500">{formatFileSize(file.size)}</p></div>
                            <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" disabled={disabled} onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}>Remover</button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
