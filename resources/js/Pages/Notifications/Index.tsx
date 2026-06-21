import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { DeleteNotificationModal } from '../../Components/Notifications/DeleteNotificationModal';
import { NotificationFilterTabs, type NotificationFilter } from '../../Components/Notifications/NotificationFilterTabs';
import { NotificationListItem } from '../../Components/Notifications/NotificationListItem';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { NotificationsLayout } from '../../Layouts/NotificationsLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';
import type { Notification, NotificationType, PaginatedData, Pagination } from '../../types';

type NotificationsData = PaginatedData<'notifications', Notification>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

const filterTypes: Partial<Record<NotificationFilter, NotificationType[]>> = {
    messages: ['new_message'],
    proposals: ['proposal_received', 'proposal_accepted', 'proposal_rejected'],
    contracts: ['contract_created', 'contract_completed', 'contract_cancelled'],
    verification: ['verification_approved', 'verification_rejected'],
};

export default function NotificationsIndex() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [actionKey, setActionKey] = useState<string | null>(null);
    const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadNotifications = useCallback(async (signal: AbortSignal, filter: NotificationFilter, currentPage: number) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchNotificationGroup(signal, filter, currentPage);
            setNotifications(data.notifications);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as notificações.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadNotifications(controller.signal, activeFilter, page);
        return () => controller.abort();
    }, [activeFilter, loadNotifications, page, reloadKey]);

    function changeFilter(filter: NotificationFilter): void {
        setActiveFilter(filter);
        setPage(1);
        setFeedback(null);
    }

    async function markAsRead(notification: Notification): Promise<void> {
        setActionKey(`read-${notification.id}`);
        setFeedback(null);

        try {
            await api.post(`/notifications/${notification.id}/read`);
            setFeedback({ type: 'success', message: 'Notificação marcada como lida.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível marcar a notificação como lida.' });
        } finally {
            setActionKey(null);
        }
    }

    async function markAllAsRead(): Promise<void> {
        setActionKey('read-all');
        setFeedback(null);

        try {
            await api.post('/notifications/read-all');
            setFeedback({ type: 'success', message: 'Todas as notificações foram marcadas como lidas.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível marcar todas as notificações como lidas.' });
        } finally {
            setActionKey(null);
        }
    }

    async function deleteNotification(): Promise<void> {
        if (!notificationToDelete) return;

        setActionKey(`delete-${notificationToDelete.id}`);
        setFeedback(null);

        try {
            await api.delete(`/notifications/${notificationToDelete.id}`);
            setNotificationToDelete(null);
            setFeedback({ type: 'success', message: 'Notificação eliminada com sucesso.' });
            if (notifications.length === 1 && page > 1) setPage((current) => current - 1);
            else setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setNotificationToDelete(null);
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível eliminar a notificação.' });
        } finally {
            setActionKey(null);
        }
    }

    return (
        <NotificationsLayout title="Notificações" description="Consulte as novidades e atualizações da sua conta.">
            <Head title="Notificações" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-brand-100">Centro de notificações</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Mantenha-se atualizado</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Mensagens, propostas, contratos e atualizações importantes reunidas num só lugar.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm"><p className="text-xs text-brand-100">Neste filtro</p><p className="mt-1 text-2xl font-bold">{formatNumber(pagination.total)}</p></div>
                        <Button variant="outline" className="border-white bg-white text-brand-700 hover:bg-brand-50" isLoading={actionKey === 'read-all'} disabled={actionKey !== null && actionKey !== 'read-all'} onClick={markAllAsRead}>Marcar todas como lidas</Button>
                    </div>
                </div>
            </section>

            {feedback ? <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div> : null}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 shadow-card sm:px-6"><NotificationFilterTabs activeTab={activeFilter} onChange={changeFilter} /></div>

            <div className="mt-6">
                {isLoading && notifications.length === 0 ? <NotificationsSkeleton /> : null}

                {!isLoading && error ? <EmptyState title="Não foi possível carregar as notificações" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}

                {!error && (!isLoading || notifications.length > 0) ? (
                    <div className="grid gap-5">
                        {isLoading ? <p className="text-right text-sm text-brand-600">A atualizar...</p> : null}
                        {notifications.length > 0 ? (
                            <div className="grid gap-3">
                                {notifications.map((notification) => (
                                    <NotificationListItem
                                        key={notification.id}
                                        notification={notification}
                                        isMarkingRead={actionKey === `read-${notification.id}`}
                                        isDeleting={actionKey === `delete-${notification.id}`}
                                        onMarkRead={() => markAsRead(notification)}
                                        onDelete={() => setNotificationToDelete(notification)}
                                    />
                                ))}
                            </div>
                        ) : <EmptyState title="Sem notificações neste filtro" description="Quando existirem novas atualizações, serão apresentadas aqui." />}

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

            <DeleteNotificationModal notification={notificationToDelete} isLoading={notificationToDelete !== null && actionKey === `delete-${notificationToDelete.id}`} onConfirm={deleteNotification} onClose={() => setNotificationToDelete(null)} />
        </NotificationsLayout>
    );
}

async function fetchNotificationGroup(signal: AbortSignal, filter: NotificationFilter, page: number): Promise<NotificationsData> {
    if (filter === 'all' || filter === 'unread') {
        return api.get<NotificationsData>('/notifications', { signal, query: { page, read: filter === 'unread' ? false : undefined } });
    }

    const types = filterTypes[filter] ?? [];
    const results = await Promise.all(types.map((type) => api.get<NotificationsData>('/notifications', { signal, query: { page, type } })));
    const notifications = results.flatMap((result) => result.notifications).sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));

    return {
        notifications,
        pagination: {
            current_page: page,
            per_page: results.reduce((total, result) => total + result.pagination.per_page, 0),
            last_page: Math.max(1, ...results.map((result) => result.pagination.last_page)),
            total: results.reduce((total, result) => total + result.pagination.total, 0),
        },
    };
}

function NotificationsSkeleton() {
    return <div className="grid gap-3" aria-label="A carregar notificações" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex min-h-44 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><LoadingSkeleton className="size-11 shrink-0 rounded-xl" /><div className="grid flex-1 gap-3"><LoadingSkeleton className="h-5 w-2/3" /><LoadingSkeleton className="h-12 w-full" /><LoadingSkeleton className="h-4 w-44" /><LoadingSkeleton className="mt-auto h-9 w-36" /></div></div>)}</div>;
}
