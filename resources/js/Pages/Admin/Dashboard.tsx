import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { MiniIcon, StatCard } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';

interface AdminDashboardSummary {
    users_total: number;
    clients_total: number;
    professionals_total: number;
    verified_professionals: number;
    service_requests_total: number;
    active_contracts: number;
    completed_contracts: number;
    open_disputes: number;
    pending_reports: number;
}

const quickActions = [
    { title: 'Ver utilizadores', description: 'Gerir contas e estados de acesso.', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8', href: '/admin/users' },
    { title: 'Ver verificações', description: 'Consultar documentos e aprovações.', icon: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z', href: '/admin/verifications' },
    { title: 'Ver denúncias', description: 'Analisar denúncias pendentes.', icon: 'M12 9v4M12 17h.01M10.3 4.3 2.7 18a2 2 0 0 0 1.75 3h15.1a2 2 0 0 0 1.75-3L13.7 4.3a2 2 0 0 0-3.4 0Z', href: '/admin/reports' },
    { title: 'Ver disputas', description: 'Acompanhar casos em análise.', icon: 'M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-5A9 9 0 1 1 21 12Z', href: '/admin/disputes' },
];

export default function AdminDashboard() {
    const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadDashboard = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<AdminDashboardSummary>('/admin/dashboard', { signal });
            setSummary(data);
        } catch (caughtError) {
            if (signal.aborted) {
                return;
            }

            setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o painel administrativo.');
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

    const isEmpty = summary !== null && Object.values(summary).every((value) => value === 0);

    return (
        <AdminLayout title="Painel administrativo" description="Visão global da actividade e operações da plataforma.">
            <Head title="Administração" />

            {isLoading ? <AdminDashboardSkeleton /> : null}

            {!isLoading && error ? (
                <EmptyState
                    title="Não foi possível carregar o painel"
                    description={error}
                    icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                    action={<Button onClick={retry}>Tentar novamente</Button>}
                />
            ) : null}

            {!isLoading && !error && isEmpty ? (
                <EmptyState
                    title="Ainda não existem dados administrativos"
                    description="Os indicadores aparecerão aqui quando a plataforma começar a registar actividade."
                    icon={<MiniIcon path="M4 19V9M10 19V5M16 19v-7M22 19H2" />}
                    action={<Button variant="outline" onClick={retry}>Actualizar painel</Button>}
                />
            ) : null}

            {!isLoading && !error && summary && !isEmpty ? (
                <div className="grid gap-8">
                    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-5 py-7 text-white shadow-elevated sm:px-8 sm:py-9">
                        <div className="max-w-3xl">
                            <p className="text-sm font-semibold text-blue-100">Centro de operações</p>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Visão geral da ProConnect</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                                Acompanhe utilizadores, actividade do marketplace e filas de moderação num único painel.
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="admin-kpis-title">
                        <SectionHeading id="admin-kpis-title" title="Indicadores da plataforma" description="Dados consolidados em tempo real pela API administrativa." />
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <StatCard label="Utilizadores" value={formatNumber(summary.users_total)} detail="Total de contas registadas" icon={<MiniIcon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />} />
                            <StatCard label="Clientes" value={formatNumber(summary.clients_total)} detail="Contas do tipo cliente" tone="green" icon={<MiniIcon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />} />
                            <StatCard label="Profissionais" value={formatNumber(summary.professionals_total)} detail="Contas profissionais" tone="violet" icon={<MiniIcon path="M4 7h16v13H4zM8 7V4h8v3M12 12v4" />} />
                            <StatCard label="Profissionais verificados" value={formatNumber(summary.verified_professionals)} detail="Perfis com verificação aprovada" tone="green" icon={<MiniIcon path="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-10 2 2 4-5" />} />
                            <StatCard label="Pedidos" value={formatNumber(summary.service_requests_total)} detail="Pedidos de serviço publicados" icon={<MiniIcon path="M6 3h9l3 3v15H6zM9 11h6M9 15h6" />} />
                            <StatCard label="Contratos ativos" value={formatNumber(summary.active_contracts)} detail="Contratos actualmente em execução" tone="blue" icon={<MiniIcon path="M4 7h16v13H4zM8 7V4h8v3M4 12h16" />} />
                            <StatCard label="Contratos concluídos" value={formatNumber(summary.completed_contracts)} detail="Serviços concluídos na plataforma" tone="green" icon={<MiniIcon path="m5 12 4 4L19 6" />} />
                            <StatCard label="Disputas abertas" value={formatNumber(summary.open_disputes)} detail="Casos pendentes ou em análise" tone="violet" icon={<MiniIcon path="M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-5A9 9 0 1 1 21 12Z" />} />
                            <StatCard label="Denúncias pendentes" value={formatNumber(summary.pending_reports)} detail="Itens que aguardam moderação" tone="amber" icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 4.3 2.7 18a2 2 0 0 0 1.75 3h15.1a2 2 0 0 0 1.75-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />} />
                        </div>
                    </section>

                    <section aria-labelledby="admin-actions-title">
                        <SectionHeading id="admin-actions-title" title="Acesso rápido" description="Atalhos para as principais áreas administrativas." />
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.title}
                                    className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                                    href={action.href}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><MiniIcon path={action.icon} /></span>
                                    <span className="min-w-0">
                                        <span className="block font-semibold text-slate-950">{action.title}</span>
                                        <span className="mt-1 block text-sm leading-5 text-slate-500">{action.description}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}
        </AdminLayout>
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

function AdminDashboardSkeleton() {
    return (
        <div className="grid gap-8" aria-label="A carregar o painel administrativo" aria-busy="true">
            <div className="grid gap-4 rounded-3xl bg-brand-100 p-6 sm:p-8">
                <LoadingSkeleton className="h-4 w-36 bg-brand-200" />
                <LoadingSkeleton className="h-9 w-full max-w-md bg-brand-200" />
                <LoadingSkeleton className="h-5 w-full max-w-xl bg-brand-200" />
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2"><LoadingSkeleton className="h-6 w-52" /><LoadingSkeleton className="h-4 w-80 max-w-full" /></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 9 }, (_, index) => (
                        <div key={index} className="flex min-h-36 items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card">
                            <div className="grid flex-1 gap-3"><LoadingSkeleton className="h-4 w-2/3" /><LoadingSkeleton className="h-8 w-1/3" /><LoadingSkeleton className="h-3 w-full" /></div>
                            <LoadingSkeleton className="size-11 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => <LoadingSkeleton key={index} className="h-28 rounded-2xl" />)}
            </div>
        </div>
    );
}
