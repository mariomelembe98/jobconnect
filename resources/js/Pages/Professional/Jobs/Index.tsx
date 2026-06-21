import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { ProfessionalJobCard } from '../../../Components/ProfessionalJobs/ProfessionalJobCard';
import { ProfessionalJobFilterPanel, type ProfessionalJobFilters } from '../../../Components/ProfessionalJobs/ProfessionalJobFilterPanel';
import { MiniIcon } from '../../../Components/Dashboard/StatCard';
import { Button } from '../../../Components/ui/Button';
import { EmptyState } from '../../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../../Components/ui/LoadingSkeleton';
import { ProfessionalLayout } from '../../../Layouts/ProfessionalLayout';
import { api, ApiError } from '../../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../../lib/auth';
import { formatNumber } from '../../../lib/formatters';
import type { Category, PaginatedData, Pagination, ServiceRequest } from '../../../types';

type JobsData = PaginatedData<'service_requests', ServiceRequest>;

const initialFilters: ProfessionalJobFilters = { q: '', category_id: '', province: '', city: '', service_type: '', budget_min: '', budget_max: '', status: '', sort: '-created_at' };
const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ProfessionalJobs() {
    const [filters, setFilters] = useState<ProfessionalJobFilters>({ ...initialFilters });
    const [appliedFilters, setAppliedFilters] = useState<ProfessionalJobFilters>({ ...initialFilters });
    const [categories, setCategories] = useState<Category[]>([]);
    const [jobs, setJobs] = useState<ServiceRequest[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadJobs = useCallback(async (signal: AbortSignal, currentFilters: ProfessionalJobFilters, currentPage: number) => {
        if (!getAuthToken()) return;
        if (getStoredAuthUser()?.user_type !== 'professional') return;

        setIsLoading(true);
        setError(null);

        try {
            const [categoriesData, jobsData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<JobsData>('/service-requests', {
                    signal,
                    query: {
                        q: currentFilters.q,
                        category_id: currentFilters.category_id,
                        province: currentFilters.province,
                        city: currentFilters.city,
                        service_type: currentFilters.service_type,
                        budget_min: currentFilters.budget_min,
                        budget_max: currentFilters.budget_max,
                        status: currentFilters.status,
                        sort: currentFilters.sort,
                        page: currentPage,
                    },
                }),
            ]);
            setCategories(categoriesData.categories);
            setJobs(jobsData.service_requests);
            setPagination(jobsData.pagination);
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar os trabalhos disponíveis.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadJobs(controller.signal, appliedFilters, page);
        return () => controller.abort();
    }, [appliedFilters, loadJobs, page, reloadKey]);

    function applyFilters(): void {
        setPage(1);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...initialFilters });
        setAppliedFilters({ ...initialFilters });
        setPage(1);
    }

    return (
        <ProfessionalLayout title="Trabalhos disponíveis" description="Encontre pedidos compatíveis com os seus serviços.">
            <Head title="Trabalhos disponíveis" />
            <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="lg:sticky lg:top-24 lg:self-start"><ProfessionalJobFilterPanel filters={filters} categories={categories} isApplying={isLoading} onChange={setFilters} onApply={applyFilters} onReset={resetFilters} /></div>
                <div className="min-w-0">
                    {isLoading && jobs.length === 0 ? <JobsSkeleton /> : null}
                    {!isLoading && error ? <EmptyState title="Não foi possível carregar os trabalhos" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}
                    {!error && (!isLoading || jobs.length > 0) ? (
                        <div className="grid gap-5">
                            <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-bold text-slate-950">Oportunidades</h1><p className="mt-1 text-sm text-slate-500">{formatNumber(pagination.total)} trabalhos encontrados</p></div>{isLoading ? <span className="text-sm text-brand-600">A actualizar...</span> : null}</div>
                            {jobs.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{jobs.map((job) => <ProfessionalJobCard key={job.id} job={job} />)}</div> : <EmptyState title="Nenhum trabalho encontrado" description="Experimente remover filtros ou pesquisar por outro serviço." action={<Button variant="outline" onClick={resetFilters}>Limpar filtros</Button>} />}
                            {pagination.last_page > 1 ? <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="Paginação"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => setPage((current) => current + 1)}>Seguinte</Button></nav> : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </ProfessionalLayout>
    );
}

function JobsSkeleton() {
    return <div className="grid gap-5" aria-label="A carregar trabalhos" aria-busy="true"><div className="grid gap-2"><LoadingSkeleton className="h-6 w-48" /><LoadingSkeleton className="h-4 w-32" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="grid min-h-72 gap-4 rounded-2xl border border-slate-200 bg-white p-card shadow-card"><LoadingSkeleton className="h-5 w-2/3" /><LoadingSkeleton className="h-16 w-full" /><LoadingSkeleton className="h-20 w-full" /><LoadingSkeleton className="mt-auto h-10 w-full" /></div>)}</div></div>;
}
