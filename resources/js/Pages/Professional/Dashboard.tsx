import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { NotificationBadge } from '../../Components/ClientDashboard/NotificationBadge';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { AvailabilityStatusCard } from '../../Components/ProfessionalDashboard/AvailabilityStatusCard';
import { ContractSummaryCard } from '../../Components/ProfessionalDashboard/ContractSummaryCard';
import { InvitationCard } from '../../Components/ProfessionalDashboard/InvitationCard';
import { ProfessionalKpiCard } from '../../Components/ProfessionalDashboard/ProfessionalKpiCard';
import { ProposalSummaryCard } from '../../Components/ProfessionalDashboard/ProposalSummaryCard';
import { VerificationStatusCard } from '../../Components/ProfessionalDashboard/VerificationStatusCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ProfessionalLayout } from '../../Layouts/ProfessionalLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import type { Contract, Notification, PaginatedData, ProfessionalInvitation, ProfessionalProfile, Proposal } from '../../types';

interface RawDashboardSummary {
    available_jobs?: number;
    available_jobs_count?: number;
    jobs_available?: number;
    proposals_sent?: number;
    proposals_count?: number;
    accepted_proposals?: number;
    accepted_proposals_count?: number;
    active_contracts?: number;
    active_contracts_count?: number;
    monthly_earnings?: number | string;
    earnings_this_month?: number | string;
    average_rating?: number | string;
}

interface DashboardSummaryResponse extends RawDashboardSummary {
    summary?: RawDashboardSummary;
    dashboard?: RawDashboardSummary;
}

interface ProfessionalDashboardData {
    profile: ProfessionalProfile;
    summary: RawDashboardSummary | null;
    proposals: Proposal[];
    proposalsTotal: number;
    invitations: ProfessionalInvitation[];
    contracts: Contract[];
    unreadNotifications: number;
}

type ProposalsData = PaginatedData<'proposals', Proposal>;
type InvitationsData = PaginatedData<'invitations', ProfessionalInvitation>;
type ContractsData = PaginatedData<'contracts', Contract>;
type NotificationsData = PaginatedData<'notifications', Notification>;

