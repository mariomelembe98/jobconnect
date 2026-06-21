import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { ConfirmActionModal } from '../../../Components/ServiceRequests/ConfirmActionModal';
import { ProposalReceivedCard } from '../../../Components/ServiceRequests/ProposalReceivedCard';
import { ServiceRequestAttachments } from '../../../Components/ServiceRequests/ServiceRequestAttachments';
import { ServiceRequestDetailHeader } from '../../../Components/ServiceRequests/ServiceRequestDetailHeader';
import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { Button } from '../../../Components/ui/Button';
import { Card, CardContent } from '../../../Components/ui/Card';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ClientLayout } from '../../../Layouts/ClientLayout';
import { api, ApiError } from '../../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import type { PaginatedData, Pagination, Proposal, ServiceRequest } from '../../../types';

type ProposalsData = PaginatedData<'proposals', Proposal>;

type PendingAction =
    | { type: 'accept'; proposal: Proposal }
    | { type: 'reject'; proposal: Proposal }
    | { type: 'cancel' };

export default function ServiceRequestDetail({ serviceRequestId }: { serviceRequestId: number }) {
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ current_page: 1, per_page: 15, last_page: 1, total: 0 });
    const [proposalPage, setProposalPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const loadDetails = useCallback(async (signal: AbortSignal, page: number) => {
        if (!getAuthToken()) {
            router.visit('/login', { replace: true });
            return;
        }

        if (getStoredAuthUser()?.user_type !== 'client') {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [requestData, proposalsData] = await Promise.all([
                api.get<{ service_request: ServiceRequest }>(`/service-requests/${serviceRequestId}`, { signal }),
                api.get<ProposalsData>(`/service-requests/${serviceRequestId}/proposals`, { signal, query: { page } }),
            ]);
            setServiceRequest(requestData.service_request);
            setProposals(proposalsData.proposals);
            setPagination(proposalsData.pagination);
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o pedido de serviço.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [serviceRequestId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadDetails(controller.signal, proposalPage);
        return () => controller.abort();
    }, [loadDetails, proposalPage, reloadKey]);

    async function confirmAction(): Promise<void> {
        if (!pendingAction) return;

        setIsMutating(true);
        setActionError(null);
        setSuccessMessage(null);

        try {
            if (pendingAction.type === 'cancel') {
                await api.post(`/service-requests/${serviceRequestId}/cancel`, cancelReason ? { reason: cancelReason } : {});
                setSuccessMessage('Pedido cancelado com sucesso.');
                setCancelReason('');
            } else if (pendingAction.type === 'accept') {
                const result = await api.post<{ contract?: { id: number } }>(`/proposals/${pendingAction.proposal.id}/accept`);
                setSuccessMessage(result.contract?.id
                    ? `Proposta aceite e contrato #${result.contract.id} criado. A página de detalhes do contrato será disponibilizada em breve.`
                    : 'Proposta aceite com sucesso.');
            } else {
                await api.post(`/proposals/${pendingAction.proposal.id}/reject`);
                setSuccessMessage('Proposta rejeitada com sucesso.');
            }

            setPendingAction(null);
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setPendingAction(null);
            setActionError(apiErrorMessage(caughtError));
        } finally {
            setIsMutating(false);
        }
    }

    const canCancel = serviceRequest && !['completed', 'cancelled'].includes(serviceRequest.status);
    const modalContent = actionModalContent(pendingAction);

    return (
        <ClientLayout title="Detalhes do pedido" description="Acompanhe o pedido e analise as propostas recebidas.">
            <Head title={serviceRequest?.title ?? 'Detalhes do pedido'} />

            {isLoading && !serviceRequest ? <DetailSkeleton /> : null}

            {!isLoading && error ? <EmptyState title="Não foi possível carregar o pedido" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}

            {!error && serviceRequest ? (
                <div className="grid gap-6">
                    <ServiceRequestDetailHeader serviceRequest={serviceRequest} />

                    {successMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800" role="status">{successMessage}</div> : null}
                    {actionError ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">{actionError}</div> : null}

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                        <div className="grid gap-6">
                            <Card><CardContent><h2 className="text-xl font-bold text-slate-950">Descrição</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{serviceRequest.description}</p>{serviceRequest.address ? <p className="mt-4 text-sm text-slate-500"><strong className="text-slate-700">Endereço:</strong> {serviceRequest.address}</p> : null}</CardContent></Card>
                            <Card><CardContent><h2 className="text-xl font-bold text-slate-950">Anexos</h2><ServiceRequestAttachments attachments={serviceRequest.attachments ?? []} /></CardContent></Card>
                        </div>

                        <aside className="lg:sticky lg:top-24 lg:self-start">
                            <Card><CardContent className="grid gap-3"><div><h2 className="font-semibold text-slate-950">Gerir pedido</h2><p className="mt-1 text-sm leading-6 text-slate-500">Actualize ou cancele este pedido.</p></div><Button variant="outline" onClick={() => setSuccessMessage('A edição completa do pedido será implementada numa próxima etapa.')}>Editar pedido</Button>{canCancel ? <Button variant="danger" onClick={() => setPendingAction({ type: 'cancel' })}>Cancelar pedido</Button> : null}<Button variant="ghost" onClick={() => router.visit('/client')}>Voltar ao painel</Button></CardContent></Card>
                        </aside>
                    </div>

                    <section className="grid gap-4" aria-labelledby="proposals-title">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div><h2 id="proposals-title" className="text-xl font-bold text-slate-950">Propostas recebidas</h2><p className="mt-1 text-sm text-slate-500">{pagination.total} propostas para este pedido</p></div>
                            {isLoading ? <span className="text-sm text-brand-600">A actualizar...</span> : null}
                        </div>

                        {proposals.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{proposals.map((proposal) => <ProposalReceivedCard key={proposal.id} proposal={proposal} disabled={isMutating} onAccept={(selected) => setPendingAction({ type: 'accept', proposal: selected })} onReject={(selected) => setPendingAction({ type: 'reject', proposal: selected })} />)}</div>
                        ) : <EmptyState title="Ainda não recebeu propostas" description="As propostas enviadas por profissionais aparecerão aqui." />}

                        {pagination.last_page > 1 ? <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => setProposalPage((page) => page - 1)}>Anterior</Button><span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => setProposalPage((page) => page + 1)}>Seguinte</Button></div> : null}
                    </section>
                </div>
            ) : null}

            <ConfirmActionModal
                open={pendingAction !== null}
                title={modalContent.title}
                description={modalContent.description}
                confirmLabel={modalContent.confirmLabel}
                destructive={pendingAction?.type === 'cancel' || pendingAction?.type === 'reject'}
                isLoading={isMutating}
                reason={cancelReason}
                reasonLabel="Motivo do cancelamento"
                onReasonChange={pendingAction?.type === 'cancel' ? setCancelReason : undefined}
                onConfirm={confirmAction}
                onClose={() => { if (!isMutating) setPendingAction(null); }}
            />
        </ClientLayout>
    );
}

function actionModalContent(action: PendingAction | null): { title: string; description: string; confirmLabel: string } {
    if (action?.type === 'accept') {
        return { title: 'Aceitar proposta?', description: 'Esta acção cria um contrato e rejeita automaticamente as outras propostas pendentes.', confirmLabel: 'Aceitar proposta' };
    }

    if (action?.type === 'reject') {
        return { title: 'Rejeitar proposta?', description: 'O profissional será informado de que a proposta não foi seleccionada.', confirmLabel: 'Rejeitar proposta' };
    }

    return { title: 'Cancelar pedido?', description: 'O pedido deixará de receber propostas. Esta acção não pode ser anulada.', confirmLabel: 'Cancelar pedido' };
}

function apiErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return 'Não foi possível concluir a operação. Tente novamente.';
    const validationMessage = Object.values(error.errors).flat()[0];
    return validationMessage ?? error.message;
}

function DetailSkeleton() {
    return <div className="grid gap-6" aria-label="A carregar pedido" aria-busy="true"><div className="grid min-h-52 gap-4 rounded-3xl bg-brand-100 p-8"><LoadingSkeleton className="h-6 w-32 bg-brand-200" /><LoadingSkeleton className="h-9 w-full max-w-xl bg-brand-200" /><LoadingSkeleton className="h-5 w-64 bg-brand-200" /></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="grid gap-6"><LoadingSkeleton className="h-60 rounded-2xl" /><LoadingSkeleton className="h-44 rounded-2xl" /></div><LoadingSkeleton className="h-64 rounded-2xl" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <LoadingSkeleton key={index} className="h-64 rounded-2xl" />)}</div></div>;
}
