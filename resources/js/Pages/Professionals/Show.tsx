import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { FavoriteButton } from '../../Components/Professionals/FavoriteButton';
import { ProfessionalDetailHeader } from '../../Components/Professionals/ProfessionalDetailHeader';
import { ReviewList } from '../../Components/Professionals/ReviewList';
import { TrustMetrics } from '../../Components/Professionals/TrustMetrics';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Badge } from '../../Components/ui/Badge';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent } from '../../Components/ui/Card';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { MarketplaceLayout } from '../../Layouts/MarketplaceLayout';
import { api, ApiError } from '../../lib/api';
import type { PaginatedData, Pagination, ProfessionalProfile, Review } from '../../types';

type ReviewsData = PaginatedData<'reviews', Review>;

export default function ProfessionalDetail({ professionalProfileId }: { professionalProfileId: number }) {
    const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ current_page: 1, per_page: 15, last_page: 1, total: 0 });
    const [reviewPage, setReviewPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadProfessional = useCallback(async (signal: AbortSignal, page: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const [professionalData, reviewsData] = await Promise.all([
                api.get<{ professional: ProfessionalProfile }>(`/professionals/${professionalProfileId}`, { signal }),
                api.get<ReviewsData>(`/professionals/${professionalProfileId}/reviews`, { signal, query: { page } }),
            ]);
            setProfessional(professionalData.professional);
            setReviews(reviewsData.reviews);
            setPagination(reviewsData.pagination);
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar este perfil profissional.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [professionalProfileId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadProfessional(controller.signal, reviewPage);
        return () => controller.abort();
    }, [loadProfessional, reloadKey, reviewPage]);

    return (
        <MarketplaceLayout>
            <Head title={professional?.user?.name ?? 'Perfil profissional'} />
            <div className="mx-auto grid max-w-[96rem] gap-6 px-page py-8 sm:px-8">
                {isLoading && !professional ? <DetailSkeleton /> : null}

                {!isLoading && error ? <EmptyState title="Não foi possível carregar o perfil" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}

                {!error && professional ? (
                    <>
                        <ProfessionalDetailHeader professional={professional} />
                        <TrustMetrics professional={professional} />

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="grid gap-6">
                                <Card>
                                    <CardContent>
                                        <h2 className="text-xl font-bold text-slate-950">Sobre o profissional</h2>
                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{professional.bio || 'Este profissional ainda não adicionou uma apresentação.'}</p>
                                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                            <TagGroup title="Categorias" items={professional.categories?.map((category) => category.name) ?? []} />
                                            <TagGroup title="Competências" items={professional.skills?.map((skill) => skill.name) ?? []} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent>
                                        <h2 className="text-xl font-bold text-slate-950">Portefólio</h2>
                                        {professional.portfolio_items && professional.portfolio_items.length > 0 ? (
                                            <div className="mt-4 grid gap-4 sm:grid-cols-2">{professional.portfolio_items.slice(0, 4).map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-semibold text-slate-950">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description || 'Trabalho realizado pelo profissional.'}</p></div>)}</div>
                                        ) : <p className="mt-3 text-sm leading-6 text-slate-500">Este profissional ainda não disponibilizou trabalhos públicos no portefólio.</p>}
                                    </CardContent>
                                </Card>

                                <section className="grid gap-4" aria-labelledby="reviews-title">
                                    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="reviews-title" className="text-xl font-bold text-slate-950">Avaliações</h2><p className="mt-1 text-sm text-slate-500">{pagination.total} avaliações de clientes</p></div>{isLoading ? <span className="text-sm text-brand-600">A actualizar...</span> : null}</div>
                                    <ReviewList reviews={reviews} />
                                    {pagination.last_page > 1 ? <div className="flex items-center justify-between gap-3"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => setReviewPage((page) => page - 1)}>Anterior</Button><span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => setReviewPage((page) => page + 1)}>Seguinte</Button></div> : null}
                                </section>
                            </div>

                            <aside className="lg:sticky lg:top-24 lg:self-start">
                                <Card>
                                    <CardContent className="grid gap-4">
                                        <div><h2 className="font-semibold text-slate-950">Trabalhar com este profissional</h2><p className="mt-1 text-sm leading-6 text-slate-500">Guarde o perfil ou inicie uma acção quando estiver disponível.</p></div>
                                        <FavoriteButton professionalProfileId={professional.id} />
                                        <Button onClick={() => setNotice('O convite para pedidos será implementado numa próxima etapa.')}>Convidar para pedido</Button>
                                        <Button variant="outline" onClick={() => setNotice('O contacto directo será disponibilizado com o módulo de conversas.')}>Contactar</Button>
                                        {notice ? <p className="text-xs leading-5 text-brand-700" role="status">{notice}</p> : null}
                                    </CardContent>
                                </Card>
                            </aside>
                        </div>
                    </>
                ) : null}
            </div>
        </MarketplaceLayout>
    );
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
    return <div><h3 className="text-sm font-semibold text-slate-900">{title}</h3><div className="mt-2 flex flex-wrap gap-2">{items.length > 0 ? items.map((item) => <Badge key={item} variant="gray">{item}</Badge>) : <span className="text-sm text-slate-500">Sem informação.</span>}</div></div>;
}

function DetailSkeleton() {
    return (
        <div className="grid gap-6" aria-label="A carregar perfil profissional" aria-busy="true">
            <div className="flex min-h-48 items-center gap-5 rounded-3xl bg-brand-100 p-8"><LoadingSkeleton className="size-20 rounded-3xl bg-brand-200" /><div className="grid flex-1 gap-3"><LoadingSkeleton className="h-8 w-64 max-w-full bg-brand-200" /><LoadingSkeleton className="h-5 w-96 max-w-full bg-brand-200" /></div></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <LoadingSkeleton key={index} className="h-24 rounded-2xl" />)}</div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><LoadingSkeleton className="h-96 rounded-2xl" /><LoadingSkeleton className="h-72 rounded-2xl" /></div>
        </div>
    );
}
