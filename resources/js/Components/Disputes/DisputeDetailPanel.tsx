import { useState } from 'react';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { DISPUTE_RESOLUTION_LABELS, STATUS_LABELS } from '../../lib/constants';
import { formatDateTime, formatFileSize } from '../../lib/formatters';
import type { Dispute, DisputeEvidence, DisputeMessage } from '../../types';

const statusVariant: Record<Dispute['status'], 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'> = {
    pending: 'amber',
    under_review: 'blue',
    resolved: 'green',
    dismissed: 'gray',
};

interface DisputeDetailPanelProps {
    dispute: Dispute | null;
    evidence: DisputeEvidence[];
    messages: DisputeMessage[];
    isUploadingEvidence: boolean;
    isSendingMessage: boolean;
    onUploadEvidence: (file: File, description: string) => Promise<void>;
    onSendMessage: (message: string) => Promise<void>;
}

export function DisputeDetailPanel({
    dispute,
    evidence,
    messages,
    isUploadingEvidence,
    isSendingMessage,
    onUploadEvidence,
    onSendMessage,
}: DisputeDetailPanelProps) {
    const [message, setMessage] = useState('');
    const [evidenceDescription, setEvidenceDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    async function submitMessage(): Promise<void> {
        if (!message.trim()) {
            setLocalError('Escreva uma mensagem antes de enviar.');
            return;
        }

        setLocalError(null);
        await onSendMessage(message.trim());
        setMessage('');
    }

    async function submitEvidence(): Promise<void> {
        if (!selectedFile) {
            setLocalError('Selecione um ficheiro para enviar como prova.');
            return;
        }

        setLocalError(null);
        await onUploadEvidence(selectedFile, evidenceDescription.trim());
        setSelectedFile(null);
        setEvidenceDescription('');
    }

    return (
        <Card>
            <CardContent className="grid gap-6">
                {dispute ? (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Disputa #{dispute.id}</p>
                                <h3 className="mt-1 text-xl font-bold text-slate-950">{dispute.contract?.service_request?.title ?? `Contrato #${dispute.contract_id}`}</h3>
                                <p className="mt-1 text-sm text-slate-500">{formatDateTime(dispute.created_at ?? new Date())}</p>
                            </div>
                            <Badge variant={statusVariant[dispute.status]}>{STATUS_LABELS[dispute.status]}</Badge>
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                            <Info label="Contrato" value={`#${dispute.contract_id}`} />
                            <Info label="Aberta por" value={dispute.opener?.name ?? `Utilizador #${dispute.opened_by}`} />
                            <Info label="Atribuída a" value={dispute.assignee?.name ?? 'Sem atribuição'} />
                            <Info label="Resolução" value={dispute.resolution ? DISPUTE_RESOLUTION_LABELS[dispute.resolution] ?? dispute.resolution : '—'} />
                        </div>

                        {dispute.description ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{dispute.description}</p> : <EmptyState title="Sem descrição" description="Esta disputa não inclui descrição adicional." />}

                        {dispute.resolution_note ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{dispute.resolution_note}</p> : null}

                        <section className="grid gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold text-slate-950">Provas</h4>
                                <Badge variant="gray">{evidence.length}</Badge>
                            </div>
                            {evidence.length > 0 ? (
                                <div className="grid gap-3">
                                    {evidence.map((item) => (
                                        <article key={item.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h5 className="font-semibold text-slate-950">{item.file_name}</h5>
                                                    <p className="mt-1 text-xs text-slate-500">{item.uploader?.name ?? 'Sem autor'}</p>
                                                </div>
                                                {item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">Abrir</a> : null}
                                            </div>
                                            <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                                                <span>{item.file_type ?? '—'}</span>
                                                <span>{formatFileSize(item.file_size)}</span>
                                                <span>{formatDateTime(item.created_at)}</span>
                                            </div>
                                            {item.description ? <p className="text-sm leading-6 text-slate-600">{item.description}</p> : null}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="Sem provas" description="Nenhum ficheiro foi anexado ainda." />
                            )}
                        </section>

                        <section className="grid gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold text-slate-950">Mensagens</h4>
                                <Badge variant="gray">{messages.length}</Badge>
                            </div>
                            {messages.length > 0 ? (
                                <div className="grid gap-3">
                                    {messages.map((item) => (
                                        <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h5 className="font-semibold text-slate-950">{item.sender?.name ?? 'Utilizador'}</h5>
                                                <span className="text-xs text-slate-500">{formatDateTime(item.created_at)}</span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="Sem mensagens" description="Ainda não existem mensagens nesta disputa." />
                            )}
                        </section>

                        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="font-semibold text-slate-950">Enviar mensagem</h4>
                                <p className="mt-1 text-sm text-slate-500">Use este espaço para continuar a conversa sobre a disputa.</p>
                            </div>
                            <textarea
                                className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                                value={message}
                                placeholder="Escreva a sua mensagem..."
                                onChange={(event) => setMessage(event.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={() => void submitMessage()} isLoading={isSendingMessage}>Enviar mensagem</Button>
                            </div>
                        </section>

                        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="font-semibold text-slate-950">Adicionar prova</h4>
                                <p className="mt-1 text-sm text-slate-500">Envie capturas, PDFs ou ficheiros relacionados com a disputa.</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    <span>Ficheiro</span>
                                    <input
                                        type="file"
                                        className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                                        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    <span>Descrição da prova</span>
                                    <textarea
                                        className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                                        value={evidenceDescription}
                                        placeholder="Explique o que o ficheiro demonstra."
                                        onChange={(event) => setEvidenceDescription(event.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => void submitEvidence()} isLoading={isUploadingEvidence}>Enviar prova</Button>
                            </div>
                        </section>

                        {localError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{localError}</p> : null}
                    </>
                ) : (
                    <div className="grid gap-4">
                        <LoadingSkeleton className="h-6 w-40" />
                        <LoadingSkeleton className="h-10 w-full" />
                        <LoadingSkeleton className="h-48 w-full" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
    );
}
