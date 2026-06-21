import { useEffect } from 'react';

import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface ConfirmActionModalProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isLoading?: boolean;
    destructive?: boolean;
    reason?: string;
    reasonLabel?: string;
    onReasonChange?: (reason: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmActionModal(props: ConfirmActionModalProps) {
    const { open, title, description, confirmLabel, isLoading, destructive, reason, reasonLabel, onReasonChange, onConfirm, onClose } = props;

    useEffect(() => {
        if (!open) return;

        function closeOnEscape(event: KeyboardEvent): void {
            if (event.key === 'Escape' && !isLoading) onClose();
        }

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isLoading, onClose, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isLoading) onClose(); }}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title">
                <h2 id="confirm-action-title" className="text-xl font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                {onReasonChange ? <Textarea className="mt-5" label={reasonLabel ?? 'Motivo'} value={reason ?? ''} placeholder="Escreva uma justificação opcional..." rows={4} onChange={(event) => onReasonChange(event.target.value)} /> : null}
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Voltar</Button>
                    <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
}
