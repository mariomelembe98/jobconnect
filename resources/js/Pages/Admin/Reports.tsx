import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { AdminActionModal } from '../../Components/Admin/AdminActionModal';
import { AdminDataTable } from '../../Components/Admin/AdminDataTable';
import { AdminFilterBar } from '../../Components/Admin/AdminFilterBar';
import { AdminStatusBadge } from '../../Components/Admin/AdminStatusBadge';
import { ReportDetailPanel, type AdminReportItem } from '../../Components/Admin/ReportDetailPanel';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { Select } from '../../Components/ui/Select';
import { Textarea } from '../../Components/ui/Textarea';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/formatters';
import type { Pagination } from '../../types';

interface AdminReportsResponse {
    reports: AdminReportItem[];
    pagination: Pagination;
}

interface AdminReportDetailResponse {
    report: AdminReportItem;
}

interface ReportFilters {
    status: string;
    report_type: string;
}

const defaultFilters: ReportFilters = {
    status: '',
    report_type: '',
};

const initialPagination: Pagination = { current_page: 1, per_page: 20, last_page: 1, total: 0 };

export default function AdminReportsPage() {
    const [filters, setFilters] = useState<ReportFilters>({ ...defaultFilters });
    const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({ ...defaultFilters });
    const [reports, setReports] = useState<AdminReportItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [openResolveModal, setOpenResolveModal] = useState(false);
    const [openDismissModal, setOpenDismissModal] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    const loadReports = useCallback(async (signal: AbortSignal, currentFilters: ReportFilters, currentPage: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<AdminReportsResponse>('/admin/reports', {
                signal,
                query: {
                    status: currentFilters.status,
                    report_type: currentFilters.report_type,
                    page: currentPage,
                },
            });

            if (signal.aborted) {
                return;
            }

            setReports(data.reports);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as denúncias.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    const loadReportDetail = useCallback(async (signal: AbortSignal, reportId: number) => {
        setIsDetailLoading(true);
        setDetailError(null);

        try {
            const data = await api.get<AdminReportDetailResponse>(`/admin/reports/${reportId}`, { signal });
            if (!signal.aborted) {
                setSelectedReport(data.report);
            }
        } catch (caughtError) {
            if (!signal.aborted) {
                setDetailError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o detalhe da denúncia.');
            }
        } finally {
            if (!signal.aborted) {
                setIsDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadReports(controller.signal, appliedFilters, page);

        return () => controller.abort();
    }, [appliedFilters, loadReports, page, reloadKey]);

    useEffect(() => {
        if (reports.length === 0) {
            setSelectedId(null);
            setSelectedReport(null);
            return;
        }

        if (!selectedId || !reports.some((report) => report.id === selectedId)) {
            setSelectedId(reports[0].id);
        }
    }, [reports, selectedId]);

    useEffect(() => {
        if (!selectedId) {
            return;
        }

        const controller = new AbortController();
        void loadReportDetail(controller.signal, selectedId);

        return () => controller.abort();
    }, [loadReportDetail, reloadKey, selectedId]);

    function applyFilters(): void {
        setPage(1);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...defaultFilters });
        setAppliedFilters({ ...defaultFilters });
        setPage(1);
    }

    async function reviewReport(): Promise<void> {
        if (!selectedReport) {
            return;
        }

        setIsReviewing(true);
        setFeedback(null);

        try {
            await api.post(`/admin/reports/${selectedReport.id}/review`);
            setFeedback('Denúncia marcada para análise com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível actualizar a denúncia.');
        } finally {
            setIsReviewing(false);
        }
    }

    async function resolveReport(): Promise<void> {
        if (!selectedReport) {
            return;
        }

        setIsResolving(true);
        setFeedback(null);

        try {
            await api.post(`/admin/reports/${selectedReport.id}/resolve`, { resolution_note: resolutionNote.trim() });
            setFeedback('Denúncia resolvida com sucesso.');
            setResolutionNote('');
            setOpenResolveModal(false);
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível resolver a denúncia.');
        } finally {
            setIsResolving(false);
        }
    }

    async function dismissReport(): Promise<void> {
        if (!selectedReport) {
            return;
        }

        setIsDismissing(true);
        setFeedback(null);

        try {
            await api.post(`/admin/reports/${selectedReport.id}/dismiss`, { resolution_note: resolutionNote.trim() });
            setFeedback('Denúncia descartada com sucesso.');
            setResolutionNote('');
            setOpenDismissModal(false);
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível descartar a denúncia.');
        } finally {
            setIsDismissing(false);
        }
    }

    return (
        <AdminLayout title="Denúncias" description="Modere conteúdos e contas denunciadas pela comunidade.">
            <Head title="Administração · Denúncias" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-700 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-300">Moderação de denúncias</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Denúncias administrativas</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Revise denúncias de utilizadores, pedidos, contratos, mensagens e avaliações.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-slate-300">Total</p>
                        <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
                    </div>
                </div>
            </section>

            {feedback ? <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700" role="status">{feedback}</div> : null}

            <AdminFilterBar
                title="Filtros de denúncias"
                description="Restrinja por estado ou tipo de denúncia."
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
                        { label: 'Em análise', value: 'reviewing' },
                        { label: 'Resolvida', value: 'resolved' },
                        { label: 'Descartada', value: 'dismissed' },
                    ]}
                    placeholder="Todos os estados"
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                />
                <Select
                    label="Tipo"
                    value={filters.report_type}
                    options={[
                        { label: 'Utilizador', value: 'user' },
                        { label: 'Pedido', value: 'service_request' },
                        { label: 'Contrato', value: 'contract' },
                        { label: 'Mensagem', value: 'message' },
                        { label: 'Avaliação', value: 'review' },
                    ]}
                    placeholder="Todos os tipos"
                    onChange={(event) => setFilters((current) => ({ ...current, report_type: event.target.value }))}
                />
            </AdminFilterBar>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="grid gap-5">
                    {isLoading ? <ReportsSkeleton /> : null}

                    {!isLoading && error ? (
                        <EmptyState
                            title="Não foi possível carregar as denúncias"
                            description={error}
                            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                            action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                        />
                    ) : null}

                    {!error && (!isLoading || reports.length > 0) ? (
                        <div className="grid gap-5">
                            <AdminDataTable headers={['Tipo', 'Motivo', 'Estado', 'Denunciante', 'Alvo', 'Criado em']}>
                                {reports.length > 0 ? reports.map((report) => {
                                    const active = selectedId === report.id;

                                    return (
                                        <tr
                                            key={report.id}
                                            className={`cursor-pointer border-b border-slate-100 transition hover:bg-brand-50 ${active ? 'bg-brand-50' : 'bg-white'}`}
                                            onClick={() => setSelectedId(report.id)}
                                        >
                                            <td className="px-4 py-4 text-sm text-slate-600">{reportTypeLabel(report.report_type)}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{reasonLabel(report.reason)}</td>
                                            <td className="px-4 py-4"><AdminStatusBadge kind="report" value={report.status} /></td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{report.reporter?.name ?? '—'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{report.reported_user?.name ?? report.contract_id?.toString() ?? '—'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{report.created_at ? formatDateTime(report.created_at) : '—'}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                                            Nenhuma denúncia encontrada.
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
                        <ReportDetailPanel
                            report={selectedReport}
                            onReview={reviewReport}
                            onResolve={() => {
                                setResolutionNote('');
                                setOpenResolveModal(true);
                                setOpenDismissModal(false);
                            }}
                            onDismiss={() => {
                                setResolutionNote('');
                                setOpenDismissModal(true);
                                setOpenResolveModal(false);
                            }}
                        />
                    ) : null}
                </div>
            </div>

            <AdminActionModal
                open={openResolveModal}
                title="Resolver denúncia?"
                description="Indique a nota de resolução que ficará registada na denúncia."
                confirmLabel="Resolver"
                isLoading={isResolving}
                onConfirm={resolveReport}
                onClose={() => setOpenResolveModal(false)}
            >
                <Textarea
                    label="Nota de resolução"
                    value={resolutionNote}
                    rows={5}
                    placeholder="Descreva como a denúncia foi tratada..."
                    onChange={(event) => setResolutionNote(event.target.value)}
                />
            </AdminActionModal>

            <AdminActionModal
                open={openDismissModal}
                title="Descartar denúncia?"
                description="Explique o motivo do descarte. A nota é obrigatória."
                confirmLabel="Descartar"
                destructive
                isLoading={isDismissing}
                onConfirm={dismissReport}
                onClose={() => setOpenDismissModal(false)}
            >
                <Textarea
                    label="Nota de resolução"
                    value={resolutionNote}
                    rows={5}
                    placeholder="Explique por que a denúncia foi descartada..."
                    onChange={(event) => setResolutionNote(event.target.value)}
                />
            </AdminActionModal>
        </AdminLayout>
    );
}

function ReportsSkeleton() {
    return (
        <div className="grid gap-4" aria-label="A carregar denúncias" aria-busy="true">
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
            <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}

function reportTypeLabel(type: AdminReportItem['report_type']): string {
    return {
        user: 'Utilizador',
        service_request: 'Pedido',
        contract: 'Contrato',
        message: 'Mensagem',
        review: 'Avaliação',
    }[type];
}

function reasonLabel(reason: string): string {
    return {
        fraud: 'Fraude',
        abuse: 'Abuso',
        fake_profile: 'Perfil falso',
        inappropriate_content: 'Conteúdo impróprio',
        service_not_delivered: 'Serviço não prestado',
        spam: 'Spam',
        other: 'Outro',
    }[reason] ?? reason;
}
