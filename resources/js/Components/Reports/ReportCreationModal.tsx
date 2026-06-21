import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { api, ApiError } from '../../lib/api';
import { REPORT_REASON_LABELS } from '../../lib/constants';
import type { Report } from '../../types';

type ReportTargetKind = 'user' | 'professional' | 'service_request' | 'contract';

interface ReportCreationModalProps {
    open: boolean;
    isLoading?: boolean;
    defaultTargetKind?: ReportTargetKind;
    defaultTargetId?: string | number;
    lockTargetKind?: boolean;
    onCreated: (report: Report) => void;
    onClose: () => void;
}

const targetKindOptions = [
    { label: 'Utilizador', value: 'user' },
    { label: 'Profissional', value: 'professional' },
    { label: 'Pedido de serviço', value: 'service_request' },
    { label: 'Contrato', value: 'contract' },
] satisfies Array<{ label: string; value: ReportTargetKind }>;

const reasonOptions = Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({ label, value }));

export function ReportCreationModal({
    open,
    isLoading = false,
    defaultTargetKind = 'user',
    defaultTargetId = '',
    lockTargetKind = false,
    onCreated,
    onClose,
}: ReportCreationModalProps) {
    const [targetKind, setTargetKind] = useState<ReportTargetKind>(defaultTargetKind);
    const [targetId, setTargetId] = useState(String(defaultTargetId));
    const [reason, setReason] = useState(reasonOptions[0]?.value ?? 'other');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const title = useMemo(() => {
        switch (targetKind) {
            case 'professional':
                return 'Denunciar profissional';
            case 'service_request':
                return 'Denunciar pedido de serviço';
            case 'contract':
                return 'Denunciar contrato';
            default:
                return 'Denunciar utilizador';
        }
    }, [targetKind]);

    useEffect(() => {
        if (!open) return;

        setTargetKind(defaultTargetKind);
        setTargetId(String(defaultTargetId ?? ''));
        setReason(reasonOptions[0]?.value ?? 'other');
        setDescription('');
        setErrors({});
    }, [defaultTargetKind, defaultTargetId, open]);

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

    function targetFieldError(): string | undefined {
        return errors.target_id?.[0] ?? errors.reported_user_id?.[0] ?? errors.service_request_id?.[0] ?? errors.contract_id?.[0] ?? errors.report_type?.[0];
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setErrors({});

        if (!targetId.trim()) {
            setErrors({ target_id: ['Informe o identificador do alvo da denúncia.'] });
            return;
        }

        const id = Number(targetId);
        if (!Number.isInteger(id) || id <= 0) {
            setErrors({ target_id: ['O identificador deve ser um número válido.'] });
            return;
        }

        setSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                report_type: targetKind === 'service_request' ? 'service_request' : targetKind === 'contract' ? 'contract' : 'user',
                reason,
                description: description.trim() || null,
            };

            if (targetKind === 'service_request') {
                payload.service_request_id = id;
            } else if (targetKind === 'contract') {
                payload.contract_id = id;
            } else {
                payload.reported_user_id = id;
            }

            const response = await api.post<{ report: Report }>('/reports', payload);
            onCreated(response.report);
            onClose();
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setErrors(caughtError.errors);
            } else {
                setErrors({ general: ['Não foi possível enviar a denúncia.'] });
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
            <form className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated" role="dialog" aria-modal="true" aria-labelledby="report-modal-title" onSubmit={submit}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Denúncia</p>
                <h2 id="report-modal-title" className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Partilhe os detalhes que sustentam a denúncia. A análise será feita pela equipa responsável.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Select
                        label="Tipo de denúncia"
                        options={targetKindOptions}
                        value={targetKind}
                        disabled={lockTargetKind || submitting || isLoading}
                        onChange={(event) => setTargetKind(event.target.value as ReportTargetKind)}
                    />

                    <Input
                        label={targetKind === 'professional' ? 'ID do utilizador do profissional' : targetKind === 'service_request' ? 'ID do pedido' : targetKind === 'contract' ? 'ID do contrato' : 'ID do utilizador'}
                        value={targetId}
                        error={targetFieldError()}
                        placeholder="Ex.: 42"
                        disabled={submitting || isLoading}
                        onChange={(event) => setTargetId(event.target.value)}
                    />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Select
                        label="Motivo"
                        options={reasonOptions}
                        value={reason}
                        error={fieldError('reason')}
                        disabled={submitting || isLoading}
                        onChange={(event) => setReason(event.target.value)}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                        <p className="font-semibold text-slate-700">Dica</p>
                        <p className="mt-1">Use o identificador visível na página do utilizador, do profissional, do pedido ou do contrato que pretende denunciar. Para profissionais, use o ID do utilizador associado ao perfil.</p>
                    </div>
                </div>

                <Textarea
                    className="mt-4"
                    label="Descrição"
                    value={description}
                    error={fieldError('description')}
                    rows={5}
                    placeholder="Explique o que aconteceu e inclua o máximo de contexto possível."
                    disabled={submitting || isLoading}
                    onChange={(event) => setDescription(event.target.value)}
                />

                {errors.general ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.general[0]}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting || isLoading}>Voltar</Button>
                    <Button type="submit" isLoading={submitting || isLoading}>Enviar denúncia</Button>
                </div>
            </form>
        </div>
    );
}
