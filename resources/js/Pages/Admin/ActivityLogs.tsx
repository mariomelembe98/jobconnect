import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { ActivityLogDetailPanel } from '../../Components/Admin/ActivityLogDetailPanel';
import { ActivityLogFilters, type ActivityLogFiltersState } from '../../Components/Admin/ActivityLogFilters';
import { ActivityLogTable } from '../../Components/Admin/ActivityLogTable';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { api, ApiError } from '../../lib/api';
import { ACTIVITY_ACTION_LABELS } from '../../lib/constants';
import { formatNumber } from '../../lib/formatters';
import type { ActivityLog, Pagination } from '../../types';

interface ActivityLogsResponse {
    activity_logs: ActivityLog[];
    pagination: Pagination;
}

interface ActivityLogDetailResponse {
    activity_log: ActivityLog;
}

const defaultFilters: ActivityLogFiltersState = {
    q: '',
    user_id: '',
    action: '',
    module: '',
    date_from: '',
    date_to: '',
};

const initialPagination: Pagination = { current_page: 1, per_page: 25, last_page: 1, total: 0 };

const criticalActions = ['user_login', 'user_logout', 'user_blocked', 'user_suspended', 'service_request_created', 'proposal_submitted', 'proposal_accepted', 'contract_completed', 'contract_cancelled', 'report_created', 'dispute_created', 'verification_approved', 'verification_rejected'] as const;

export default function AdminActivityLogsPage() {
    const [filters, setFilters] = useState<ActivityLogFiltersState>({ ...defaultFilters });
    const [appliedFilters, setAppliedFilters] = useState<ActivityLogFiltersState>({ ...defaultFilters });
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const loadActivityLogs = useCallback(async (signal: AbortSignal, currentFilters: ActivityLogFiltersState, currentPage: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<ActivityLogsResponse>('/admin/activity-logs', {
                signal,
                query: {
                    q: currentFilters.q,
                    user_id: currentFilters.user_id,
                    action: currentFilters.action,
                    module: currentFilters.module,
                    date_from: currentFilters.date_from,
                    date_to: currentFilters.date_to,
                    page: currentPage,
                },
            });

            if (signal.aborted) {
                return;
            }

            setActivityLogs(data.activity_logs);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os registos de actividade.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    const loadDetail = useCallback(async (signal: AbortSignal, activityLogId: number) => {
        setIsDetailLoading(true);
        setDetailError(null);

        try {
            const data = await api.get<ActivityLogDetailResponse>(`/admin/activity-logs/${activityLogId}`, { signal });

            if (!signal.aborted) {
                setSelectedLog(data.activity_log);
            }
        } catch (caughtError) {
            if (!signal.aborted) {
                setDetailError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o detalhe do registo.');
            }
        } finally {
            if (!signal.aborted) {
                setIsDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        void loadActivityLogs(controller.signal, appliedFilters, page);

        return () => controller.abort();
    }, [appliedFilters, loadActivityLogs, page, reloadKey]);

    useEffect(() => {
        if (!detailOpen || !selectedId) {
            return;
        }

        const controller = new AbortController();

        void loadDetail(controller.signal, selectedId);

        return () => controller.abort();
    }, [detailOpen, loadDetail, selectedId, reloadKey]);

    useEffect(() => {
        if (detailOpen && selectedId !== null && !activityLogs.some((log) => log.id === selectedId)) {
            setDetailOpen(false);
            setSelectedId(null);
            setSelectedLog(null);
            setDetailError(null);
        }
    }, [activityLogs, detailOpen, selectedId]);

    function applyFilters(): void {
        setPage(1);
        setDetailOpen(false);
        setSelectedId(null);
        setSelectedLog(null);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...defaultFilters });
        setAppliedFilters({ ...defaultFilters });
        setPage(1);
        setDetailOpen(false);
        setSelectedId(null);
        setSelectedLog(null);
    }

    function refresh(): void {
        setReloadKey((value) => value + 1);
    }

    function selectLog(log: ActivityLog): void {
        setSelectedId(log.id);
        setSelectedLog(log);
        setDetailError(null);
        setDetailOpen(true);
    }

    return (
        <AdminLayout title="Registos de actividade" description="Monitorize acções críticas e consulte metadados de auditoria.">
            <Head title="Administração · Registos de actividade" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-700 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-300">Auditoria e rastreabilidade</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Registos de actividade</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Acompanhe acessos, moderações e operações críticas da plataforma em ordem cronológica inversa.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-slate-300">Total</p>
                        <p className="mt-1 text-2xl font-bold">{formatNumber(pagination.total)}</p>
                    </div>
                </div>
            </section>

            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {criticalActions.map((action) => (
                    <div key={action} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                                <MiniIcon path="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acção monitorizada</p>
                                <h2 className="mt-1 font-semibold text-slate-950">{ACTIVITY_ACTION_LABELS[action] ?? action}</h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ActivityLogFilters
                filters={filters}
                onChange={setFilters}
                onApply={applyFilters}
                onReset={resetFilters}
                onRefresh={refresh}
                isLoading={isLoading}
                total={pagination.total}
            />

            {error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                    <div className="flex items-center justify-between gap-4">
                        <span>{error}</span>
                        <Button variant="outline" onClick={refresh}>Tentar novamente</Button>
                    </div>
                </div>
            ) : null}

            <div className="mt-6">
                {isLoading && activityLogs.length === 0 ? (
                    <div className="grid gap-4">
                        <LoadingSkeleton className="h-20 w-full rounded-2xl" />
                        <LoadingSkeleton className="h-20 w-full rounded-2xl" />
                        <LoadingSkeleton className="h-20 w-full rounded-2xl" />
                    </div>
                ) : activityLogs.length > 0 ? (
                    <ActivityLogTable logs={activityLogs} selectedId={selectedId} onSelect={selectLog} />
                ) : (
                    <EmptyState
                        title="Nenhum registo encontrado"
                        description="Experimente limpar os filtros ou alterar o intervalo de datas."
                        action={<Button variant="outline" onClick={resetFilters}>Limpar filtros</Button>}
                    />
                )}
            </div>

            {pagination.last_page > 1 ? (
                <nav className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="Paginação">
                    <Button variant="outline" size="sm" disabled={pagination.current_page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                    <span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span>
                    <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page || isLoading} onClick={() => setPage((current) => current + 1)}>Seguinte</Button>
                </nav>
            ) : null}

            <ActivityLogDetailPanel
                open={detailOpen}
                log={selectedLog}
                isLoading={isDetailLoading}
                error={detailError}
                onClose={() => setDetailOpen(false)}
                onRetry={refresh}
            />
        </AdminLayout>
    );
}
