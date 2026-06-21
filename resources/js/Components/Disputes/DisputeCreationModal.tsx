import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { api, ApiError } from '../../lib/api';
import type { Dispute } from '../../types';

interface DisputeCreationModalProps {
    open: boolean;
    isLoading?: boolean;
    defaultContractId?: string | number;
    onCreated: (dispute: Dispute) => void;
    onClose: () => void;
}

export function DisputeCreationModal({
    open,
    isLoading = false,
    defaultContractId = '',
    onCreated,
    onClose,
}: DisputeCreationModalProps) {
    const [contractId, setContractId] = useState(String(defaultContractId));
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (!open) return;

        setContractId(String(defaultContractId ?? ''));
        setReason('');
        setDescription('');
        setErrors({});
    }, [defaultContractId, open]);

    useEffect(() => {
        if (!open) return;

        function closeOnEscape(event: KeyboardEvent): void {
            if (event.key === 'Escape' && !submitting && !isLoading) {
                onClose();
            }
        }

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isLoading, onClose, open, submitting]);

    function fieldError(field: string): string | undefined {
        return errors[field]?.[0];
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setErrors({});

        if (!contractId.trim()) {
            setErrors({ contract_id: ['Informe o identificador do contrato.'] });
            return;
        }

        const id = Number(contractId);
        if (!Number.isInteger(id) || id <= 0) {
            setErrors({ contract_id: ['O identificador deve ser um número válido.'] });
            return;
        }

        if (!reason.trim()) {
            setErrors({ reason: ['Explique o motivo da disputa.'] });
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post<{ dispute: Dispute }>('/disputes', {
                contract_id: id,
                reason: reason.trim(),
                description: description.trim() || null,
            });
            onCreated(response.dispute);
            onClose();
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setErrors(caughtError.errors);
            } else {
                setErrors({ general: ['Não foi possível abrir a disputa.'] });
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting && !isLoading) onClose(); }}>
            <form className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated" role="dialog" aria-modal="true" aria-labelledby="dispute-modal-title" onSubmit={submit}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Disputa</p>
                <h2 id="dispute-modal-title" className="mt-1 text-xl font-bold text-slate-950">Abrir disputa</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Explique o problema e associe a disputa ao contrato correcto.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input
                        label="ID do contrato"
                        value={contractId}
                        error={fieldError('contract_id')}
                        placeholder="Ex.: 27"
                        disabled={submitting || isLoading || Boolean(defaultContractId)}
                        onChange={(event) => setContractId(event.target.value)}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                        <p className="font-semibold text-slate-700">Antes de enviar</p>
                        <p className="mt-1">A disputa só pode ser aberta por participantes do contrato activo ou concluído.</p>
                    </div>
                </div>

                <Textarea
                    className="mt-4"
                    label="Motivo"
                    value={reason}
                    error={fieldError('reason')}
                    rows={4}
                    placeholder="Descreva o motivo da disputa."
                    disabled={submitting || isLoading}
                    onChange={(event) => setReason(event.target.value)}
                />

                <Textarea
                    className="mt-4"
                    label="Descrição adicional"
                    value={description}
                    error={fieldError('description')}
                    rows={5}
                    placeholder="Inclua contexto, datas e qualquer detalhe relevante."
                    disabled={submitting || isLoading}
                    onChange={(event) => setDescription(event.target.value)}
                />

                {errors.general ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.general[0]}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting || isLoading}>Voltar</Button>
                    <Button type="submit" isLoading={submitting || isLoading}>Abrir disputa</Button>
                </div>
            </form>
        </div>
    );
}
