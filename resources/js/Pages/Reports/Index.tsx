import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ReportCreationModal } from '../../Components/Reports/ReportCreationModal';
import { ReportDetailPanel } from '../../Components/Reports/ReportDetailPanel';
import { ReportHistoryCard } from '../../Components/Reports/ReportHistoryCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { CasesLayout } from '../../Layouts/CasesLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';
import type { PaginatedData, Pagination, Report } from '../../types';

type ReportsData = PaginatedData<'reports', Report>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ReportsIndex() {
    const [reports, setReports] = useState<Report[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const loadReports = useCallback(async (signal: AbortSignal, currentPage: number) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<ReportsData>('/reports/me', { signal, query: { page: currentPage } });
            setReports(data.reports);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as denúncias.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    const loadReportDetail = useCallback(async (signal: AbortSignal, reportId: number) => {
        if (!getAuthToken()) return;

        setDetailLoading(true);
        setDetailError(null);

        try {
            const data = await api.get<{ report: Report }>(`/reports/${reportId}`, { signal });
            if (!signal.aborted) {
                setSelectedReport(data.report);
            }
        } catch (caughtError) {
            if (!signal.aborted) {
                setDetailError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os detalhes da denúncia.');
            }
        } finally {
            if (!signal.aborted) {
                setDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadReports(controller.signal, page);
        return () => controller.abort();
    }, [loadReports, page, reloadKey]);

    useEffect(() => {
        if (reports.length === 0) {
            setSelectedReport(null);
            return;
        }

        if (!selectedReport || !reports.some((report) => report.id === selectedReport.id)) {
            setSelectedReport(reports[0]);
        }
    }, [reports, selectedReport]);

    useEffect(() => {
        if (!selectedReport) {
            setDetailError(null);
            return;
        }

        const controller = new AbortController();
        void loadReportDetail(controller.signal, selectedReport.id);
        return () => controller.abort();
    }, [loadReportDetail, selectedReport?.id, reloadKey]);

    const summary = useMemo(() => ({
        total: pagination.total,
        pending: reports.filter((report) => report.status === 'pending').length,
        reviewing: reports.filter((report) => report.status === 'reviewing').length,
    }), [pagination.total, reports]);

    function refresh(): void {
        setReloadKey((value) => value + 1);
    }

    function handleCreated(report: Report): void {
        setSelectedReport(report);
        setPage(1);
        refresh();
        setFeedback({ type: 'success', message: 'Denúncia enviada com sucesso.' });
    }

    return (
        <CasesLayout title="Denúncias" description="Consulte o histórico das denúncias enviadas pela sua conta.">
            <Head title="Denúncias" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-brand-100">Histórico e acompanhamento</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">As suas denúncias</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Veja o estado das denúncias abertas e acompanhe as respostas da equipa.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Stat label="Total" value={summary.total} />
                        <Stat label="Pendentes" value={summary.pending} />
                        <Stat label="Em análise" value={summary.reviewing} />
                        <Button variant="outline" className="border-white bg-white text-brand-700 hover:bg-brand-50" onClick={() => setCreateOpen(true)}>Nova denúncia</Button>
                    </div>
                </div>
            </section>

            {feedback ? <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div> : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="grid gap-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">{formatNumber(pagination.total)} denúncias encontradas</p>
                        <Button variant="outline" size="sm" onClick={refresh} isLoading={isLoading}>Atualizar</Button>
                    </div>

                    {isLoading && reports.length === 0 ? <ReportsSkeleton /> : null}

                    {!isLoading && error ? (
                        <EmptyState
                            title="Não foi possível carregar as denúncias"
                            description={error}
                            action={<Button onClick={refresh}>Tentar novamente</Button>}
                        />
                    ) : null}

                    {!error && (!isLoading || reports.length > 0) ? (
                        <div className="grid gap-4">
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <ReportHistoryCard key={report.id} report={report} active={selectedReport?.id === report.id} onSelect={() => setSelectedReport(report)} />
                                ))
                            ) : (
                                <EmptyState title="Ainda não existem denúncias" description="As denúncias que enviar aparecerão aqui com o estado actualizado." />
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

                <div className="grid content-start gap-5">
                    {isLoading && reports.length === 0 ? <ReportDetailSkeleton /> : null}
                    {detailLoading && selectedReport ? <p className="text-right text-sm text-brand-600">A actualizar detalhes...</p> : null}
                    {detailError ? <EmptyState title="Não foi possível carregar os detalhes" description={detailError} action={<Button onClick={refresh}>Tentar novamente</Button>} /> : <ReportDetailPanel report={selectedReport} />}
                </div>
            </div>

            <ReportCreationModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={handleCreated}
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

function ReportsSkeleton() {
    return (
        <div className="grid gap-4" aria-label="A carregar denúncias" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <LoadingSkeleton className="h-5 w-36" />
                    <LoadingSkeleton className="h-4 w-28" />
                    <LoadingSkeleton className="h-20 w-full" />
                </div>
            ))}
        </div>
    );
}

function ReportDetailSkeleton() {
    return (
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card" aria-label="A carregar detalhes da denúncia" aria-busy="true">
            <LoadingSkeleton className="h-5 w-40" />
            <LoadingSkeleton className="h-8 w-56" />
            <LoadingSkeleton className="h-28 w-full" />
            <LoadingSkeleton className="h-44 w-full" />
        </div>
    );
}
