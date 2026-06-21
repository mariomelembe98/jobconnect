import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { CancelContractModal } from '../../Components/Contracts/CancelContractModal';
import { CompleteContractModal } from '../../Components/Contracts/CompleteContractModal';
import { ContractDetailHeader } from '../../Components/Contracts/ContractDetailHeader';
import { ContractTimeline } from '../../Components/Contracts/ContractTimeline';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { ReviewFormModal } from '../../Components/Reviews/ReviewFormModal';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent } from '../../Components/ui/Card';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ContractsLayout } from '../../Layouts/ContractsLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import type { Contract, ContractStatusLog } from '../../types';

export default function ContractShow({ contractId }: { contractId: number }) {
    const currentUser = getStoredAuthUser();
    const [contract, setContract] = useState<Contract | null>(null);
    const [logs, setLogs] = useState<ContractStatusLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [modal, setModal] = useState<'complete' | 'cancel' | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewError, setReviewError] = useState<string | undefined>();
    const [reloadKey, setReloadKey] = useState(0);

    const loadContract = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const [contractData, logData] = await Promise.all([
                api.get<{ contract: Contract }>(`/contracts/${contractId}`, { signal }),
                api.get<{ logs: ContractStatusLog[] }>(`/contracts/${contractId}/logs`, { signal }),
            ]);

            setContract(contractData.contract);
            setLogs(logData.logs);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar este contrato.');
            }
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [contractId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadContract(controller.signal);
        return () => controller.abort();
    }, [loadContract, reloadKey]);

    async function completeContract(): Promise<void> {
        setIsSubmitting(true);
        setFeedback(null);

        try {
            await api.post(`/contracts/${contractId}/complete`);
            setModal(null);
            setFeedback({ type: 'success', message: 'Contrato concluído com sucesso.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível concluir o contrato.' });
            setModal(null);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function cancelContract(): Promise<void> {
        setIsSubmitting(true);
        setFeedback(null);

        try {
            await api.post(`/contracts/${contractId}/cancel`, { reason: cancelReason || null });
            setModal(null);
            setCancelReason('');
            setFeedback({ type: 'success', message: 'Contrato cancelado com sucesso.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível cancelar o contrato.' });
            setModal(null);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function submitReview(rating: number, comment: string): Promise<void> {
        setIsReviewing(true);
        setReviewError(undefined);
        setFeedback(null);

        try {
            await api.post('/reviews', {
                contract_id: contractId,
                rating,
                comment: comment || null,
            });
            setReviewOpen(false);
            setFeedback({ type: 'success', message: 'Avaliação enviada com sucesso.' });
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setReviewError(caughtError.errors.rating?.[0] ?? caughtError.errors.comment?.[0] ?? caughtError.message);
            } else {
                setReviewError('Não foi possível enviar a avaliação.');
            }
        } finally {
            setIsReviewing(false);
        }
    }

    function showPlaceholder(message: string): void {
        setFeedback({ type: 'success', message });
    }

    const canComplete = currentUser?.user_type === 'client' && contract?.status === 'active';
    const canCancel = (currentUser?.user_type === 'client' || currentUser?.user_type === 'professional') && contract?.status === 'active';
    const canReview = (currentUser?.user_type === 'client' || currentUser?.user_type === 'professional') && contract?.status === 'completed';
    const reviewSubjectName = currentUser?.user_type === 'client'
        ? contract?.professional_profile?.user?.name ?? 'o profissional'
        : contract?.client?.name ?? 'o cliente';

    return (
        <ContractsLayout title="Detalhes do contrato" description="Consulte o acordo e acompanhe todas as alterações.">
            <Head title={contract?.service_request?.title ?? 'Detalhes do contrato'} />

            {isLoading && !contract ? <ContractDetailSkeleton /> : null}

            {!isLoading && error ? (
                <EmptyState
                    title="Não foi possível carregar o contrato"
                    description={error}
                    icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                    action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                />
            ) : null}

            {!error && contract ? (
                <div className="grid gap-6">
                    <ContractDetailHeader contract={contract} />

                    {feedback ? (
                        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
                            {feedback.message}
                        </div>
                    ) : null}

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="grid gap-6">
                            <Card>
                                <CardContent>
                                    <h2 className="text-xl font-bold text-slate-950">Resumo do serviço</h2>
                                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                                        <Detail label="Pedido" value={contract.service_request?.title ?? 'Serviço contratado'} />
                                        <Detail label="Categoria" value={contract.service_request?.category?.name ?? 'Não indicada'} />
                                        <Detail label="Cliente" value={contract.client?.name ?? 'Informação indisponível'} />
                                        <Detail label="Profissional" value={contract.professional_profile?.user?.name ?? contract.professional_profile?.headline ?? 'Informação indisponível'} />
                                        <Detail label="Valor do contrato" value={formatCurrency(contract.amount)} />
                                        <Detail label="Taxa da plataforma" value={formatCurrency(contract.platform_fee ?? 0)} />
                                        <Detail label="Valor do profissional" value={formatCurrency(contract.professional_amount ?? contract.amount)} />
                                    </dl>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <h2 className="text-xl font-bold text-slate-950">Datas do contrato</h2>
                                    <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        <Detail label="Iniciado" value={formatOptionalDate(contract.started_at)} />
                                        <Detail label="Concluído" value={formatOptionalDate(contract.completed_at)} />
                                        <Detail label="Cancelado" value={formatOptionalDate(contract.cancelled_at)} />
                                    </dl>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent>
                                    <h2 className="text-xl font-bold text-slate-950">Histórico</h2>
                                    <p className="mt-1 text-sm text-slate-500">Alterações registadas durante o ciclo do contrato.</p>
                                    <div className="mt-6"><ContractTimeline logs={logs} /></div>
                                </CardContent>
                            </Card>
                        </div>

                        <aside className="grid content-start gap-4 xl:sticky xl:top-24 xl:self-start">
                            <Card>
                                <CardContent>
                                    <h2 className="font-bold text-slate-950">Ações</h2>
                                    <div className="mt-4 grid gap-3">
                                        {canComplete ? <Button onClick={() => setModal('complete')}>Concluir contrato</Button> : null}
                                        {canCancel ? <Button variant="danger" onClick={() => setModal('cancel')}>Cancelar contrato</Button> : null}
                                        <Button variant="outline" onClick={() => showPlaceholder('A conversa do contrato será aberta quando o módulo de mensagens estiver disponível.')}>Abrir conversa</Button>
                                        {canReview ? <Button variant="secondary" onClick={() => { setReviewError(undefined); setReviewOpen(true); }}>Avaliar serviço</Button> : null}
                                        {contract.status === 'completed' ? <Button variant="ghost" onClick={() => router.visit('/reviews/me')}>Ver minhas avaliações</Button> : null}
                                    </div>
                                </CardContent>
                            </Card>
                            <Button variant="ghost" onClick={() => router.visit('/contracts')}>Voltar aos contratos</Button>
                        </aside>
                    </div>
                </div>
            ) : null}

            <CompleteContractModal open={modal === 'complete'} isLoading={isSubmitting} onConfirm={completeContract} onClose={() => setModal(null)} />
            <CancelContractModal open={modal === 'cancel'} reason={cancelReason} isLoading={isSubmitting} onReasonChange={setCancelReason} onConfirm={cancelContract} onClose={() => setModal(null)} />
            <ReviewFormModal open={reviewOpen} subjectName={reviewSubjectName} isLoading={isReviewing} error={reviewError} onSubmit={submitReview} onClose={() => setReviewOpen(false)} />
        </ContractsLayout>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>;
}

function formatOptionalDate(value?: string | null): string {
    return value ? formatDateTime(value) : '—';
}

function ContractDetailSkeleton() {
    return (
        <div className="grid gap-6" aria-label="A carregar contrato" aria-busy="true">
            <div className="grid min-h-52 gap-4 rounded-3xl bg-brand-100 p-8"><LoadingSkeleton className="h-6 w-32 bg-brand-200" /><LoadingSkeleton className="h-9 w-full max-w-xl bg-brand-200" /><LoadingSkeleton className="h-5 w-64 bg-brand-200" /></div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="grid gap-6"><LoadingSkeleton className="h-72 rounded-2xl" /><LoadingSkeleton className="h-52 rounded-2xl" /><LoadingSkeleton className="h-72 rounded-2xl" /></div><LoadingSkeleton className="h-64 rounded-2xl" /></div>
        </div>
    );
}
