import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ContractCard } from '../../Components/Contracts/ContractCard';
import { ContractStatusTabs, type ContractStatusFilter } from '../../Components/Contracts/ContractStatusTabs';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ContractsLayout } from '../../Layouts/ContractsLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';
import type { Contract, PaginatedData, Pagination } from '../../types';

type ContractsData = PaginatedData<'contracts', Contract>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ContractsIndex() {
    const currentUser = getStoredAuthUser();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [activeTab, setActiveTab] = useState<ContractStatusFilter>('all');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadContracts = useCallback(async (signal: AbortSignal, currentPage: number) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<ContractsData>('/contracts', { signal, query: { page: currentPage } });
            const detailResults = await Promise.allSettled(
                data.contracts.map((contract) => api.get<{ contract: Contract }>(`/contracts/${contract.id}`, { signal })),
            );

            if (signal.aborted) return;

            setContracts(data.contracts.map((contract, index) => {
                const detail = detailResults[index];
                return detail?.status === 'fulfilled' ? detail.value.contract : contract;
            }));
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os contratos.');
            }
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadContracts(controller.signal, page);
        return () => controller.abort();
    }, [loadContracts, page, reloadKey]);

    const visibleContracts = useMemo(
        () => activeTab === 'all' ? contracts : contracts.filter((contract) => contract.status === activeTab),
        [activeTab, contracts],
    );

    return (
        <ContractsLayout title="Contratos" description="Acompanhe os serviços contratados e o respetivo progresso.">
            <Head title="Contratos" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-sm font-semibold text-brand-100">Gestão de serviços</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Os seus contratos</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Consulte valores, participantes e estados dos seus trabalhos num só lugar.</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-brand-100">Total</p>
                        <p className="mt-1 text-2xl font-bold">{formatNumber(pagination.total)}</p>
                    </div>
                </div>
            </section>

            {notice ? <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700" role="status">{notice}</div> : null}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 shadow-card sm:px-6">
                <ContractStatusTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>

            <div className="mt-6">
                {isLoading && contracts.length === 0 ? <ContractsSkeleton /> : null}

                {!isLoading && error ? (
                    <EmptyState
                        title="Não foi possível carregar os contratos"
                        description={error}
                        icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                        action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                    />
                ) : null}

                {!error && (!isLoading || contracts.length > 0) ? (
                    <div className="grid gap-5">
                        {isLoading ? <p className="text-right text-sm text-brand-600">A atualizar...</p> : null}
                        {visibleContracts.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {visibleContracts.map((contract) => (
                                    <ContractCard
                                        key={contract.id}
                                        contract={contract}
                                        viewerType={currentUser?.user_type}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title={activeTab === 'all' ? 'Ainda não tem contratos' : 'Nenhum contrato neste estado'}
                                description={activeTab === 'all' ? 'Os contratos criados após a aceitação de propostas aparecerão aqui.' : 'Selecione outro filtro para consultar os restantes contratos desta página.'}
                                action={activeTab === 'all'
                                    ? <Button onClick={() => router.visit(currentUser?.user_type === 'professional' ? '/professional/jobs' : '/client')}>{currentUser?.user_type === 'professional' ? 'Ver trabalhos' : 'Voltar ao painel'}</Button>
                                    : <Button variant="outline" onClick={() => setActiveTab('all')}>Ver todos</Button>}
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
        </ContractsLayout>
    );
}

function ContractsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="A carregar contratos" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid min-h-80 gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card">
                    <div className="flex justify-between gap-4"><LoadingSkeleton className="h-12 w-2/3" /><LoadingSkeleton className="h-6 w-20 rounded-full" /></div>
                    <LoadingSkeleton className="h-20 w-full rounded-xl" />
                    <LoadingSkeleton className="h-16 w-full" />
                    <LoadingSkeleton className="mt-auto h-9 w-32" />
                </div>
            ))}
        </div>
    );
}
