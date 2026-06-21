import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { AdminActionModal } from '../../Components/Admin/AdminActionModal';
import { AdminDataTable } from '../../Components/Admin/AdminDataTable';
import { AdminFilterBar } from '../../Components/Admin/AdminFilterBar';
import { AdminStatusBadge } from '../../Components/Admin/AdminStatusBadge';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/formatters';
import type { Pagination, ProfessionalProfile, User } from '../../types';
import { Select } from '../../Components/ui/Select';
import { Textarea } from '../../Components/ui/Textarea';

interface AdminUserItem extends User {
    roles?: string[];
    created_at?: string;
    updated_at?: string;
    email_verified_at?: string | null;
    phone_verified_at?: string | null;
    last_login_at?: string | null;
    location?: {
        province: string | null;
        city: string | null;
        address: string | null;
        latitude: string | null;
        longitude: string | null;
    };
    professional_profile?: ProfessionalProfile | null;
}

interface AdminUsersResponse {
    users: AdminUserItem[];
    pagination: Pagination;
}

interface AdminUserDetailResponse {
    user: AdminUserItem;
}

interface UserFilters {
    user_type: string;
    status: string;
    q: string;
}

const defaultFilters: UserFilters = {
    user_type: '',
    status: '',
    q: '',
};

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function AdminUsersPage() {
    const [filters, setFilters] = useState<UserFilters>({ ...defaultFilters });
    const [appliedFilters, setAppliedFilters] = useState<UserFilters>({ ...defaultFilters });
    const [users, setUsers] = useState<AdminUserItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [modal, setModal] = useState<'suspend' | 'reactivate' | 'block' | null>(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadUsers = useCallback(async (signal: AbortSignal, currentFilters: UserFilters, currentPage: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<AdminUsersResponse>('/admin/users', {
                signal,
                query: {
                    user_type: currentFilters.user_type,
                    status: currentFilters.status,
                    q: currentFilters.q,
                    page: currentPage,
                },
            });

            if (signal.aborted) {
                return;
            }

            setUsers(data.users);
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os utilizadores.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, []);

    const loadUserDetail = useCallback(async (signal: AbortSignal, userId: number) => {
        setIsDetailLoading(true);
        setDetailError(null);

        try {
            const data = await api.get<AdminUserDetailResponse>(`/admin/users/${userId}`, { signal });
            if (!signal.aborted) {
                setSelectedUser(data.user);
            }
        } catch (caughtError) {
            if (!signal.aborted) {
                setDetailError(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o detalhe do utilizador.');
            }
        } finally {
            if (!signal.aborted) {
                setIsDetailLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadUsers(controller.signal, appliedFilters, page);

        return () => controller.abort();
    }, [appliedFilters, loadUsers, page, reloadKey]);

    useEffect(() => {
        if (users.length === 0) {
            setSelectedUserId(null);
            setSelectedUser(null);
            return;
        }

        if (!selectedUserId || !users.some((user) => user.id === selectedUserId)) {
            setSelectedUserId(users[0].id);
        }
    }, [selectedUserId, users]);

    useEffect(() => {
        if (!selectedUserId) {
            return;
        }

        const controller = new AbortController();
        void loadUserDetail(controller.signal, selectedUserId);

        return () => controller.abort();
    }, [loadUserDetail, reloadKey, selectedUserId]);

    const selectedUserLabel = useMemo(() => selectedUser?.name ?? 'Utilizador', [selectedUser]);

    function applyFilters(): void {
        setPage(1);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...defaultFilters });
        setAppliedFilters({ ...defaultFilters });
        setPage(1);
    }

    function openModal(kind: NonNullable<typeof modal>): void {
        setFeedback(null);
        setReason('');
        setModal(kind);
    }

    async function submitAction(): Promise<void> {
        if (!selectedUser || !modal) {
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            if (modal === 'suspend') {
                await api.post(`/admin/users/${selectedUser.id}/suspend`, { reason: reason.trim() || undefined });
            } else if (modal === 'reactivate') {
                await api.post(`/admin/users/${selectedUser.id}/reactivate`);
            } else {
                await api.post(`/admin/users/${selectedUser.id}/block`);
            }

            setModal(null);
            setReason('');
            setFeedback('Utilizador actualizado com sucesso.');
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setFeedback(caughtError instanceof ApiError && caughtError.status === 403 ? 'Sem permissão para aceder a esta área.' : caughtError instanceof ApiError ? caughtError.message : 'Não foi possível actualizar o utilizador.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AdminLayout title="Utilizadores" description="Gira contas, estados de acesso e perfis associados.">
            <Head title="Administração · Utilizadores" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-700 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-300">Moderação de contas</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Utilizadores da plataforma</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Consulte clientes, profissionais e administradores, e altere o estado de acesso quando necessário.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                        <p className="text-xs text-slate-300">Resultados</p>
                        <p className="mt-1 text-2xl font-bold">{pagination.total}</p>
                    </div>
                </div>
            </section>

            {feedback ? <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700" role="status">{feedback}</div> : null}

            <AdminFilterBar
                title="Filtros de utilizadores"
                description="Pesquise por nome, email ou telefone e restrinja por tipo e estado."
                search={filters.q}
                onSearchChange={(value) => setFilters((current) => ({ ...current, q: value }))}
                onApply={applyFilters}
                onReset={resetFilters}
                action={<Button variant="outline" onClick={() => setReloadKey((value) => value + 1)} isLoading={isLoading}>Actualizar</Button>}
            >
                <Select
                    label="Tipo"
                    value={filters.user_type}
                    options={[
                        { label: 'Cliente', value: 'client' },
                        { label: 'Profissional', value: 'professional' },
                        { label: 'Administrador', value: 'admin' },
                        { label: 'Super administrador', value: 'super_admin' },
                    ]}
                    placeholder="Todos os tipos"
                    onChange={(event) => setFilters((current) => ({ ...current, user_type: event.target.value }))}
                />
                <Select
                    label="Estado"
                    value={filters.status}
                    options={[
                        { label: 'Activo', value: 'active' },
                        { label: 'Inactivo', value: 'inactive' },
                        { label: 'Suspenso', value: 'suspended' },
                        { label: 'Bloqueado', value: 'blocked' },
                        { label: 'Pendente', value: 'pending' },
                    ]}
                    placeholder="Todos os estados"
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                />
            </AdminFilterBar>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="grid gap-5">
                    {isLoading ? <UsersSkeleton /> : null}

                    {!isLoading && error ? (
                        <EmptyState
                            title="Não foi possível carregar os utilizadores"
                            description={error}
                            icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                            action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                        />
                    ) : null}

                    {!error && (!isLoading || users.length > 0) ? (
                        <div className="grid gap-5">
                            <AdminDataTable headers={['Nome', 'Tipo', 'Estado', 'Contacto', 'Perfil', 'Criado em']}>
                                {users.length > 0 ? users.map((user) => {
                                    const active = selectedUserId === user.id;

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`cursor-pointer border-b border-slate-100 transition hover:bg-brand-50 ${active ? 'bg-brand-50' : 'bg-white'}`}
                                            onClick={() => setSelectedUserId(user.id)}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="grid gap-1">
                                                    <span className="font-semibold text-slate-950">{user.name}</span>
                                                    <span className="text-xs text-slate-500">{user.email ?? 'Sem email'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{user.user_type}</td>
                                            <td className="px-4 py-4"><AdminStatusBadge kind="user" value={user.status} /></td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{user.phone ?? '—'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{user.professional_profile ? `Perfil #${user.professional_profile.id}` : '—'}</td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{user.created_at ? formatDateTime(user.created_at) : '—'}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                                            Nenhum utilizador encontrado.
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
                        <div className="rounded-2xl border border-slate-200 bg-white p-card shadow-card">
                            {selectedUser ? (
                                <div className="grid gap-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Detalhe do utilizador</p>
                                            <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedUserLabel}</h2>
                                            <p className="mt-1 text-sm text-slate-500">{selectedUser.email ?? 'Sem email'}</p>
                                        </div>
                                        <AdminStatusBadge kind="user" value={selectedUser.status} />
                                    </div>

                                    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                                        <Line label="Telefone" value={selectedUser.phone ?? '—'} />
                                        <Line label="Tipo" value={selectedUser.user_type} />
                                        <Line label="Email verificado" value={selectedUser.email_verified_at ? formatDateTime(selectedUser.email_verified_at) : '—'} />
                                        <Line label="Último acesso" value={selectedUser.last_login_at ? formatDateTime(selectedUser.last_login_at) : '—'} />
                                    </div>

                                    <div className="grid gap-3 text-sm text-slate-600">
                                        <Line label="Província" value={selectedUser.location?.province ?? '—'} />
                                        <Line label="Cidade" value={selectedUser.location?.city ?? '—'} />
                                        <Line label="Endereço" value={selectedUser.location?.address ?? '—'} />
                                        <Line label="Papéis" value={selectedUser.roles?.length ? selectedUser.roles.join(', ') : '—'} />
                                    </div>

                                    {selectedUser.professional_profile ? (
                                        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="font-semibold text-slate-950">Perfil profissional</h3>
                                                <BadgeLabel value={selectedUser.professional_profile.verification_status} />
                                            </div>
                                            <Line label="Headline" value={selectedUser.professional_profile.headline || '—'} />
                                            <Line label="Experiência" value={`${selectedUser.professional_profile.experience_years} anos`} />
                                            <Line label="Disponibilidade" value={selectedUser.professional_profile.availability} />
                                            <Line label="Localização" value={[selectedUser.professional_profile.province, selectedUser.professional_profile.city].filter(Boolean).join(' · ') || '—'} />
                                        </div>
                                    ) : null}

                                    <div className="flex flex-wrap gap-2">
                                        {selectedUser.status === 'active' ? <Button variant="outline" onClick={() => openModal('suspend')}>Suspender</Button> : null}
                                        {selectedUser.status === 'suspended' || selectedUser.status === 'blocked' ? <Button onClick={() => openModal('reactivate')}>Reactivar</Button> : null}
                                        {selectedUser.status !== 'blocked' ? <Button variant="danger" onClick={() => openModal('block')}>Bloquear</Button> : null}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState title="Seleccione um utilizador" description="Clique numa linha da tabela para abrir o painel de detalhe." />
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            <AdminActionModal
                open={modal === 'suspend'}
                title="Suspender utilizador?"
                description={`Esta acção suspende temporariamente ${selectedUserLabel}. Pode indicar um motivo opcional.`}
                confirmLabel="Suspender"
                isLoading={isSubmitting}
                onConfirm={submitAction}
                onClose={() => setModal(null)}
            >
                <Textarea label="Motivo" value={reason} rows={4} placeholder="Motivo da suspensão (opcional)" onChange={(event) => setReason(event.target.value)} />
            </AdminActionModal>

            <AdminActionModal
                open={modal === 'reactivate'}
                title="Reactivar utilizador?"
                description={`Isto devolve o acesso a ${selectedUserLabel}.`}
                confirmLabel="Reactivar"
                isLoading={isSubmitting}
                onConfirm={submitAction}
                onClose={() => setModal(null)}
            />

            <AdminActionModal
                open={modal === 'block'}
                title="Bloquear utilizador?"
                description={`Bloquear ${selectedUserLabel} revoga imediatamente o acesso à plataforma.`}
                confirmLabel="Bloquear"
                destructive
                isLoading={isSubmitting}
                onConfirm={submitAction}
                onClose={() => setModal(null)}
            />
        </AdminLayout>
    );
}

function UsersSkeleton() {
    return (
        <div className="grid gap-4" aria-label="A carregar utilizadores" aria-busy="true">
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
            <LoadingSkeleton className="h-5 w-1/2" />
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="font-medium text-slate-500">{label}</span>
            <span className="text-right font-semibold text-slate-950">{value}</span>
        </div>
    );
}

function BadgeLabel({ value }: { value: string | null | undefined }) {
    return <AdminStatusBadge kind="verification" value={value} />;
}
