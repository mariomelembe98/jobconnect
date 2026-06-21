import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { CategoryCard } from '../../Components/ClientDashboard/CategoryCard';
import { NotificationBadge } from '../../Components/ClientDashboard/NotificationBadge';
import { ProfessionalCard } from '../../Components/ClientDashboard/ProfessionalCard';
import { ServiceRequestCard } from '../../Components/ClientDashboard/ServiceRequestCard';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent } from '../../Components/ui/Card';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ClientLayout } from '../../Layouts/ClientLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import type { Category, Notification, PaginatedData, ProfessionalProfile, ServiceRequest } from '../../types';

interface DashboardData {
    categories: Category[];
    professionals: ProfessionalProfile[];
    serviceRequests: ServiceRequest[];
    unreadNotifications: number;
}

type ProfessionalsData = PaginatedData<'professionals', ProfessionalProfile>;
type ServiceRequestsData = PaginatedData<'service_requests', ServiceRequest>;
type NotificationsData = PaginatedData<'notifications', Notification>;

const emptyDashboard: DashboardData = {
    categories: [],
    professionals: [],
    serviceRequests: [],
    unreadNotifications: 0,
};

const quickActions: Array<{ title: string; description: string; target?: string; icon: string }> = [
    { title: 'Publicar pedido', description: 'Descreva o serviço de que precisa.', target: '/client/service-requests/create', icon: 'M12 5v14M5 12h14' },
    { title: 'Explorar profissionais', description: 'Veja especialistas bem avaliados.', target: '#profissionais', icon: 'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z' },
    { title: 'Ver contratos', description: 'Acompanhe os serviços contratados.', target: '/contracts', icon: 'M4 7h16v13H4zM8 7V4h8v3M4 12h16' },
    { title: 'Ver mensagens', description: 'Acompanhe as suas conversas.', target: '/conversations', icon: 'M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-5A9 9 0 1 1 21 12Z' },
    { title: 'Ver notificações', description: 'Consulte novidades da sua conta.', target: '/notifications', icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4' },
];

export default function ClientDashboard() {
    const currentUser = getStoredAuthUser();
    const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadDashboard = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [categoriesData, professionalsData, requestsData, notificationsData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<ProfessionalsData>('/professionals', { query: { sort: '-average_rating' }, signal }),
                api.get<ServiceRequestsData>('/client/service-requests', { signal }),
                api.get<NotificationsData>('/notifications', { query: { read: false }, signal }),
            ]);

            setDashboard({
                categories: categoriesData.categories,
                professionals: professionalsData.professionals.slice(0, 4),
                serviceRequests: requestsData.service_requests.slice(0, 4),
                unreadNotifications: notificationsData.pagination.total,
            });
        } catch (caughtError) {
            if (signal.aborted) {
                return;
            }

            setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o seu painel.');
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadDashboard(controller.signal);

        return () => controller.abort();
    }, [loadDashboard, reloadKey]);

    function retry(): void {
        setReloadKey((value) => value + 1);
    }

    function showComingSoon(message: string): void {
        setNotice(message);
    }

    function submitSearch(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        showComingSoon('A pesquisa completa será disponibilizada em breve. Explore os profissionais em destaque abaixo.');
    }

    const firstName = currentUser?.name.split(/\s+/)[0] ?? 'cliente';

    return (
        <ClientLayout title="Visão geral" description="Encontre profissionais e acompanhe os seus pedidos.">
            <Head title="Área do cliente" />

            {isLoading ? <DashboardSkeleton /> : null}

            {!isLoading && error ? <DashboardError message={error} onRetry={retry} /> : null}

            {!isLoading && !error ? (
                <div className="grid gap-8">
                    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-5 py-7 text-white shadow-elevated sm:px-8 sm:py-9">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-sm font-semibold text-blue-100">Olá, {firstName}</p>
                                <NotificationBadge count={dashboard.unreadNotifications} />
                            </div>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Que serviço procura hoje?</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                                Ligue-se a profissionais de confiança em Moçambique e acompanhe tudo num só lugar.
                            </p>

                            <form className="mt-6 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-lg sm:flex-row" onSubmit={submitSearch}>
                                <label className="flex min-w-0 flex-1 items-center gap-3 px-3" htmlFor="dashboard-search">
                                    <MiniIcon path="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                                    <span className="sr-only">Pesquisar serviço</span>
                                    <input
                                        id="dashboard-search"
                                        name="q"
                                        className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                                        placeholder="Que serviço procura hoje?"
                                        autoComplete="off"
                                    />
                                </label>
                                <Button type="submit" className="sm:self-center">Pesquisar</Button>
                            </form>
                            {notice ? <p className="mt-3 text-sm text-blue-50" role="status">{notice}</p> : null}
                        </div>
                    </section>

                    <section aria-labelledby="quick-actions-title">
                        <SectionHeading id="quick-actions-title" title="Acesso rápido" description="Atalhos para as tarefas mais frequentes." />
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {quickActions.map((action) => (
                                <QuickAction
                                    key={action.title}
                                    {...action}
                                    onClick={action.target ? undefined : () => showComingSoon(`${action.title} estará disponível em breve.`)}
                                />
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="categories-title">
                        <SectionHeading id="categories-title" title="Categorias populares" description="Comece por escolher o tipo de serviço de que precisa." />
                        {dashboard.categories.length > 0 ? (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {dashboard.categories.slice(0, 8).map((category) => <CategoryCard key={category.id} category={category} />)}
                            </div>
                        ) : (
                            <EmptyState className="mt-4" title="Sem categorias disponíveis" description="As categorias de serviços aparecerão aqui quando estiverem disponíveis." />
                        )}
                    </section>

                    <section id="profissionais" aria-labelledby="professionals-title" className="scroll-mt-24">
                        <SectionHeading id="professionals-title" title="Profissionais em destaque" description="Perfis ordenados pela melhor avaliação na plataforma." />
                        {dashboard.professionals.length > 0 ? (
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {dashboard.professionals.map((professional) => <ProfessionalCard key={professional.id} professional={professional} />)}
                            </div>
                        ) : (
                            <EmptyState className="mt-4" title="Ainda não há profissionais" description="Os profissionais mais bem avaliados aparecerão aqui." />
                        )}
                    </section>

                    <section id="pedidos" aria-labelledby="requests-title" className="scroll-mt-24">
                        <SectionHeading id="requests-title" title="Pedidos recentes" description="Acompanhe os seus pedidos de serviço mais recentes." />
                        {dashboard.serviceRequests.length > 0 ? (
                            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                                {dashboard.serviceRequests.map((serviceRequest) => <ServiceRequestCard key={serviceRequest.id} serviceRequest={serviceRequest} />)}
                            </div>
                        ) : (
                            <EmptyState
                                className="mt-4"
                                title="Ainda não publicou pedidos"
                                description="Quando publicar o primeiro pedido, poderá acompanhar o estado aqui."
                                action={<Button onClick={() => router.visit('/client/service-requests/create')}>Publicar pedido</Button>}
                            />
                        )}
                    </section>

                    <section id="notificacoes" className="scroll-mt-24" aria-label="Resumo de notificações">
                        <Card className="border-brand-100 bg-brand-50/60">
                            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                                        <MiniIcon path="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                                    </span>
                                    <div>
                                        <h2 className="font-semibold text-slate-950">Notificações</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {dashboard.unreadNotifications > 0
                                                ? `Tem ${dashboard.unreadNotifications} notificações por ler.`
                                                : 'Está em dia com todas as notificações.'}
                                        </p>
                                    </div>
                                </div>
                                <NotificationBadge count={dashboard.unreadNotifications} />
                            </CardContent>
                        </Card>
                    </section>
                </div>
            ) : null}
        </ClientLayout>
    );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
    return (
        <div>
            <h2 id={id} className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
    );
}

function QuickAction({ title, description, target, icon, onClick }: { title: string; description: string; target?: string; icon: string; onClick?: () => void }) {
    const content = (
        <>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MiniIcon path={icon} />
            </span>
            <span className="min-w-0 text-left">
                <span className="block font-semibold text-slate-950">{title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
            </span>
        </>
    );
    const classes = 'flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100';

    if (target) {
        return <a className={classes} href={target}>{content}</a>;
    }

    return <button type="button" className={classes} onClick={onClick}>{content}</button>;
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <EmptyState
            title="Não foi possível carregar o painel"
            description={message}
            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
            action={<Button onClick={onRetry}>Tentar novamente</Button>}
        />
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-8" aria-label="A carregar o painel" aria-busy="true">
            <div className="grid gap-4 rounded-3xl bg-brand-100 p-6 sm:p-8">
                <LoadingSkeleton className="h-4 w-28 bg-brand-200" />
                <LoadingSkeleton className="h-9 w-full max-w-sm bg-brand-200" />
                <LoadingSkeleton className="h-5 w-full max-w-xl bg-brand-200" />
                <LoadingSkeleton className="mt-2 h-14 w-full max-w-2xl rounded-2xl bg-white/80" />
            </div>
            <SkeletonSection cards={4} />
            <SkeletonSection cards={8} />
            <SkeletonSection cards={4} />
            <SkeletonSection cards={4} />
        </div>
    );
}

function SkeletonSection({ cards }: { cards: number }) {
    return (
        <section className="grid gap-4">
            <div className="grid gap-2">
                <LoadingSkeleton className="h-6 w-48" />
                <LoadingSkeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: cards }, (_, index) => (
                    <div key={index} className="grid min-h-40 gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card">
                        <div className="flex items-center gap-3">
                            <LoadingSkeleton className="size-11 rounded-xl" />
                            <div className="grid flex-1 gap-2">
                                <LoadingSkeleton className="h-4 w-2/3" />
                                <LoadingSkeleton className="h-3 w-full" />
                            </div>
                        </div>
                        <LoadingSkeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>
        </section>
    );
}
