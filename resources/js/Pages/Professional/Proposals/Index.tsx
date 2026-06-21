import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { ProfessionalProposalCard } from '../../../Components/ProfessionalProposals/ProfessionalProposalCard';
import { ProposalStatusTabs, type ProposalStatusFilter } from '../../../Components/ProfessionalProposals/ProposalStatusTabs';
import { WithdrawProposalModal } from '../../../Components/ProfessionalProposals/WithdrawProposalModal';
import { Button } from '../../../Components/ui/Button';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ProfessionalLayout } from '../../../Layouts/ProfessionalLayout';
import { api, ApiError } from '../../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import { formatNumber } from '../../../lib/formatters';
import type { PaginatedData, Pagination, Proposal } from '../../../types';

type ProposalsData = PaginatedData<'proposals', Proposal>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ProfessionalProposals() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [activeTab, setActiveTab] = useState<ProposalStatusFilter>('all');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [proposalToWithdraw, setProposalToWithdraw] = useState<Proposal | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const loadProposals = useCallback(async (signal: AbortSignal, currentPage: number) => {
        if (!getAuthToken()) return;
        if (getStoredAuthUser()?.user_type !== 'professional') return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<ProposalsData>('/professional/proposals', {
                signal,
                query: { page: currentPage },
            });
            const detailResults = await Promise.allSettled(
                data.proposals.map((proposal) => api.get<{ proposal: Proposal }>(`/proposals/${proposal.id}`, { signal })),
            );

            if (signal.aborted) return;

            setProposals(data.proposals.map((proposal, index) => {
                const detail = detailResults[index];
                return detail?.status === 'fulfilled' ? detail.value.proposal : proposal;
            }));
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as suas propostas.');
            }
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadProposals(controller.signal, page);
        return () => controller.abort();
    }, [loadProposals, page, reloadKey]);

    const visibleProposals = useMemo(
        () => activeTab === 'all' ? proposals : proposals.filter((proposal) => proposal.status === activeTab),
        [activeTab, proposals],
    );

    async function withdrawProposal(): Promise<void> {
        if (!proposalToWithdraw) return;

        setIsWithdrawing(true);
        setFeedback(null);

        try {
            await api.post(`/proposals/${proposalToWithdraw.id}/withdraw`);
            setProposalToWithdraw(null);
            setFeedback({ type: 'success', message: 'Proposta retirada com sucesso.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({
                type: 'error',
                message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível retirar a proposta.',
            });
        } finally {
            setIsWithdrawing(false);
        }
    }

    return (
        <ProfessionalLayout title="Minhas propostas" description="Acompanhe o estado das propostas enviadas aos clientes.">
            <Head title="Minhas propostas" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <p className="text-sm font-semibold text-brand-100">Área profissional</p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">Propostas enviadas</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Consulte respostas dos clientes e retire propostas que ainda estejam pendentes.</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-brand-100">Total de propostas</p>
                        <p className="mt-1 text-2xl font-bold">{formatNumber(pagination.total)}</p>
                    </div>
                </div>
            </section>

            {feedback ? (
                <div
                    className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                >
                    {feedback.message}
                </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 shadow-card sm:px-6">
                <ProposalStatusTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>

            <div className="mt-6">
                {isLoading && proposals.length === 0 ? <ProposalsSkeleton /> : null}

                {!isLoading && error ? (
                    <EmptyState
                        title="Não foi possível carregar as propostas"
                        description={error}
                        icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                        action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                    />
                ) : null}

                {!error && (!isLoading || proposals.length > 0) ? (
                    <div className="grid gap-5">
                        {isLoading ? <p className="text-right text-sm text-brand-600">A actualizar...</p> : null}
                        {visibleProposals.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {visibleProposals.map((proposal) => (
                                    <ProfessionalProposalCard key={proposal.id} proposal={proposal} onWithdraw={setProposalToWithdraw} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title={activeTab === 'all' ? 'Ainda não enviou propostas' : 'Nenhuma proposta neste estado'}
                                description={activeTab === 'all' ? 'Explore os trabalhos disponíveis e apresente a sua primeira proposta.' : 'Seleccione outro filtro para consultar as restantes propostas desta página.'}
                                action={activeTab === 'all' ? <Button onClick={() => router.visit('/professional/jobs')}>Ver trabalhos</Button> : <Button variant="outline" onClick={() => setActiveTab('all')}>Ver todas</Button>}
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

            <WithdrawProposalModal
                proposal={proposalToWithdraw}
                isLoading={isWithdrawing}
                onConfirm={withdrawProposal}
                onClose={() => {
                    if (!isWithdrawing) setProposalToWithdraw(null);
                }}
            />
        </ProfessionalLayout>
    );
}

function ProposalsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="A carregar propostas" aria-busy="true">
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
