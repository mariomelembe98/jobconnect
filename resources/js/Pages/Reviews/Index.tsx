import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReviewCard } from '../../Components/Reviews/ReviewCard';
import { ReviewTabs, type ReviewFilter } from '../../Components/Reviews/ReviewTabs';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ReviewsLayout } from '../../Layouts/ReviewsLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';
import type { PaginatedData, Pagination, Review } from '../../types';

type ReviewsData = PaginatedData<'reviews', Review>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ReviewsIndex() {
    const currentUser = getStoredAuthUser();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [activeTab, setActiveTab] = useState<ReviewFilter>('all');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadReviews = useCallback(async (signal: AbortSignal, currentPage: number) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<ReviewsData>('/reviews/me', { signal, query: { page: currentPage } });
            setReviews(data.reviews);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as avaliações.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadReviews(controller.signal, page);
        return () => controller.abort();
    }, [loadReviews, page, reloadKey]);

    const givenCount = reviews.filter((review) => review.reviewer_id === currentUser?.id).length;
    const receivedCount = reviews.filter((review) => review.reviewed_id === currentUser?.id).length;
    const visibleReviews = useMemo(() => reviews.filter((review) => {
        if (activeTab === 'given') return review.reviewer_id === currentUser?.id;
        if (activeTab === 'received') return review.reviewed_id === currentUser?.id;
        return true;
    }), [activeTab, currentUser?.id, reviews]);

    return (
        <ReviewsLayout title="Avaliações" description="Consulte o feedback dos serviços concluídos.">
            <Head title="As minhas avaliações" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div><p className="text-sm font-semibold text-brand-100">Reputação e confiança</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">As minhas avaliações</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Acompanhe o feedback que recebeu e as avaliações que deixou após cada serviço.</p></div>
                    <div className="grid grid-cols-3 gap-2">
                        <Metric label="Total" value={pagination.total} />
                        <Metric label="Feitas nesta página" value={givenCount} />
                        <Metric label="Recebidas nesta página" value={receivedCount} />
                    </div>
                </div>
            </section>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 shadow-card sm:px-6"><ReviewTabs activeTab={activeTab} onChange={setActiveTab} /></div>

            <div className="mt-6">
                {isLoading && reviews.length === 0 ? <ReviewsSkeleton /> : null}
                {!isLoading && error ? <EmptyState title="Não foi possível carregar as avaliações" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}

                {!error && (!isLoading || reviews.length > 0) ? (
                    <div className="grid gap-5">
                        {isLoading ? <p className="text-right text-sm text-brand-600">A atualizar...</p> : null}
                        {visibleReviews.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{visibleReviews.map((review) => <ReviewCard key={review.id} review={review} currentUserId={currentUser?.id} />)}</div> : <EmptyState title={activeTab === 'all' ? 'Ainda não existem avaliações' : 'Nenhuma avaliação neste grupo'} description={activeTab === 'all' ? 'As avaliações aparecerão aqui depois da conclusão dos seus contratos.' : 'Selecione outro filtro para consultar as restantes avaliações desta página.'} action={activeTab !== 'all' ? <Button variant="outline" onClick={() => setActiveTab('all')}>Ver todas</Button> : undefined} />}
                        {pagination.last_page > 1 ? <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="Paginação"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Anterior</Button><span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page || isLoading} onClick={() => setPage((current) => current + 1)}>Seguinte</Button></nav> : null}
                    </div>
                ) : null}
            </div>
        </ReviewsLayout>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return <div className="min-w-24 rounded-2xl bg-white/15 px-3 py-3 text-center backdrop-blur-sm"><p className="text-xs text-brand-100">{label}</p><p className="mt-1 text-xl font-bold">{formatNumber(value)}</p></div>;
}

function ReviewsSkeleton() {
    return <div className="grid gap-4 xl:grid-cols-2" aria-label="A carregar avaliações" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex min-h-52 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><LoadingSkeleton className="size-11 shrink-0 rounded-xl" /><div className="grid flex-1 gap-3"><LoadingSkeleton className="h-5 w-40" /><LoadingSkeleton className="h-5 w-32" /><LoadingSkeleton className="h-16 w-full" /><LoadingSkeleton className="mt-auto h-4 w-28" /></div></div>)}</div>;
}
