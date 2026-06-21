import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { DisputeCreationModal } from '../../Components/Disputes/DisputeCreationModal';
import { DisputeHistoryCard } from '../../Components/Disputes/DisputeHistoryCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { CasesLayout } from '../../Layouts/CasesLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';
import type { Dispute, PaginatedData, Pagination } from '../../types';

type DisputesData = PaginatedData<'disputes', Dispute>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function DisputesIndex() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);
    const [creatingContractId, setCreatingContractId] = useState<number | null>(null);

    const loadDisputes = useCallback(async (signal: AbortSignal, currentPage: number) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<DisputesData>('/disputes', { signal, query: { page: currentPage } });
            setDisputes(data.disputes);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as disputas.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadDisputes(controller.signal, page);
        return () => controller.abort();
    }, [loadDisputes, page, reloadKey]);

    function refresh(): void {
        setReloadKey((value) => value + 1);
    }

    function openNewDispute(contractId?: number): void {
        setCreatingContractId(contractId ?? null);
        setCreateOpen(true);
    }

    return (
        <CasesLayout title="Disputas" description="Veja e abra disputas relacionadas com os seus contratos.">
            <Head title="Disputas" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-brand-100">Resolução de conflitos</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">As suas disputas</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Acompanhe casos em aberto, adicione provas e continue a conversa dentro do sistema.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Stat label="Total" value={pagination.total} />
                        <Stat label="Pendentes" value={disputes.filter((dispute) => dispute.status === 'pending').length} />
                        <Button variant="outline" className="border-white bg-white text-brand-700 hover:bg-brand-50" onClick={() => openNewDispute()}>Abrir disputa</Button>
                    </div>
                </div>
            </section>

            <div className="grid gap-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">{formatNumber(pagination.total)} disputas encontradas</p>
                    <Button variant="outline" size="sm" onClick={refresh} isLoading={isLoading}>Atualizar</Button>
                </div>

                {isLoading && disputes.length === 0 ? <DisputesSkeleton /> : null}

                {!isLoading && error ? (
                    <EmptyState
                        title="Não foi possível carregar as disputas"
                        description={error}
                        action={<Button onClick={refresh}>Tentar novamente</Button>}
                    />
                ) : null}

                {!error && (!isLoading || disputes.length > 0) ? (
                    <div className="grid gap-4">
                        {disputes.length > 0 ? (
                            disputes.map((dispute) => (
                                <DisputeHistoryCard
                                    key={dispute.id}
                                    dispute={dispute}
                                    onSelect={() => router.visit(`/disputes/${dispute.id}`)}
                                />
                            ))
                        ) : (
                            <EmptyState
                                title="Ainda não existem disputas"
                                description="Quando abrir uma disputa, ela aparecerá aqui com o estado actualizado."
                                action={<Button onClick={() => openNewDispute()}>Abrir disputa</Button>}
                            />
                        )}

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

            <DisputeCreationModal
                open={createOpen}
                defaultContractId={creatingContractId ?? ''}
                onClose={() => {
                    setCreateOpen(false);
                    setCreatingContractId(null);
                }}
                onCreated={(dispute) => {
                    setCreateOpen(false);
                    setCreatingContractId(null);
                    router.visit(`/disputes/${dispute.id}`);
                }}
            />
        </CasesLayout>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur-sm">
            <p className="text-xs text-brand-100">{label}</p>
            <p className="mt-1 text-2xl font-bold">{formatNumber(value)}</p>
        </div>
    );
}

function DisputesSkeleton() {
    return (
        <div className="grid gap-4" aria-label="A carregar disputas" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <LoadingSkeleton className="h-5 w-44" />
                    <LoadingSkeleton className="h-4 w-28" />
                    <LoadingSkeleton className="h-20 w-full" />
                </div>
            ))}
        </div>
    );
}
