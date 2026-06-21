import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { ProposalReceivedCard } from '../../../Components/ServiceRequests/ProposalReceivedCard';
import { ConfirmActionModal } from '../../../Components/ServiceRequests/ConfirmActionModal';
import { ServiceRequestAttachments } from '../../../Components/ServiceRequests/ServiceRequestAttachments';
import { ServiceRequestDetailHeader } from '../../../Components/ServiceRequests/ServiceRequestDetailHeader';
import { ServiceRequestForm, type ServiceRequestFormValues } from '../../../Components/ServiceRequests/ServiceRequestForm';
import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { Button } from '../../../Components/ui/Button';
import { Card, CardContent } from '../../../Components/ui/Card';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ClientLayout } from '../../../Layouts/ClientLayout';
import { api, ApiError } from '../../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import type { Category, PaginatedData, Pagination, Proposal, ServiceRequest, ServiceRequestAttachment } from '../../../types';

type ProposalsData = PaginatedData<'proposals', Proposal>;

type PendingAction =
    | { type: 'accept'; proposal: Proposal }
    | { type: 'reject'; proposal: Proposal }
    | { type: 'cancel' }
    | { type: 'delete-attachment'; attachment: ServiceRequestAttachment };

const initialFormValues: ServiceRequestFormValues = {
    title: '',
    category_id: '',
    description: '',
    service_type: 'local',
    budget_min: '',
    budget_max: '',
    budget_type: 'negotiable',
    province: '',
    city: '',
    address: '',
    deadline_at: '',
};

