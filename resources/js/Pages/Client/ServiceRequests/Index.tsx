import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ServiceRequestCard } from '../../../Components/ClientDashboard/ServiceRequestCard';
import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { Button } from '../../../Components/ui/Button';
import { Card, CardContent } from '../../../Components/ui/Card';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ClientLayout } from '../../../Layouts/ClientLayout';
import { api, ApiError } from '../../../lib/api';
import { formatNumber } from '../../../lib/formatters';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import type { PaginatedData, Pagination, ServiceRequest } from '../../../types';

type ServiceRequestsData = PaginatedData<'service_requests', ServiceRequest>;
type ServiceRequestStatusFilter = 'all' | 'published' | 'receiving_proposals' | 'in_progress' | 'completed' | 'cancelled';

const statusTabs: Array<{ label: string; value: ServiceRequestStatusFilter }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Publicados', value: 'published' },
    { label: 'Em andamento', value: 'in_progress' },
    { label: 'Concluídos', value: 'completed' },
    { label: 'Cancelados', value: 'cancelled' },
];

const initialPagination: Pagination = {
    current_page: 1,
    per_page: 15,
    last_page: 1,
    total: 0,
};

const statusQueryMap: Record<Exclude<ServiceRequestStatusFilter, 'all'>, ServiceRequest['status']> = {
    published: 'published',
    receiving_proposals: 'receiving_proposals',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
};

export default function ClientServiceRequestsIndex() {
    const [statusFilter, setStatusFilter] = useState<ServiceRequestStatusFilter>('all');
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadServiceRequests = useCallback(async (signal: AbortSignal, currentStatus: ServiceRequestStatusFilter, currentPage: number) => {
        if (!getAuthToken()) {
            router.visit('/login', { replace: true });
            return;
        }

        if (getStoredAuthUser()?.user_type !== 'client') {
            return;
        }

        setIsLoading(true);
        setError(null);
        setServiceRequests([]);

        try {
            const data = await api.get<ServiceRequestsData>('/client/service-requests', {
                signal,
                query: {
                    status: currentStatus === 'all' ? undefined : statusQueryMap[currentStatus],
                    page: currentPage,
                },
            });

            setServiceRequests(data.service_requests);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os seus pedidos.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadServiceRequests(controller.signal, statusFilter, page);

        return () => controller.abort();
    }, [loadServiceRequests, page, reloadKey, statusFilter]);

    const currentStatusLabel = useMemo(
        () => statusTabs.find((tab) => tab.value === statusFilter)?.label ?? 'Todos',
        [statusFilter],
    );

    function retry(): void {
        setReloadKey((value) => value + 1);
    }

    function changeStatus(nextStatus: ServiceRequestStatusFilter): void {
        setStatusFilter(nextStatus);
        setPage(1);
    }

    const hasServiceRequests = serviceRequests.length > 0;

    return (
        <ClientLayout title="Meus pedidos" description="Gerir e acompanhar todos os seus pedidos de serviço.">
            <Head title="Meus pedidos" />

            <div className="grid gap-6">
                <section className="grid gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-950">Pedidos de serviço</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {isLoading && !hasServiceRequests ? 'A carregar os seus pedidos...' : `${formatNumber(pagination.total)} pedidos ${currentStatusLabel === 'Todos' ? 'encontrados' : currentStatusLabel.toLowerCase()}`}
                            </p>
                        </div>
                        <Button onClick={() => router.visit('/client/service-requests/create')}>Publicar pedido</Button>
                    </div>

                    <Card>
                        <CardContent className="flex flex-wrap gap-2 p-3 sm:p-4">
                            {statusTabs.map((tab) => {
                                const active = statusFilter === tab.value;

                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        aria-pressed={active}
                                        className={[
                                            'inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold transition',
                                            active
                                                ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
                                        ].join(' ')}
                                        onClick={() => changeStatus(tab.value)}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </section>

                {isLoading && !hasServiceRequests ? <ServiceRequestsSkeleton /> : null}

                {!isLoading && error ? (
                    <EmptyState
                        title="Não foi possível carregar os pedidos"
                        description={error}
                        icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                        action={<Button onClick={retry}>Tentar novamente</Button>}
                    />
                ) : null}

                {!error && hasServiceRequests ? (
                    <section aria-label="Lista de pedidos">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {serviceRequests.map((serviceRequest) => <ServiceRequestCard key={serviceRequest.id} serviceRequest={serviceRequest} />)}
                        </div>

                        {pagination.last_page > 1 ? (
                            <nav className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="Paginação">
                                <Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => setPage((current) => current - 1)}>
                                    Anterior
                                </Button>
                                <span className="text-sm text-slate-500">
                                    Página {pagination.current_page} de {pagination.last_page}
                                </span>
                                <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => setPage((current) => current + 1)}>
                                    Seguinte
                                </Button>
                            </nav>
                        ) : null}
                    </section>
                ) : null}

                {!isLoading && !error && !hasServiceRequests ? (
                    <EmptyState
                        title={statusFilter === 'all' ? 'Ainda não tem pedidos' : 'Nenhum pedido encontrado'}
                        description={statusFilter === 'all' ? 'Quando publicar o primeiro pedido, ele aparecerá aqui.' : 'Experimente alterar o filtro ou publicar um novo pedido.'}
                        icon={<MiniIcon path="M6 3h9l3 3v15H6zM9 11h6M9 15h6" />}
                        action={<Link href="/client/service-requests/create" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">Publicar pedido</Link>}
                    />
                ) : null}
            </div>
        </ClientLayout>
    );
}

function ServiceRequestsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="A carregar pedidos" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid min-h-72 gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card">
                    <LoadingSkeleton className="h-4 w-24" />
                    <LoadingSkeleton className="h-6 w-3/4" />
                    <LoadingSkeleton className="h-16 w-full" />
                    <div className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                        <LoadingSkeleton className="h-10 w-full" />
                        <LoadingSkeleton className="h-10 w-full" />
                    </div>
                    <LoadingSkeleton className="mt-auto h-9 w-32" />
                </div>
            ))}
        </div>
    );
}