const quickActions: Array<{ title: string; description: string; target?: string; icon: string }> = [
    { title: 'Actualizar perfil', description: 'Mantenha os seus dados profissionais completos.', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z' },
    { title: 'Ver trabalhos', description: 'Explore novos pedidos compatíveis consigo.', target: '/professional/jobs', icon: 'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z' },
    { title: 'Ver propostas', description: 'Acompanhe as propostas que enviou.', target: '/professional/proposals', icon: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4' },
    { title: 'Ver contratos', description: 'Consulte os contratos actualmente activos.', target: '/contracts', icon: 'M4 7h16v13H4zM8 7V4h8v3M4 12h16' },
];

export default function ProfessionalDashboard() {
    const currentUser = getStoredAuthUser();
    const [dashboard, setDashboard] = useState<ProfessionalDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMissingProfile, setIsMissingProfile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadDashboard = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setIsMissingProfile(false);

        try {
            let profile: ProfessionalProfile;

            try {
                const profileData = await api.get<{ profile: ProfessionalProfile }>('/professional/profile', { signal });
                profile = profileData.profile;
            } catch (caughtError) {
                if (caughtError instanceof ApiError && caughtError.status === 404) {
                    setIsMissingProfile(true);
                    setDashboard(null);
                    return;
                }

                throw caughtError;
            }

            const [summaryData, proposalsData, invitationsData, contractsData, notificationsData] = await Promise.all([
                loadSummary(signal),
                api.get<ProposalsData>('/professional/proposals', { signal }),
                api.get<InvitationsData>('/professional/invitations', { signal }),
                api.get<ContractsData>('/contracts', { signal }),
                api.get<NotificationsData>('/notifications', { query: { read: false }, signal }),
            ]);

            setDashboard({
                profile,
                summary: summaryData ? (summaryData.summary ?? summaryData.dashboard ?? summaryData) : null,
                proposals: proposalsData.proposals.slice(0, 4),
                proposalsTotal: proposalsData.pagination.total,
                invitations: invitationsData.invitations.filter((invitation) => invitation.status === 'pending').slice(0, 4),
                contracts: contractsData.contracts,
                unreadNotifications: notificationsData.pagination.total,
            });
        } catch (caughtError) {
            if (signal.aborted) {
                return;
            }

            setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar o seu painel profissional.');
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

    const firstName = (dashboard?.profile.user?.name ?? currentUser?.name ?? 'profissional').split(/\s+/)[0];
    const activeContracts = dashboard?.contracts.filter((contract) => contract.status === 'active') ?? [];
    const acceptedRecentProposals = dashboard?.proposals.filter((proposal) => proposal.status === 'accepted').length ?? 0;
    const monthlyEarnings = dashboard ? calculateMonthlyEarnings(dashboard.contracts) : 0;
    const summary = dashboard?.summary;

    const availableJobs = readNumber(summary, ['available_jobs', 'available_jobs_count', 'jobs_available']);
    const proposalsSent = readNumber(summary, ['proposals_sent', 'proposals_count']) ?? dashboard?.proposalsTotal ?? 0;
    const acceptedProposals = readNumber(summary, ['accepted_proposals', 'accepted_proposals_count']) ?? acceptedRecentProposals;
    const activeContractsCount = readNumber(summary, ['active_contracts', 'active_contracts_count']) ?? activeContracts.length;
    const earnings = readNumber(summary, ['monthly_earnings', 'earnings_this_month']) ?? monthlyEarnings;
    const averageRating = readNumber(summary, ['average_rating']) ?? Number(dashboard?.profile.average_rating ?? 0);

    function retry(): void {
        setReloadKey((value) => value + 1);
    }

    function showComingSoon(message: string): void {
        setNotice(message);
    }

    return (
        <ProfessionalLayout title="Visão geral" description="Acompanhe oportunidades, propostas e o desempenho do seu negócio.">
            <Head title="Área profissional" />

            {isLoading ? <ProfessionalDashboardSkeleton /> : null}

            {!isLoading && isMissingProfile ? (
                <MissingProfileState
                    name={currentUser?.name ?? 'Profissional'}
                    notice={notice}
                    onCreate={() => showComingSoon('A criação do perfil profissional será disponibilizada em breve.')}
                />
            ) : null}

            {!isLoading && !isMissingProfile && error ? <DashboardError message={error} onRetry={retry} /> : null}

            {!isLoading && !isMissingProfile && !error && dashboard ? (
                <div className="grid gap-8">
                    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-5 py-7 text-white shadow-elevated sm:px-8 sm:py-9">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-sm font-semibold text-blue-100">Olá, {firstName}</p>
                                    <NotificationBadge count={dashboard.unreadNotifications} />
                                </div>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Faça crescer o seu negócio na ProConnect</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">{dashboard.profile.headline}</p>
                            </div>
                            <Button variant="outline" className="border-white bg-white text-brand-700 hover:bg-brand-50" onClick={() => router.visit('/professional/jobs')}>
                                Encontrar trabalhos
                            </Button>
                        </div>
                        {notice ? <p className="mt-4 text-sm text-blue-50" role="status">{notice}</p> : null}
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2" aria-label="Estado do perfil profissional">
                        <VerificationStatusCard status={dashboard.profile.verification_status} />
                        <AvailabilityStatusCard availability={dashboard.profile.availability} />
                    </section>

                    <section aria-labelledby="kpi-title">
                        <SectionHeading id="kpi-title" title="Resumo do desempenho" description="Indicadores principais da sua actividade profissional." />
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <ProfessionalKpiCard label="Trabalhos disponíveis" value={availableJobs === undefined ? '—' : formatNumber(availableJobs)} detail={availableJobs === undefined ? 'Resumo temporariamente indisponível' : 'Oportunidades actuais'} icon={<MiniIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" />} />
                            <ProfessionalKpiCard label="Propostas enviadas" value={formatNumber(proposalsSent)} detail="Total de propostas submetidas" tone="violet" icon={<MiniIcon path="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" />} />
                            <ProfessionalKpiCard label="Propostas aceites" value={formatNumber(acceptedProposals)} detail={summary ? 'Total de propostas aceites' : 'Nas propostas recentes'} tone="green" icon={<MiniIcon path="m5 12 4 4L19 6" />} />
                            <ProfessionalKpiCard label="Contratos ativos" value={formatNumber(activeContractsCount)} detail="Trabalhos actualmente em curso" icon={<MiniIcon path="M4 7h16v13H4zM8 7V4h8v3" />} />
                            <ProfessionalKpiCard label="Ganhos do mês" value={formatCurrency(earnings)} detail="Contratos concluídos este mês" tone="amber" icon={<MiniIcon path="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />
                            <ProfessionalKpiCard label="Avaliação média" value={averageRating.toFixed(1)} detail={`${formatNumber(dashboard.profile.total_reviews)} avaliações recebidas`} tone="violet" icon={<MiniIcon path="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />} />
                        </div>
                    </section>

                    <section aria-labelledby="quick-actions-title">
                        <SectionHeading id="quick-actions-title" title="Acesso rápido" description="Atalhos para gerir a sua actividade." />
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {quickActions.map((action) => (
                                <QuickAction key={action.title} {...action} onClick={action.target ? undefined : () => showComingSoon(`${action.title} estará disponível em breve.`)} />
                            ))}
                        </div>
                    </section>

                    <DashboardSection id="propostas" title="Propostas recentes" description="Últimas propostas enviadas aos clientes">
                        {dashboard.proposals.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{dashboard.proposals.map((proposal) => <ProposalSummaryCard key={proposal.id} proposal={proposal} />)}</div>
                        ) : <EmptyState title="Ainda não enviou propostas" description="As propostas submetidas aparecerão aqui." />}
                    </DashboardSection>

                    <DashboardSection id="convites" title="Convites" description="Pedidos de clientes que aguardam a sua resposta">
                        {dashboard.invitations.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{dashboard.invitations.map((invitation) => <InvitationCard key={invitation.id} invitation={invitation} />)}</div>
                        ) : <EmptyState title="Sem convites pendentes" description="Novos convites de clientes aparecerão aqui." />}
                    </DashboardSection>

                    <DashboardSection id="contratos" title="Contratos ativos" description="Trabalhos actualmente em execução">
                        {activeContracts.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{activeContracts.slice(0, 4).map((contract) => <ContractSummaryCard key={contract.id} contract={contract} />)}</div>
                        ) : <EmptyState title="Sem contratos ativos" description="Os contratos em execução aparecerão aqui." />}
                    </DashboardSection>
                </div>
            ) : null}
        </ProfessionalLayout>
    );
}

async function loadSummary(signal: AbortSignal): Promise<DashboardSummaryResponse | null> {
    try {
        return await api.get<DashboardSummaryResponse>('/professional/dashboard', { signal });
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return null;
        }

        throw error;
    }
}

function readNumber(summary: RawDashboardSummary | null | undefined, keys: Array<keyof RawDashboardSummary>): number | undefined {
    if (!summary) {
        return undefined;
    }

    for (const key of keys) {
        const value = summary[key];

        if (value !== undefined && value !== null && value !== '') {
            const number = Number(value);

            if (Number.isFinite(number)) {
                return number;
            }
        }
    }

    return undefined;
}

function calculateMonthlyEarnings(contracts: Contract[]): number {
    const now = new Date();

    return contracts
        .filter((contract) => {
            if (contract.status !== 'completed' || !contract.completed_at) {
                return false;
            }

            const completedAt = new Date(contract.completed_at);
            return completedAt.getFullYear() === now.getFullYear() && completedAt.getMonth() === now.getMonth();
        })
        .reduce((total, contract) => total + Number(contract.professional_amount ?? contract.amount), 0);
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
    return <div><h2 id={id} className="text-xl font-bold tracking-tight text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
}

function DashboardSection({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
    return <section id={id} className="grid scroll-mt-24 gap-4" aria-labelledby={`${id}-title`}><SectionHeading id={`${id}-title`} title={title} description={description} />{children}</section>;
}

function QuickAction({ title, description, target, icon, onClick }: { title: string; description: string; target?: string; icon: string; onClick?: () => void }) {
    const content = <><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><MiniIcon path={icon} /></span><span className="min-w-0 text-left"><span className="block font-semibold text-slate-950">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span></span></>;
    const classes = 'flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100';

    return target ? <a className={classes} href={target}>{content}</a> : <button type="button" className={classes} onClick={onClick}>{content}</button>;
}

function MissingProfileState({ name, notice, onCreate }: { name: string; notice: string | null; onCreate: () => void }) {
    return (
        <div className="grid gap-6">
            <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-6 py-8 text-white shadow-elevated sm:px-8">
                <p className="text-sm font-semibold text-blue-100">Olá, {name.split(/\s+/)[0]}</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Prepare o seu perfil profissional</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Crie o perfil para receber convites, enviar propostas e começar a trabalhar na ProConnect.</p>
            </div>
            <EmptyState title="Perfil profissional em falta" description="Complete os seus dados profissionais, área de actuação e disponibilidade para activar o dashboard." icon={<MiniIcon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0M19 8v6M16 11h6" />} action={<Button onClick={onCreate}>Criar perfil profissional</Button>} />
            {notice ? <p className="text-center text-sm text-brand-700" role="status">{notice}</p> : null}
        </div>
    );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return <EmptyState title="Não foi possível carregar o painel profissional" description={message} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={onRetry}>Tentar novamente</Button>} />;
}

function ProfessionalDashboardSkeleton() {
    return (
        <div className="grid gap-8" aria-label="A carregar o painel profissional" aria-busy="true">
            <div className="grid gap-4 rounded-3xl bg-brand-100 p-6 sm:p-8"><LoadingSkeleton className="h-4 w-28 bg-brand-200" /><LoadingSkeleton className="h-9 w-full max-w-lg bg-brand-200" /><LoadingSkeleton className="h-5 w-full max-w-xl bg-brand-200" /></div>
            <SkeletonGrid cards={2} columns="lg:grid-cols-2" />
            <SkeletonGrid cards={6} columns="sm:grid-cols-2 xl:grid-cols-3" />
            <SkeletonGrid cards={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
            <SkeletonGrid cards={4} columns="md:grid-cols-2 xl:grid-cols-4" />
        </div>
    );
}

function SkeletonGrid({ cards, columns }: { cards: number; columns: string }) {
    return (
        <section className="grid gap-4">
            <div className="grid gap-2"><LoadingSkeleton className="h-6 w-48" /><LoadingSkeleton className="h-4 w-72 max-w-full" /></div>
            <div className={`grid gap-4 ${columns}`}>
                {Array.from({ length: cards }, (_, index) => <div key={index} className="grid min-h-36 gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card"><div className="flex items-center gap-3"><LoadingSkeleton className="size-11 rounded-xl" /><div className="grid flex-1 gap-2"><LoadingSkeleton className="h-4 w-2/3" /><LoadingSkeleton className="h-3 w-full" /></div></div><LoadingSkeleton className="h-10 w-full" /></div>)}
            </div>
        </section>
    );
}
