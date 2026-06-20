import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { BrandMark } from '../Components/BrandMark';
import type { AppPageProps } from '../types';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
    const { appName } = usePage<AppPageProps>().props;

    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(30rem,0.95fr)]">
            <section className="relative hidden overflow-hidden bg-brand-700 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(96_165_250_/_0.35),transparent_32%),radial-gradient(circle_at_80%_70%,rgb(30_64_175_/_0.9),transparent_45%)]" />
                <div className="absolute -right-24 top-28 size-80 rounded-full border border-white/10" />
                <div className="absolute -right-8 top-44 size-48 rounded-full border border-white/10" />

                <BrandMark inverse className="relative" />

                <div className="relative max-w-xl pb-16">
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-brand-100 backdrop-blur">
                        Serviços de confiança, perto de si
                    </span>
                    <h1 className="mt-6 text-display font-semibold tracking-tight text-balance">
                        Encontre profissionais qualificados para fazer acontecer.
                    </h1>
                    <p className="mt-5 max-w-lg text-lg leading-8 text-brand-100">
                        Publique o seu pedido, compare propostas e acompanhe cada serviço com transparência.
                    </p>
                    <div className="mt-10 grid grid-cols-3 gap-4">
                        {[
                            ['Verificados', 'Profissionais'],
                            ['Simples', 'Propostas'],
                            ['Seguro', 'Acompanhamento'],
                        ].map(([value, label]) => (
                            <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                <p className="font-semibold">{value}</p>
                                <p className="mt-1 text-sm text-brand-200">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} {appName}. Todos os direitos reservados.</p>
            </section>

            <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
                <div className="flex items-center justify-between lg:hidden">
                    <Link href="/login"><BrandMark /></Link>
                    <span className="text-xs font-medium text-slate-400">Marketplace de serviços</span>
                </div>
                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
                    <div className="mb-8 grid gap-2">
                        <h2 className="text-page-title font-semibold tracking-tight text-slate-950">{title}</h2>
                        <p className="leading-7 text-slate-500">{description}</p>
                    </div>
                    {children}
                </div>
            </section>
        </main>
    );
}
