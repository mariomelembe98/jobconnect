import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { ProfessionalDirectoryCard } from '../../Components/Professionals/ProfessionalDirectoryCard';
import { ProfessionalFilterPanel, type ProfessionalDirectoryFilters } from '../../Components/Professionals/ProfessionalFilterPanel';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { MarketplaceLayout } from '../../Layouts/MarketplaceLayout';
import { api, ApiError } from '../../lib/api';
import { formatNumber } from '../../lib/formatters';
import type { Category, PaginatedData, Pagination, ProfessionalProfile, Skill } from '../../types';

type ProfessionalsData = PaginatedData<'professionals', ProfessionalProfile>;

const initialFilters: ProfessionalDirectoryFilters = {
    q: '',
    category_id: '',
    skill_id: '',
    province: '',
    city: '',
    verified: false,
    availability: false,
    rating: false,
    sort: '-average_rating',
};

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ProfessionalDirectory() {
    const [filters, setFilters] = useState<ProfessionalDirectoryFilters>({ ...initialFilters });
    const [appliedFilters, setAppliedFilters] = useState<ProfessionalDirectoryFilters>({ ...initialFilters });
    const [categories, setCategories] = useState<Category[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [isLoadingLookups, setIsLoadingLookups] = useState(true);
    const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [professionalsError, setProfessionalsError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);

    const loadLookups = useCallback(async (signal: AbortSignal) => {
        setIsLoadingLookups(true);
        setLookupError(null);

        try {
            const [categoriesData, skillsData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<{ skills: Skill[] }>('/skills', { signal }),
            ]);
            setCategories(categoriesData.categories);
            setSkills(skillsData.skills);
        } catch (error) {
            if (!signal.aborted) {
                setLookupError(error instanceof ApiError ? error.message : 'Não foi possível carregar os filtros.');
            }
        } finally {
            if (!signal.aborted) setIsLoadingLookups(false);
        }
    }, []);

    const loadProfessionals = useCallback(async (signal: AbortSignal, currentFilters: ProfessionalDirectoryFilters, currentPage: number) => {
        setIsLoadingProfessionals(true);
        setProfessionalsError(null);

        try {
            const data = await api.get<ProfessionalsData>('/professionals', {
                signal,
                query: {
                    q: currentFilters.q,
                    category_id: currentFilters.category_id,
                    skill_id: currentFilters.skill_id,
                    province: currentFilters.province,
                    city: currentFilters.city,
                    verified: currentFilters.verified ? true : undefined,
                    availability: currentFilters.availability ? 'available' : undefined,
                    rating: currentFilters.rating ? 4 : undefined,
                    sort: currentFilters.sort,
                    page: currentPage,
                },
            });
            setProfessionals(data.professionals);
            setPagination(data.pagination);
        } catch (error) {
            if (!signal.aborted) {
                setProfessionalsError(error instanceof ApiError ? error.message : 'Não foi possível carregar os profissionais.');
            }
        } finally {
            if (!signal.aborted) setIsLoadingProfessionals(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadLookups(controller.signal);
        return () => controller.abort();
    }, [loadLookups, reloadKey]);

    useEffect(() => {
        const controller = new AbortController();
        void loadProfessionals(controller.signal, appliedFilters, page);
        return () => controller.abort();
    }, [appliedFilters, loadProfessionals, page, reloadKey]);

    function applyFilters(event?: FormEvent): void {
        event?.preventDefault();
        setPage(1);
        setAppliedFilters({ ...filters });
    }

    function resetFilters(): void {
        setFilters({ ...initialFilters });
        setAppliedFilters({ ...initialFilters });
        setPage(1);
    }

    const error = lookupError ?? professionalsError;
    const isInitialLoading = (isLoadingLookups || isLoadingProfessionals) && professionals.length === 0;

    return (
        <MarketplaceLayout>
            <Head title="Explorar profissionais" />
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-[96rem] px-page py-10 sm:px-8 sm:py-14">
                    <p className="text-sm font-semibold text-brand-600">Marketplace de serviços</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Encontre profissionais de confiança</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">Pesquise por especialidade, localização e reputação para encontrar a pessoa certa para o seu serviço.</p>
                    <form className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row" onSubmit={applyFilters}>
                        <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100" htmlFor="professional-search">
                            <MiniIcon path="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                            <span className="sr-only">Pesquisar profissionais</span>
                            <input id="professional-search" className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" value={filters.q} placeholder="Nome, serviço ou competência" onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
                        </label>
                        <Button type="submit" size="lg" isLoading={isLoadingProfessionals}>Pesquisar</Button>
                    </form>
                </div>
            </section>

            <div className="mx-auto grid max-w-[96rem] gap-6 px-page py-8 sm:px-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <ProfessionalFilterPanel filters={filters} categories={categories} skills={skills} isApplying={isLoadingProfessionals} onChange={setFilters} onApply={() => applyFilters()} onReset={resetFilters} />
                </div>

                <div className="min-w-0">
                    {isInitialLoading ? <DirectorySkeleton /> : null}

                    {!isInitialLoading && error ? (
                        <EmptyState title="Não foi possível carregar o directório" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} />
                    ) : null}

                    {!isInitialLoading && !error ? (
                        <div className="grid gap-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div><h2 className="text-xl font-bold text-slate-950">Profissionais</h2><p className="mt-1 text-sm text-slate-500">{formatNumber(pagination.total)} resultados encontrados</p></div>
                                {isLoadingProfessionals ? <span className="text-sm text-brand-600">A actualizar...</span> : null}
                            </div>

                            {professionals.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{professionals.map((professional) => <ProfessionalDirectoryCard key={professional.id} professional={professional} />)}</div>
                            ) : (
                                <EmptyState title="Nenhum profissional encontrado" description="Experimente remover alguns filtros ou pesquisar por outro termo." action={<Button variant="outline" onClick={resetFilters}>Limpar filtros</Button>} />
                            )}

                            {pagination.last_page > 1 ? <PaginationControls pagination={pagination} onPageChange={setPage} /> : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </MarketplaceLayout>
    );
}

function PaginationControls({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
    return (
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-card" aria-label="Paginação">
            <Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => onPageChange(pagination.current_page - 1)}>Anterior</Button>
            <span className="text-sm text-slate-600">Página <strong className="text-slate-950">{pagination.current_page}</strong> de {pagination.last_page}</span>
            <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => onPageChange(pagination.current_page + 1)}>Seguinte</Button>
        </nav>
    );
}

function DirectorySkeleton() {
    return (
        <div className="grid gap-5" aria-label="A carregar profissionais" aria-busy="true">
            <div className="grid gap-2"><LoadingSkeleton className="h-6 w-48" /><LoadingSkeleton className="h-4 w-36" /></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => <div key={index} className="grid min-h-72 gap-5 rounded-2xl border border-slate-200 bg-white p-card shadow-card"><div className="flex gap-4"><LoadingSkeleton className="size-14 rounded-2xl" /><div className="grid flex-1 gap-2"><LoadingSkeleton className="h-4 w-2/3" /><LoadingSkeleton className="h-3 w-full" /></div></div><LoadingSkeleton className="h-8 w-3/4" /><LoadingSkeleton className="h-20 w-full" /><LoadingSkeleton className="mt-auto h-11 w-full" /></div>)}
            </div>
        </div>
    );
}
