import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { AdminActionModal } from '../../Components/Admin/AdminActionModal';
import { AdminDataTable } from '../../Components/Admin/AdminDataTable';
import { AdminFilterBar } from '../../Components/Admin/AdminFilterBar';
import { AdminStatusBadge } from '../../Components/Admin/AdminStatusBadge';
import { VerificationDetailPanel, type AdminVerificationProfile } from '../../Components/Admin/VerificationDetailPanel';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { Select } from '../../Components/ui/Select';
import { Textarea } from '../../Components/ui/Textarea';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { api, ApiError } from '../../lib/api';
import { API_BASE_URL } from '../../lib/constants';
import { getAuthToken } from '../../lib/auth';
import { formatDateTime } from '../../lib/formatters';
import type { Pagination, ProfessionalDocument } from '../../types';

interface AdminVerificationsResponse {
    verifications: AdminVerificationProfile[];
    pagination: Pagination;
}

interface AdminVerificationDetailResponse {
    verification: AdminVerificationProfile;
}

interface VerificationFilters {
    status: string;
}

const defaultFilters: VerificationFilters = {
    status: '',
};

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function AdminVerificationsPage() {
    const [filters, setFilters] = useState<VerificationFilters>({ ...defaultFilters });
    const [appliedFilters, setAppliedFilters] = useState<VerificationFilters>({ ...defaultFilters });
    const [verifications, setVerifications] = useState<AdminVerificationProfile[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedVerification, setSelectedVerification] = useState<AdminVerificationProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [rejectReason, setRejectReason] = useState('');
    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [downloadingDocumentId, setDownloadingDocumentId] = useState<number | null>(null);

    const loadVerifications = useCallback(async (signal: AbortSignal, currentFilters: VerificationFilters, currentPage: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<AdminVerificationsResponse>('/admin/verifications', {
                signal,
                query: {
                    status: currentFilters.status,
                    page: currentPage,
                },
            });

            if (signal.aborted) {
                return;
            }

            setVerifications(data.verifications);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as verificações.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    const loadVerificationDetail = useCallback(async (signal: AbortSignal, verificationId: number) => {
        setIsDetailLoading(true);
        setDetailError(null);

        try {
            const data = await api.get<AdminVerificationDetailResponse>(`/admin/verifications/${verificationId}`, { signal });
            if (!signal.aborted) {
                setSelectedVerification(data.verification);
            }
        } catch (caughtError) {
            if (!signal.aborted) {
                setDetailError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os detalhes da verificação.');
            }
        } finally {
            if (!signal.aborted) {
                setIsDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadVerifications(controller.signal, appliedFilters, page);

        return () => controller.abort();
    }, [appliedFilters, loadVerifications, page, reloadKey]);

    useEffect(() => {
        if (verifications.length === 0) {
            setSelectedId(null);
            setSelectedVerification(null);
            return;
        }

        if (!selectedId || !verifications.some((verification) => verification.id === selectedId)) {
            setSelectedId(verifications[0].id);
        }
    }, [selectedId, verifications]);

    useEffect(() => {
        if (!selectedId) {
            return;
        }

        const controller = new AbortController();
        void loadVerificationDetail(controller.signal, selectedId);

        return () => controller.abort();
    }, [loadVerificationDetail, reloadKey, selectedId]);

    function applyFilters(): void {
        setPage(1);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...defaultFilters });
        setAppliedFilters({ ...defaultFilters });
        setPage(1);
    }

    async function approveVerification(): Promise<void> {
        if (!selectedVerification) {
            return;
        }

        setIsApproving(true);
        setFeedback(null);

        try {
            await api.post(`/admin/verifications/${selectedVerification.id}/approve`);
            setFeedback('Verificação aprovada com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível aprovar a verificação.');
        } finally {
            setIsApproving(false);
        }
    }

    async function rejectVerification(): Promise<void> {
        if (!selectedVerification) {
            return;
        }

        setIsRejecting(true);
        setFeedback(null);

        try {
            await api.post(`/admin/verifications/${selectedVerification.id}/reject`, {
                reason: rejectReason.trim(),
            });
            setFeedback('Verificação rejeitada com sucesso.');
            setOpenRejectModal(false);
            setRejectReason('');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível rejeitar a verificação.');
        } finally {
            setIsRejecting(false);
        }
    }

    async function downloadDocument(file: ProfessionalDocument): Promise<void> {
        const token = getAuthToken();

        if (!token) {
            router.visit('/login');
            return;
        }

        setDownloadingDocumentId(file.id);

        try {
            const response = await fetch(`${API_BASE_URL}/professional/documents/${file.id}/download`, {
                headers: {
                    Accept: 'application/json, application/octet-stream',
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get('content-type') ?? '';

            if (!response.ok) {
                if (contentType.includes('application/json')) {
                    const payload = await response.json() as { message?: string; errors?: Record<string, string[]> };
                    throw new ApiError(payload.message ?? 'Não foi possível descarregar o documento.', response.status, payload.errors ?? {});
                }

                throw new ApiError('Não foi possível descarregar o documento.', response.status);
            }

            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = objectUrl;
            link.download = file.file_name;
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível descarregar o documento.');
        } finally {
            setDownloadingDocumentId(null);
        }
    }

    return (
        <AdminLayout title="Verificações" description="Analise documentos e aprove perfis profissionais.">
            <Head title="Administração · Verificações" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-blue-100">Validação de perfis</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Profissionais em verificação</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Revise documentos privados, descarregue com segurança e marque perfis como aprovados ou rejeitados.</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-blue-100">Total</p>
                        <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
                    </div>
                </div>
            </section>

            {feedback ? <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700" role="status">{feedback}</div> : null}

            <AdminFilterBar
                title="Filtros de verificação"
                description="Filtre por estado do processo e acompanhe os perfis pendentes."
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
                        { label: 'Em análise', value: 'under_review' },
                        { label: 'Aprovado', value: 'approved' },
                        { label: 'Rejeitado', value: 'rejected' },
                        { label: 'Expirado', value: 'expired' },
                    ]}
                    placeholder="Todos os estados"
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                />
            </AdminFilterBar>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="grid gap-5">
                    {isLoading ? <SkeletonList /> : null}

                    {!isLoading && error ? (
                        <EmptyState
                            title="Não foi possível carregar as verificações"
                            description={error}
                            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                            action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                        />
                    ) : null}

                    {!error && (!isLoading || verifications.length > 0) ? (
                        <div className="grid gap-5">
                            <AdminDataTable headers={['Profissional', 'Estado', 'Documentos', 'Pendentes', 'Actualizado em']}>
                                {verifications.length > 0 ? verifications.map((verification) => {
                                    const active = selectedId === verification.id;

                                    return (
                                        <tr
                                            key={verification.id}
                                            className={`cursor-pointer border-b border-slate-100 transition hover:bg-brand-50 ${active ? 'bg-brand-50' : 'bg-white'}`}
                                            onClick={() => setSelectedId(verification.id)}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="grid gap-1">
                                                    <span className="font-semibold text-slate-950">{verification.user?.name ?? `Profissional #${verification.id}`}</span>
                                                    <span className="text-xs text-slate-500">{verification.user?.email ?? 'Sem email'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4"><AdminStatusBadge kind="verification" value={verification.verification_status} /></td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{verification.documents_count ?? 0}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{verification.pending_documents_count ?? 0}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{verification.updated_at ? formatDateTime(verification.updated_at) : '—'}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                                            Nenhuma verificação encontrada.
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
                        <VerificationDetailPanel
                            verification={selectedVerification}
                            isApproving={isApproving}
                            isRejecting={isRejecting}
                            downloadingDocumentId={downloadingDocumentId}
                            onApprove={approveVerification}
                            onReject={() => setOpenRejectModal(true)}
                            onDownloadDocument={(document) => void downloadDocument(document)}
                        />
                    ) : null}
                </div>
            </div>

            <AdminActionModal
                open={openRejectModal}
                title="Rejeitar verificação?"
                description="Explique o motivo da rejeição. O texto será enviado no registo interno da verificação."
                confirmLabel="Rejeitar"
                destructive
                isLoading={isRejecting}
                onConfirm={rejectVerification}
                onClose={() => setOpenRejectModal(false)}
            >
                <Textarea
                    label="Motivo"
                    value={rejectReason}
                    rows={5}
                    placeholder="Escreva o motivo da rejeição..."
                    onChange={(event) => setRejectReason(event.target.value)}
                />
            </AdminActionModal>
        </AdminLayout>
    );
}

function SkeletonList() {
    return (
        <div className="grid gap-4" aria-label="A carregar verificações" aria-busy="true">
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
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}
