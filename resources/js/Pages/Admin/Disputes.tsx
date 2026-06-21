import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { AdminActionModal } from '../../Components/Admin/AdminActionModal';
import { AdminDataTable } from '../../Components/Admin/AdminDataTable';
import { AdminFilterBar } from '../../Components/Admin/AdminFilterBar';
import { AdminStatusBadge } from '../../Components/Admin/AdminStatusBadge';
import { DisputeDetailPanel, type AdminDisputeItem } from '../../Components/Admin/DisputeDetailPanel';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { Select } from '../../Components/ui/Select';
import { Textarea } from '../../Components/ui/Textarea';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { api, ApiError } from '../../lib/api';
import { getStoredAuthUser } from '../../lib/auth';
import { formatDateTime } from '../../lib/formatters';
import type { Pagination } from '../../types';

interface AdminDisputesResponse {
    disputes: AdminDisputeItem[];
    pagination: Pagination;
}

interface AdminDisputeDetailResponse {
    dispute: AdminDisputeItem;
}

interface DisputeFilters {
    status: string;
}

const defaultFilters: DisputeFilters = {
    status: '',
};

const initialPagination: Pagination = { current_page: 1, per_page: 20, last_page: 1, total: 0 };

export default function AdminDisputesPage() {
    const currentUser = getStoredAuthUser();
    const [filters, setFilters] = useState<DisputeFilters>({ ...defaultFilters });
    const [appliedFilters, setAppliedFilters] = useState<DisputeFilters>({ ...defaultFilters });
    const [disputes, setDisputes] = useState<AdminDisputeItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [openResolveModal, setOpenResolveModal] = useState(false);
    const [resolution, setResolution] = useState<NonNullable<AdminDisputeItem['resolution']>>('mutual_agreement');
    const [resolutionNote, setResolutionNote] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isResolving, setIsResolving] = useState(false);

    const loadDisputes = useCallback(async (signal: AbortSignal, currentFilters: DisputeFilters, currentPage: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<AdminDisputesResponse>('/admin/disputes', {
                signal,
                query: {
                    status: currentFilters.status,
                    page: currentPage,
                },
            });

            if (signal.aborted) {
                return;
            }

            setDisputes(data.disputes);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as disputas.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    const loadDisputeDetail = useCallback(async (signal: AbortSignal, disputeId: number) => {
        setIsDetailLoading(true);
        setDetailError(null);

        try {
            const data = await api.get<AdminDisputeDetailResponse>(`/admin/disputes/${disputeId}`, { signal });
            if (!signal.aborted) {
                setSelectedDispute(data.dispute);
            }
        } catch (caughtError) {
            if (!signal.aborted) {
                setDetailError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o detalhe da disputa.');
            }
        } finally {
            if (!signal.aborted) {
                setIsDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadDisputes(controller.signal, appliedFilters, page);

        return () => controller.abort();
    }, [appliedFilters, loadDisputes, page, reloadKey]);

    useEffect(() => {
        if (disputes.length === 0) {
            setSelectedId(null);
            setSelectedDispute(null);
            return;
        }

        if (!selectedId || !disputes.some((dispute) => dispute.id === selectedId)) {
            setSelectedId(disputes[0].id);
        }
    }, [disputes, selectedId]);

    useEffect(() => {
        if (!selectedId) {
            return;
        }

        const controller = new AbortController();
        void loadDisputeDetail(controller.signal, selectedId);

        return () => controller.abort();
    }, [loadDisputeDetail, reloadKey, selectedId]);

    function applyFilters(): void {
        setPage(1);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...defaultFilters });
        setAppliedFilters({ ...defaultFilters });
        setPage(1);
    }

    async function assignToMe(): Promise<void> {
        if (!selectedDispute || !currentUser) {
            return;
        }

        setIsAssigning(true);
        setFeedback(null);

        try {
            await api.post(`/admin/disputes/${selectedDispute.id}/assign`, {
                assigned_to: currentUser.id,
            });
            setFeedback('Disputa atribuída com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível atribuir a disputa.');
        } finally {
            setIsAssigning(false);
        }
    }

    async function resolveDispute(): Promise<void> {
        if (!selectedDispute) {
            return;
        }

        setIsResolving(true);
        setFeedback(null);

        try {
            await api.post(`/admin/disputes/${selectedDispute.id}/resolve`, {
                resolution,
                resolution_note: resolutionNote.trim() || undefined,
            });
            setFeedback('Disputa resolvida com sucesso.');
            setOpenResolveModal(false);
            setResolutionNote('');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível resolver a disputa.');
        } finally {
            setIsResolving(false);
        }
    }

    return (
        <AdminLayout title="Disputas" description="Acompanhe e resolva conflitos entre clientes e profissionais.">
            <Head title="Administração · Disputas" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-700 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-300">Mediação de conflitos</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Disputas administrativas</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Consulte o estado das disputas, atribua casos a administradores e feche resoluções.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-slate-300">Total</p>
                        <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
                    </div>
                </div>
            </section>

            {feedback ? <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700" role="status">{feedback}</div> : null}

            <AdminFilterBar
                title="Filtros de disputas"
                description="Filtre por estado do processo."
                search=""
                onSearchChange={() => {}}
                onApply={applyFilters}
                onReset={resetFilters}
                showSearch={false}
                action={<Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} isLoading={isLoading}>Actualizar</Button>}
            >
                <Select
                    label="Estado"
                    value={filters.status}
                    options={[
                        { label: 'Pendente', value: 'pending' },
                        { label: 'Em análise', value: 'under_review' },
                        { label: 'Resolvida', value: 'resolved' },
                        { label: 'Descartada', value: 'dismissed' },
                    ]}
                    placeholder="Todos os estados"
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                />
            </AdminFilterBar>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="grid gap-5">
                    {isLoading ? <SkeletonList /> : null}

                    {!isLoading && error ? (
                        <EmptyState
                            title="Não foi possível carregar as disputas"
                            description={error}
                            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                            action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                        />
                    ) : null}

                    {!error && (!isLoading || disputes.length > 0) ? (
                        <div className="grid gap-5">
                            <AdminDataTable headers={['Contrato', 'Estado', 'Aberta por', 'Atribuída a', 'Resolução', 'Criado em']}>
                                {disputes.length > 0 ? disputes.map((dispute) => {
                                    const active = selectedId === dispute.id;

                                    return (
                                        <tr
                                            key={dispute.id}
                                            className={`cursor-pointer border-b border-slate-100 transition hover:bg-brand-50 ${active ? 'bg-brand-50' : 'bg-white'}`}
                                            onClick={() => setSelectedId(dispute.id)}
                                        >
                                            <td className="px-4 py-4 text-sm text-slate-600">#{dispute.contract_id}</td>
                                            <td className="px-4 py-4"><AdminStatusBadge kind="dispute" value={dispute.status} /></td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{dispute.opener?.name ?? `Utilizador #${dispute.opened_by}`}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{dispute.assignee?.name ?? '—'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{dispute.resolution ? resolutionLabel(dispute.resolution) : '—'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{dispute.created_at ? formatDateTime(dispute.created_at) : '—'}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                                            Nenhuma disputa encontrada.
                                        </td>
                                    </tr>
                                )}
                            </AdminDataTable>

                            {pagination.last_page > 1 ? (
                                <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="Paginação">
                                    <Button variant="outline" size="sm" disabled={pagination.current_page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                                    <span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span>
                                    <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page || isLoading} onClick={() => setPage((current) => current + 1)}>Seguinte</Button>
                                </nav>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div className="grid gap-5">
                    {isDetailLoading ? <DetailSkeleton /> : null}
                    {!isDetailLoading && detailError ? (
                        <EmptyState
                            title="Não foi possível carregar o detalhe"
                            description={detailError}
                            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                            action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                        />
                    ) : null}

                    {!detailError && !isDetailLoading ? (
                        <DisputeDetailPanel
                            dispute={selectedDispute}
                            onAssignToMe={assignToMe}
                            onResolve={() => {
                                setResolution('mutual_agreement');
                                setResolutionNote('');
                                setOpenResolveModal(true);
                            }}
                            isAssigning={isAssigning}
                            isResolving={isResolving}
                        />
                    ) : null}
                </div>
            </div>

            <AdminActionModal
                open={openResolveModal}
                title="Resolver disputa?"
                description="Escolha a resolução e adicione uma nota opcional."
                confirmLabel="Resolver"
                isLoading={isResolving}
                onConfirm={resolveDispute}
                onClose={() => setOpenResolveModal(false)}
            >
                <Select
                    label="Resolução"
                    value={resolution}
                    options={[
                        { label: 'Favor do cliente', value: 'favor_client' },
                        { label: 'Favor do profissional', value: 'favor_professional' },
                        { label: 'Acordo mútuo', value: 'mutual_agreement' },
                        { label: 'Descartada', value: 'dismissed' },
                    ]}
                    onChange={(event) => setResolution(event.target.value as NonNullable<AdminDisputeItem['resolution']>)}
                />
                <Textarea
                    label="Nota de resolução"
                    value={resolutionNote}
                    rows={5}
                    placeholder="Adicione observações adicionais (opcional)"
                    onChange={(event) => setResolutionNote(event.target.value)}
                />
            </AdminActionModal>
        </AdminLayout>
    );
}

function SkeletonList() {
    return (
        <div className="grid gap-4" aria-label="A carregar disputas" aria-busy="true">
            <LoadingSkeleton className="h-28 rounded-2xl" />
            <LoadingSkeleton className="h-[34rem] rounded-2xl" />
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card" aria-label="A carregar detalhe" aria-busy="true">
            <LoadingSkeleton className="h-5 w-48" />
            <LoadingSkeleton className="h-8 w-2/3" />
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}

function resolutionLabel(value: NonNullable<AdminDisputeItem['resolution']>): string {
    return {
        favor_client: 'Favor do cliente',
        favor_professional: 'Favor do profissional',
        mutual_agreement: 'Acordo mútuo',
        dismissed: 'Descartada',
    }[value];
}