export default function ServiceRequestDetail({ serviceRequestId }: { serviceRequestId: number }) {
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ current_page: 1, per_page: 15, last_page: 1, total: 0 });
    const [proposalPage, setProposalPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [acceptedConversationId, setAcceptedConversationId] = useState<number | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [isLoadingLookups, setIsLoadingLookups] = useState(true);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [lookupReloadKey, setLookupReloadKey] = useState(0);
    const [cityFetchError, setCityFetchError] = useState<string | null>(null);
    const [values, setValues] = useState<ServiceRequestFormValues>(initialFormValues);
    const [files, setFiles] = useState<File[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o pedido de serviço.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [serviceRequestId]);

    const loadLookups = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) {
            return;
        }

        setIsLoadingLookups(true);
        setLookupError(null);

        try {
            const [categoriesData, provincesData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<{ provinces: string[] }>('/locations/provinces', { signal }),
            ]);

            setCategories(categoriesData.categories);
            setProvinces(provincesData.provinces);
        } catch (caughtError) {
            if (!signal.aborted) {
                setLookupError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os dados do formulário.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoadingLookups(false);
            }
        }
    }, []);

    const loadCities = useCallback(async (signal: AbortSignal, province: string) => {
        if (!province) {
            setCities([]);
            setCityFetchError(null);
            return;
        }

        setIsLoadingCities(true);
        setCityFetchError(null);

        try {
            const data = await api.get<{ cities: string[] }>('/locations/cities', {
                signal,
                query: { province },
            });

            setCities(data.cities);
        } catch (caughtError) {
            if (!signal.aborted) {
                setCityFetchError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as cidades.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoadingCities(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadDetails(controller.signal, proposalPage);

        return () => controller.abort();
    }, [loadDetails, proposalPage, reloadKey]);

    useEffect(() => {
        const controller = new AbortController();
        void loadLookups(controller.signal);

        return () => controller.abort();
    }, [loadLookups, lookupReloadKey]);

    useEffect(() => {
        if (serviceRequest) {
            setValues(serviceRequestToValues(serviceRequest));
        }
    }, [serviceRequest]);

    useEffect(() => {
        if (!isEditing) {
            return;
        }

        const controller = new AbortController();

        if (!values.province) {
            setCities([]);
            return () => controller.abort();
        }

        void loadCities(controller.signal, values.province);

        return () => controller.abort();
    }, [isEditing, loadCities, values.province]);

    async function confirmAction(): Promise<void> {
        if (!pendingAction) {
            return;
        }

        setIsMutating(true);
        setActionError(null);
        setSuccessMessage(null);
        setAcceptedConversationId(null);

        try {
            if (pendingAction.type === 'cancel') {
                await api.post(`/service-requests/${serviceRequestId}/cancel`, cancelReason ? { reason: cancelReason } : {});
                setCancelReason('');
                setSuccessMessage('Pedido cancelado com sucesso.');
            } else if (pendingAction.type === 'accept') {
                const result = await api.post<{ contract?: { id: number; conversation?: { id: number } | null }; conversation?: { id: number } }>(`/proposals/${pendingAction.proposal.id}/accept`);
                const conversationId = result.contract?.conversation?.id ?? result.conversation?.id ?? null;
                setAcceptedConversationId(conversationId);
                setSuccessMessage(result.contract?.id
                    ? `Proposta aceite e contrato #${result.contract.id} criado com sucesso.`
                    : 'Proposta aceite com sucesso.');
            } else if (pendingAction.type === 'reject') {
                await api.post(`/proposals/${pendingAction.proposal.id}/reject`);
                setSuccessMessage('Proposta rejeitada com sucesso.');
            } else {
                await api.delete(`/service-requests/${serviceRequestId}/attachments/${pendingAction.attachment.id}`);
                setSuccessMessage('Anexo eliminado com sucesso.');
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

    async function submitEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        if (!serviceRequest) {
            return;
        }

        setIsSaving(true);
        setActionError(null);
        setSuccessMessage(null);
        setFormErrors({});

        try {
            const response = await api.patch<{ service_request: ServiceRequest }>(`/service-requests/${serviceRequestId}`, {
                category_id: values.category_id ? Number(values.category_id) : null,
                title: values.title,
                description: values.description,
                service_type: values.service_type,
                budget_min: values.budget_min === '' ? null : Number(values.budget_min),
                budget_max: values.budget_max === '' ? null : Number(values.budget_max),
                budget_type: values.budget_type,
                province: values.province || null,
                city: values.city || null,
                address: values.address || null,
                deadline_at: values.deadline_at || null,
            });

            const updatedServiceRequest = response.service_request;
            setServiceRequest(updatedServiceRequest);
            setValues(serviceRequestToValues(updatedServiceRequest));

            if (files.length > 0) {
                setIsUploading(true);

                const formData = new FormData();
                files.forEach((file) => {
                    formData.append('files[]', file);
                });

                try {
                    await api.post(`/service-requests/${serviceRequestId}/attachments`, formData);
                } catch (uploadError) {
                    setActionError(uploadError instanceof ApiError ? `O pedido foi actualizado, mas não foi possível carregar os anexos: ${uploadError.message}` : 'O pedido foi actualizado, mas não foi possível carregar os anexos.');
                    setPendingAction(null);
                    return;
                }
            }

            setFiles([]);
            setIsEditing(false);
            setSuccessMessage('Pedido actualizado com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                const validationErrors = firstValidationMessages(caughtError.errors);
                setFormErrors(validationErrors);

                if (Object.keys(validationErrors).length === 0) {
                    setActionError(caughtError.message);
                }
            } else {
                setActionError('Não foi possível actualizar o pedido. Tente novamente.');
            }
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    }

    function startEditing(): void {
        if (!serviceRequest) {
            return;
        }

        setCityFetchError(null);
        setFormErrors({});
        setActionError(null);
        setSuccessMessage(null);
        setIsEditing(true);
        setValues(serviceRequestToValues(serviceRequest));
    }

    function cancelEditing(): void {
        if (!serviceRequest) {
            return;
        }

        setIsEditing(false);
        setFiles([]);
        setFormErrors({});
        setActionError(null);
        setSuccessMessage(null);
        setCityFetchError(null);
        setValues(serviceRequestToValues(serviceRequest));
    }

    function updateFiles(nextFiles: File[]): void {
        const invalidFile = nextFiles.find((file) => file.size > 20 * 1024 * 1024 || !/\.(jpe?g|png|webp|pdf)$/i.test(file.name));
        setFiles(nextFiles);
        setFormErrors((current) => {
            const next = { ...current };
            delete next.files;
            if (invalidFile) {
                next.files = `${invalidFile.name} não tem um formato válido ou excede 20 MB.`;
            }
            return next;
        });
    }

    function updateValues(nextValues: ServiceRequestFormValues): void {
        if (nextValues.province !== values.province) {
            nextValues = { ...nextValues, city: '' };
            setCities([]);
            setCityFetchError(null);
        }

        setValues(nextValues);
    }

    const canEditRequest = serviceRequest ? ['draft', 'published', 'receiving_proposals'].includes(serviceRequest.status) : false;
    const canManageAttachments = serviceRequest ? !['completed', 'cancelled'].includes(serviceRequest.status) : false;
    const canCancel = serviceRequest ? !['completed', 'cancelled'].includes(serviceRequest.status) : false;
    return (
        <ClientLayout title="Detalhes do pedido" description="Acompanhe o pedido e gere as propostas recebidas.">
            <Head title={serviceRequest?.title ?? 'Detalhes do pedido'} />

            {isLoading && !serviceRequest ? <DetailSkeleton /> : null}

            {!isLoading && error ? (
                <EmptyState
                    title="Não foi possível carregar o pedido"
                    description={error}
                    icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                    action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                />
            ) : null}

            {!error && serviceRequest ? (
                <div className="grid gap-6">
                    <ServiceRequestDetailHeader serviceRequest={serviceRequest} />

                    {successMessage ? <StatusNotice tone="success" message={successMessage} /> : null}
                    {acceptedConversationId ? (
                        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4">
                            <p className="text-sm font-medium text-brand-800">A conversa deste contrato já está disponível.</p>
                            <div className="mt-3">
                                <Link
                                    href={`/conversations/${acceptedConversationId}`}
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                                >
                                    Abrir chat
                                </Link>
                            </div>
                        </div>
                    ) : null}
                    {actionError ? <StatusNotice tone="danger" message={actionError} /> : null}
                    {cityFetchError && isEditing ? <StatusNotice tone="danger" message={cityFetchError} /> : null}
                    {lookupError && isEditing ? (
                        <EmptyState
                            title="Não foi possível preparar a edição"
                            description={lookupError}
                            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                            action={<Button onClick={() => setLookupReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                            className="min-h-48"
                        />
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                        <div className="grid gap-6">
                            {isEditing && isLoadingLookups ? (
                                <Card>
                                    <CardContent className="grid gap-4 p-5 sm:p-8" aria-busy="true" aria-label="A carregar formulário de edição">
                                        <LoadingSkeleton className="h-6 w-40" />
                                        <LoadingSkeleton className="h-4 w-72 max-w-full" />
                                        {Array.from({ length: 6 }, (_, index) => <LoadingSkeleton key={index} className="h-11 w-full rounded-xl" />)}
                                        <LoadingSkeleton className="h-36 w-full rounded-2xl" />
                                    </CardContent>
                                </Card>
                            ) : isEditing && !lookupError ? (
                                <Card>
                                    <CardContent className="p-5 sm:p-8">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold text-slate-950">Editar pedido</h2>
                                            <p className="mt-1 text-sm text-slate-500">Actualize os dados do pedido e carregue novos anexos, se necessário.</p>
                                        </div>
                                        <ServiceRequestForm
                                            values={values}
                                            files={files}
                                            categories={categories}
                                            provinces={provinces}
                                            cities={cities}
                                            errors={{ ...formErrors }}
                                            isSubmitting={isSaving}
                                            isUploading={isUploading}
                                            isLoadingCities={isLoadingCities}
                                            submitLabel="Guardar alterações"
                                            onChange={updateValues}
                                            onFilesChange={updateFiles}
                                            onSubmit={submitEdit}
                                            onCancel={cancelEditing}
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="p-5 sm:p-8">
                                        <h2 className="text-xl font-bold text-slate-950">Descrição</h2>
                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{serviceRequest.description}</p>
                                        {serviceRequest.address ? (
                                            <p className="mt-4 text-sm text-slate-500">
                                                <strong className="text-slate-700">Endereço:</strong> {serviceRequest.address}
                                            </p>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardContent className="p-5 sm:p-8">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-950">Anexos</h2>
                                            <p className="mt-1 text-sm text-slate-500">Os ficheiros associados a este pedido.</p>
                                        </div>
                                        {canEditRequest ? (
                                            <Button variant="outline" size="sm" onClick={isEditing ? cancelEditing : startEditing}>
                                                {isEditing ? 'Cancelar edição' : 'Editar pedido'}
                                            </Button>
                                        ) : null}
                                    </div>

                                    <div className="mt-4">
                                        <ServiceRequestAttachments
                                            attachments={serviceRequest.attachments ?? []}
                                            canDelete={canManageAttachments}
                                            deletingAttachmentId={pendingAction?.type === 'delete-attachment' ? pendingAction.attachment.id : null}
                                            onDelete={(attachment) => setPendingAction({ type: 'delete-attachment', attachment })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <aside className="lg:sticky lg:top-24 lg:self-start">
                            <Card>
                                <CardContent className="grid gap-3">
                                    <div>
                                        <h2 className="font-semibold text-slate-950">Gerir pedido</h2>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {isEditing ? 'Pode guardar as alterações do pedido ou cancelar a edição.' : 'Actualize, cancele ou volte ao painel principal.'}
                                        </p>
                                    </div>

                                    {isEditing ? (
                                        <Button variant="outline" onClick={cancelEditing} disabled={isSaving || isUploading}>
                                            Cancelar edição
                                        </Button>
                                    ) : null}

                                    {canCancel ? (
                                        <Button
                                            variant="danger"
                                            onClick={() => setPendingAction({ type: 'cancel' })}
                                            disabled={isSaving || isUploading || isLoading}
                                        >
                                            Cancelar pedido
                                        </Button>
                                    ) : null}

                                    <Button variant="ghost" onClick={() => router.visit('/client')}>
                                        Voltar ao painel
                                    </Button>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>

                    <section className="grid gap-4" aria-labelledby="proposals-title">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 id="proposals-title" className="text-xl font-bold text-slate-950">Propostas recebidas</h2>
                                <p className="mt-1 text-sm text-slate-500">{pagination.total} propostas para este pedido</p>
                            </div>
                            {isLoading ? <span className="text-sm text-brand-600">A actualizar...</span> : null}
                        </div>

                        {proposals.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {proposals.map((proposal) => (
                                    <ProposalReceivedCard
                                        key={proposal.id}
                                        proposal={proposal}
                                        disabled={isLoading || isSaving || isUploading}
                                        onAccept={(selected) => setPendingAction({ type: 'accept', proposal: selected })}
                                        onReject={(selected) => setPendingAction({ type: 'reject', proposal: selected })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Ainda não recebeu propostas"
                                description="As propostas enviadas pelos profissionais aparecerão aqui."
                            />
                        )}

                        {pagination.last_page > 1 ? (
                            <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => setProposalPage((page) => page - 1)}>
                                    Anterior
                                </Button>
                                <span className="text-sm text-slate-500">
                                    Página {pagination.current_page} de {pagination.last_page}
                                </span>
                                <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => setProposalPage((page) => page + 1)}>
                                    Seguinte
                                </Button>
                            </nav>
                        ) : null}
                    </section>
                </div>
            ) : null}

            <ConfirmActionModal
                open={pendingAction !== null}
                title={modalContent(pendingAction).title}
                description={modalContent(pendingAction).description}
                confirmLabel={modalContent(pendingAction).confirmLabel}
                destructive={pendingAction?.type === 'cancel' || pendingAction?.type === 'reject' || pendingAction?.type === 'delete-attachment'}
                isLoading={isMutating || isSaving || isUploading}
                reason={pendingAction?.type === 'cancel' ? cancelReason : undefined}
                reasonLabel="Motivo do cancelamento"
                onReasonChange={pendingAction?.type === 'cancel' ? setCancelReason : undefined}
                onConfirm={confirmAction}
                onClose={() => {
                    if (!isSaving && !isUploading && !isMutating) {
                        setPendingAction(null);
                    }
                }}
            />
        </ClientLayout>
    );
}

function serviceRequestToValues(serviceRequest: ServiceRequest): ServiceRequestFormValues {
    return {
        title: serviceRequest.title,
        category_id: String(serviceRequest.category_id),
        description: serviceRequest.description,
        service_type: serviceRequest.service_type,
        budget_min: serviceRequest.budget_min ?? '',
        budget_max: serviceRequest.budget_max ?? '',
        budget_type: serviceRequest.budget_type,
        province: serviceRequest.province ?? '',
        city: serviceRequest.city ?? '',
        address: serviceRequest.address ?? '',
        deadline_at: serviceRequest.deadline_at ? serviceRequest.deadline_at.slice(0, 16) : '',
    };
}

function modalContent(action: PendingAction | null): { title: string; description: string; confirmLabel: string } {
    if (action?.type === 'accept') {
        return {
            title: 'Aceitar proposta?',
            description: 'Esta acção cria um contrato e rejeita automaticamente as outras propostas pendentes.',
            confirmLabel: 'Aceitar proposta',
        };
    }

    if (action?.type === 'reject') {
        return {
            title: 'Rejeitar proposta?',
            description: 'O profissional será informado de que a proposta não foi seleccionada.',
            confirmLabel: 'Rejeitar proposta',
        };
    }

    if (action?.type === 'delete-attachment') {
        return {
            title: 'Eliminar anexo?',
            description: 'Este ficheiro será removido permanentemente deste pedido.',
            confirmLabel: 'Eliminar anexo',
        };
    }

    return {
        title: 'Cancelar pedido?',
        description: 'O pedido deixará de receber propostas. Esta acção não pode ser anulada.',
        confirmLabel: 'Cancelar pedido',
    };
}

function apiErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
        return 'Não foi possível concluir a operação. Tente novamente.';
    }

    const validationMessage = Object.values(error.errors).flat()[0];
    return validationMessage ?? error.message;
}

function firstValidationMessages(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Valor inválido.']));
}

function StatusNotice({ tone, message }: { tone: 'success' | 'danger'; message: string }) {
    return (
        <div
            className={[
                'rounded-2xl px-4 py-3 text-sm leading-6',
                tone === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-red-200 bg-red-50 text-red-700',
            ].join(' ')}
            role={tone === 'success' ? 'status' : 'alert'}
        >
            {message}
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="grid gap-6" aria-label="A carregar pedido" aria-busy="true">
            <div className="grid min-h-52 gap-4 rounded-3xl bg-brand-100 p-8">
                <LoadingSkeleton className="h-6 w-32 bg-brand-200" />
                <LoadingSkeleton className="h-9 w-full max-w-xl bg-brand-200" />
                <LoadingSkeleton className="h-5 w-64 bg-brand-200" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="grid gap-6">
                    <LoadingSkeleton className="h-72 rounded-2xl" />
                    <LoadingSkeleton className="h-44 rounded-2xl" />
                </div>
                <LoadingSkeleton className="h-64 rounded-2xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => <LoadingSkeleton key={index} className="h-64 rounded-2xl" />)}
            </div>
        </div>
    );
}
