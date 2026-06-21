import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { DisputeDetailPanel } from '../../Components/Disputes/DisputeDetailPanel';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { CasesLayout } from '../../Layouts/CasesLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import type { Dispute, DisputeEvidence, DisputeMessage } from '../../types';

interface DisputeDetailResponse {
    dispute: Dispute;
}

export default function DisputeShow({ disputeId }: { disputeId: number }) {
    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const loadDispute = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<DisputeDetailResponse>(`/disputes/${disputeId}`, { signal });
            setDispute(data.dispute);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar a disputa.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [disputeId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadDispute(controller.signal);
        return () => controller.abort();
    }, [loadDispute, reloadKey]);

    async function uploadEvidence(file: File, description: string): Promise<void> {
        setIsUploadingEvidence(true);
        setFeedback(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (description) {
                formData.append('description', description);
            }

            await api.post(`/disputes/${disputeId}/evidence`, formData);
            setFeedback({ type: 'success', message: 'Prova enviada com sucesso.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível enviar a prova.' });
        } finally {
            setIsUploadingEvidence(false);
        }
    }

    async function sendMessage(message: string): Promise<void> {
        setIsSendingMessage(true);
        setFeedback(null);

        try {
            await api.post(`/disputes/${disputeId}/messages`, { message });
            setFeedback({ type: 'success', message: 'Mensagem enviada com sucesso.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível enviar a mensagem.' });
        } finally {
            setIsSendingMessage(false);
        }
    }

    function refresh(): void {
        setFeedback(null);
        setReloadKey((value) => value + 1);
    }

    return (
        <CasesLayout title="Detalhes da disputa" description="Acompanhe o estado da disputa, mensagens e provas anexadas.">
            <Head title={dispute?.contract?.service_request?.title ?? 'Detalhes da disputa'} />

            {isLoading && !dispute ? <DisputeDetailSkeleton /> : null}

            {!isLoading && error ? (
                <EmptyState
                    title="Não foi possível carregar a disputa"
                    description={error}
                    action={<Button onClick={refresh}>Tentar novamente</Button>}
                />
            ) : null}

            {!error && dispute ? (
                <div className="grid gap-6">
                    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-brand-100">Disputa #{dispute.id}</p>
                                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{dispute.contract?.service_request?.title ?? `Contrato #${dispute.contract_id}`}</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Histórico da disputa, participantes e actividades de acompanhamento.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white bg-white text-brand-700 hover:bg-brand-50" onClick={() => router.visit('/disputes')}>Voltar às disputas</Button>
                                <Button variant="secondary" onClick={refresh} isLoading={isLoading}>Actualizar</Button>
                            </div>
                        </div>
                    </section>

                    {feedback ? <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div> : null}

                    <DisputeDetailPanel
                        dispute={dispute}
                        evidence={(dispute.evidence ?? []) as DisputeEvidence[]}
                        messages={(dispute.messages ?? []) as DisputeMessage[]}
                        isUploadingEvidence={isUploadingEvidence}
                        isSendingMessage={isSendingMessage}
                        onUploadEvidence={uploadEvidence}
                        onSendMessage={sendMessage}
                    />
                </div>
            ) : null}
        </CasesLayout>
    );
}

function DisputeDetailSkeleton() {
    return (
        <div className="grid gap-6" aria-label="A carregar disputa" aria-busy="true">
            <div className="grid min-h-52 gap-4 rounded-3xl bg-brand-100 p-8">
                <LoadingSkeleton className="h-6 w-36 bg-brand-200" />
                <LoadingSkeleton className="h-9 w-full max-w-xl bg-brand-200" />
                <LoadingSkeleton className="h-5 w-64 bg-brand-200" />
            </div>
            <LoadingSkeleton className="h-[36rem] rounded-2xl" />
        </div>
    );
}
