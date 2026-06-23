import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';

import { CategoryCard } from '../Components/ClientDashboard/CategoryCard';
import { ProfessionalCard } from '../Components/ClientDashboard/ProfessionalCard';
import { Card, CardContent } from '../Components/ui/Card';
import { EmptyState } from '../Components/ui/EmptyState';
import { Button } from '../Components/ui/Button';
import { LoadingSkeleton } from '../Components/ui/LoadingSkeleton';
import { MarketplaceLayout } from '../Layouts/MarketplaceLayout';
import { api, ApiError } from '../lib/api';
import { getStoredAuthUser } from '../lib/auth';
import { formatNumber } from '../lib/formatters';
import type { AppPageProps, Category, PaginatedData, ProfessionalProfile } from '../types';

type ProfessionalsResponse = PaginatedData<'professionals', ProfessionalProfile>;

export default function LandingPage() {
    const { auth } = usePage<AppPageProps>().props;
    const currentUser = auth.user ?? getStoredAuthUser();
    const publishHref = currentUser ? '/client/service-requests/create' : '/login';

    const [categories, setCategories] = useState<Category[]>([]);
    const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [professionalsError, setProfessionalsError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadLandingData = useCallback(async (signal: AbortSignal) => {
        setIsLoadingCategories(true);
        setIsLoadingProfessionals(true);
        setCategoriesError(null);
        setProfessionalsError(null);

        try {
            const [categoriesData, professionalsData] = await Promise.all([
                api.get<{ categories: Category[] }>('/categories', { signal }),
                api.get<ProfessionalsResponse>('/professionals', {
                    signal,
                    query: {
                        sort: '-average_rating',
                    },
                }),
            ]);

            if (signal.aborted) {
                return;
            }

            setCategories(categoriesData.categories);
            setProfessionals(professionalsData.professionals.slice(0, 4));
        } catch (caughtError) {
            if (signal.aborted) {
                return;
            }

            if (caughtError instanceof ApiError) {
                if (caughtError.status === 403) {
                    setCategoriesError('Sem permissão para carregar as categorias.');
                    setProfessionalsError('Sem permissão para carregar os profissionais.');
                } else {
                    setCategoriesError(caughtError.message);
                    setProfessionalsError(caughtError.message);
                }
            } else {
                setCategoriesError('Não foi possível carregar as categorias.');
                setProfessionalsError('Não foi possível carregar os profissionais.');
            }
        } finally {
            if (!signal.aborted) {
                setIsLoadingCategories(false);
                setIsLoadingProfessionals(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void loadLandingData(controller.signal);

        return () => controller.abort();
    }, [loadLandingData, reloadKey]);

    const heroStats = useMemo(() => [
        { label: 'Categorias', value: formatNumber(categories.length) },
        { label: 'Profissionais em destaque', value: formatNumber(professionals.length) },
        { label: 'Pedidos publicados', value: 'Rápido' },
    ], [categories.length, professionals.length]);

    function refresh(): void {
        setReloadKey((value) => value + 1);
    }

    return (
        <MarketplaceLayout>
            <Head title="ProConnect · Encontre profissionais de confiança" />

            <section className="border-b border-slate-200 bg-gradient-to-br from-white via-brand-50 to-sky-50">
                <div className="mx-auto grid max-w-[96rem] gap-10 px-page py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
                    <div className="grid content-start gap-6">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm">
                            Serviços de confiança em Moçambique
                        </div>
                        <div className="grid gap-4">
                            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                                Encontre profissionais de confiança para qualquer serviço
                            </h1>
                            <p className="max-w-2xl text-lg leading-8 text-slate-600">
                                Publique o seu pedido, compare propostas de profissionais verificados e acompanhe cada etapa do serviço com mais segurança e transparência.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <ActionLink href={publishHref} variant="primary">
                                Publicar pedido
                            </ActionLink>
                            <ActionLink href="/register" variant="secondary">
                                Trabalhar como profissional
                            </ActionLink>
                            <ActionLink href="/professionals" variant="ghost">
                                Explorar profissionais
                            </ActionLink>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {heroStats.map((stat) => (
                                <Card key={stat.label} className="bg-white/80 backdrop-blur">
                                    <CardContent className="grid gap-1.5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                                        <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <Card className="overflow-hidden border-brand-100 bg-white shadow-elevated">
                            <CardContent className="grid gap-4">
                                <div className="grid gap-3 rounded-3xl bg-brand-50 p-6">
                                    <p className="text-sm font-semibold text-brand-700">Como funciona</p>
                                    <div className="grid gap-4">
                                        {[
                                            ['1', 'Cliente publica pedido', 'Descreva o serviço, localização e orçamento.'],
                                            ['2', 'Profissionais enviam propostas', 'Receba opções e compare perfis verificados.'],
                                            ['3', 'Cliente escolhe e acompanha', 'Acompanhe o serviço, o chat e a conclusão.'],
                                        ].map(([step, title, description]) => (
                                            <div key={title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white">{step}</div>
                                                <div>
                                                    <h2 className="font-semibold text-slate-950">{title}</h2>
                                                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                ['Clientes', 'Publique pedidos, receba propostas e acompanhe o trabalho numa única área.', 'Mantenha histórico, notificações e contratos organizados.'],
                                ['Profissionais', 'Crie o seu perfil, encontre oportunidades e envie propostas competitivas.', 'Aumente a confiança com avaliações, verificação e portfólio.'],
                            ].map(([title, subtitle, description]) => (
                                <Card key={title}>
                                    <CardContent className="grid gap-2">
                                        <p className="text-sm font-semibold text-brand-700">{title}</p>
                                        <h3 className="text-lg font-bold text-slate-950">{subtitle}</h3>
                                        <p className="text-sm leading-6 text-slate-500">{description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Section title="Categorias populares" description="Explore os serviços mais procurados e encontre o ponto de partida certo.">
                {isLoadingCategories ? <CategorySkeletonGrid /> : null}
                {!isLoadingCategories && categoriesError ? (
                    <SectionError message={categoriesError} onRetry={refresh} />
                ) : null}
                {!isLoadingCategories && !categoriesError && categories.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {categories.map((category) => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </div>
                ) : null}
                {!isLoadingCategories && !categoriesError && categories.length === 0 ? (
                    <EmptyState title="Sem categorias disponíveis" description="As categorias serão apresentadas assim que forem activadas no sistema." />
                ) : null}
            </Section>

            <Section title="Profissionais em destaque" description="Os profissionais com melhor avaliação e presença mais forte na plataforma.">
                {isLoadingProfessionals ? <ProfessionalSkeletonGrid /> : null}
                {!isLoadingProfessionals && professionalsError ? (
                    <SectionError message={professionalsError} onRetry={refresh} />
                ) : null}
                {!isLoadingProfessionals && !professionalsError && professionals.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {professionals.map((professional) => (
                            <Link key={professional.id} href={`/professionals/${professional.id}`} className="block">
                                <ProfessionalCard professional={professional} />
                            </Link>
                        ))}
                    </div>
                ) : null}
                {!isLoadingProfessionals && !professionalsError && professionals.length === 0 ? (
                    <EmptyState title="Sem profissionais em destaque" description="Ainda não existem profissionais suficientes para destacar." />
                ) : null}
            </Section>

            <Section title="Para clientes" description="Tudo o que precisa para publicar, acompanhar e concluir um pedido.">
                <div className="grid gap-4 md:grid-cols-3">
                    <FeatureCard title="Publicação simples" description="Publique pedidos em poucos passos e receba propostas com rapidez." />
                    <FeatureCard title="Acompanhamento claro" description="Veja propostas, contratos, chat e notificações num só lugar." />
                    <FeatureCard title="Controlo total" description="Escolha o profissional certo e acompanhe cada etapa com segurança." />
                </div>
            </Section>

            <Section title="Para profissionais" description="Ferramentas para crescer com confiança dentro do marketplace.">
                <div className="grid gap-4 md:grid-cols-3">
                    <FeatureCard title="Perfil profissional" description="Apresente o seu trabalho com categorias, competências, portfólio e verificação." />
                    <FeatureCard title="Mais oportunidades" description="Pesquise trabalhos abertos, envie propostas e converta oportunidades em contratos." />
                    <FeatureCard title="Reputação e confiança" description="Construa credibilidade com avaliações e documentos de verificação privados." />
                </div>
            </Section>

            <Section title="Segurança e verificação" description="Processos pensados para aumentar a confiança sem complicar a experiência.">
                <div className="grid gap-4 lg:grid-cols-3">
                    <SecurityCard title="Profissionais verificados" description="Documentos de identidade e certificados são revistos antes da aprovação." />
                    <SecurityCard title="Acesso protegido" description="Contas suspensas ou bloqueadas não acedem às áreas protegidas da plataforma." />
                    <SecurityCard title="Auditoria e rastreio" description="Ações críticas ficam registadas para apoio à moderação e segurança." />
                </div>
            </Section>

            <Section title="Perguntas frequentes" description="Respostas rápidas às dúvidas mais comuns.">
                <div className="grid gap-4 lg:grid-cols-2">
                    <FaqItem question="Preciso de pagar para publicar um pedido?" answer="Não nesta fase. A plataforma está preparada para o marketplace sem processamento de pagamentos activo." />
                    <FaqItem question="Posso contactar um profissional antes de aceitar uma proposta?" answer="Sim. Use a página de profissionais e as conversas quando disponíveis no fluxo do contrato." />
                    <FaqItem question="Os documentos de verificação são públicos?" answer="Não. Os documentos de verificação são guardados em armazenamento privado e só podem ser descarregados com permissão." />
                    <FaqItem question="A plataforma funciona no telemóvel?" answer="Sim. A interface é responsiva e foi pensada para uso móvel e desktop." />
                </div>
            </Section>

            <section className="mx-auto max-w-[96rem] px-page pb-16 sm:px-8">
                <Card className="overflow-hidden border-brand-100 bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 text-white shadow-elevated">
                    <CardContent className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="grid gap-2">
                            <p className="text-sm font-semibold text-brand-100">Pronto para começar?</p>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Publique o seu pedido ou comece a trabalhar hoje.</h2>
                            <p className="max-w-2xl text-base leading-7 text-brand-100">
                                Entre, crie o seu perfil e use ProConnect para ligar clientes e profissionais com mais confiança.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                            <ActionLink href={publishHref} variant="white">Publicar pedido</ActionLink>
                            <ActionLink href="/professionals" variant="ghostOnBlue">Explorar profissionais</ActionLink>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </MarketplaceLayout>
    );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="mx-auto max-w-[96rem] px-page py-10 sm:px-8 sm:py-14">
            <div className="mb-6 grid gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
                <p className="max-w-2xl text-base leading-7 text-slate-500">{description}</p>
            </div>
            {children}
        </section>
    );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
    return (
        <Card className="h-full">
            <CardContent className="grid gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="text-sm leading-6 text-slate-500">{description}</p>
            </CardContent>
        </Card>
    );
}

function SecurityCard({ title, description }: { title: string; description: string }) {
    return (
        <Card className="h-full border-brand-100 bg-brand-50/40">
            <CardContent className="grid gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="text-sm leading-6 text-slate-500">{description}</p>
            </CardContent>
        </Card>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    return (
        <Card className="h-full">
            <CardContent className="grid gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{question}</h3>
                <p className="text-sm leading-6 text-slate-500">{answer}</p>
            </CardContent>
        </Card>
    );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return <EmptyState title="Não foi possível carregar esta secção" description={message} action={<Button onClick={onRetry}>Tentar novamente</Button>} />;
}

function CategorySkeletonGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
                <Card key={index}>
                    <CardContent className="flex items-start gap-4">
                        <LoadingSkeleton className="size-11 rounded-xl" />
                        <div className="grid flex-1 gap-2">
                            <LoadingSkeleton className="h-4 w-1/2" />
                            <LoadingSkeleton className="h-4 w-full" />
                            <LoadingSkeleton className="h-4 w-5/6" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ProfessionalSkeletonGrid() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
                <Card key={index}>
                    <CardContent className="grid gap-4">
                        <div className="flex items-start gap-3">
                            <LoadingSkeleton className="size-12 rounded-2xl" />
                            <div className="grid flex-1 gap-2">
                                <LoadingSkeleton className="h-4 w-2/3" />
                                <LoadingSkeleton className="h-4 w-full" />
                            </div>
                        </div>
                        <LoadingSkeleton className="h-16 w-full" />
                        <LoadingSkeleton className="h-11 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ActionLink({ href, children, variant, onClick }: { href: string; children: ReactNode; variant: 'primary' | 'secondary' | 'ghost' | 'white' | 'ghostOnBlue'; onClick?: (event: MouseEvent<Element>) => void }) {
    const base = 'inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition';
    const variants = {
        primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
        secondary: 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50',
        ghost: 'border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
        white: 'bg-white text-brand-700 hover:bg-brand-50',
        ghostOnBlue: 'border border-white/20 bg-white/10 text-white hover:bg-white/15',
    } as const;

    return (
        <Link href={href} onClick={onClick} className={`${base} ${variants[variant]}`}>
            {children}
        </Link>
    );
}
