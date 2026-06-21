import { useRef, type FormEvent } from 'react';

import { MessageAttachmentPreview } from './MessageAttachmentPreview';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface MessageComposerProps {
    message: string;
    files: File[];
    error?: string;
    isSending: boolean;
    disabled?: boolean;
    onMessageChange: (message: string) => void;
    onFilesChange: (files: File[]) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function MessageComposer({ message, files, error, isSending, disabled, onMessageChange, onFilesChange, onSubmit }: MessageComposerProps) {
    const fileInput = useRef<HTMLInputElement>(null);

    function addFiles(selected: FileList | null): void {
        if (!selected) return;
        onFilesChange([...files, ...Array.from(selected)].slice(0, 5));
        if (fileInput.current) fileInput.current.value = '';
    }

    return (
        <form className="border-t border-slate-200 bg-white p-4" onSubmit={onSubmit}>
            {files.length > 0 ? <div className="mb-3 grid gap-2 sm:grid-cols-2">{files.map((file, index) => <MessageAttachmentPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))} />)}</div> : null}
            <div className="flex items-end gap-2">
                <input ref={fileInput} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" disabled={disabled || isSending} onChange={(event) => addFiles(event.target.files)} />
                <Button type="button" variant="outline" size="icon" aria-label="Adicionar anexos" disabled={disabled || isSending} onClick={() => fileInput.current?.click()}>
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m20 11-8 8a6 6 0 0 1-8-8l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l8-8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Button>
                <div className="min-w-0 flex-1"><Textarea className="min-h-11 resize-none py-2.5" name="message" rows={1} value={message} error={error} disabled={disabled || isSending} placeholder={disabled ? 'Esta conversa está arquivada.' : 'Escreva uma mensagem...'} onChange={(event) => onMessageChange(event.target.value)} /></div>
                <Button type="submit" isLoading={isSending} disabled={disabled || message.trim() === ''}>Enviar</Button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Anexos JPG, PNG, WebP ou PDF até 20 MB cada.</p>
        </form>
    );
}
