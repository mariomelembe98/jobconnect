import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { BrandMark } from '../Components/BrandMark';
import { getDashboardPath, getStoredAuthUser } from '../lib/auth';

interface MarketplaceLayoutProps {
    children: ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
    const currentUser = getStoredAuthUser();

    return (
        <div className="min-h-screen bg-surface">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-18 max-w-[96rem] items-center gap-4 px-page sm:px-8">
                    <Link href="/" aria-label="Página inicial"><BrandMark /></Link>
                    <nav className="ml-auto flex items-center gap-2" aria-label="Navegação pública">
                        <Link href="/professionals" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:block">Profissionais</Link>
                        <Link href="/help" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 md:block">Ajuda</Link>
                        {currentUser ? (
                            <Link href={getDashboardPath(currentUser.user_type)} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Minha área</Link>
                        ) : (
                            <Link href="/login" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Entrar</Link>
                        )}
                    </nav>
                </div>
            </header>
            <main>{children}</main>
            <footer className="mt-16 border-t border-slate-200 bg-white">
                <div className="mx-auto grid max-w-[96rem] gap-8 px-page py-10 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <div className="grid max-w-md gap-2">
                        <BrandMark />
                        <p className="text-sm leading-6 text-slate-500">Serviços de confiança em Moçambique.</p>
                    </div>
                    <nav className="grid content-start gap-2 text-sm" aria-label="Navegação do marketplace">
                        <p className="font-semibold text-slate-950">Marketplace</p>
                        <Link href="/professionals" className="text-slate-500 hover:text-brand-700">Explorar profissionais</Link>
                        <Link href="/help" className="text-slate-500 hover:text-brand-700">Central de ajuda</Link>
                    </nav>
                    <nav className="grid content-start gap-2 text-sm" aria-label="Navegação legal">
                        <p className="font-semibold text-slate-950">Legal</p>
                        <Link href="/terms" className="text-slate-500 hover:text-brand-700">Termos de utilização</Link>
                        <Link href="/privacy" className="text-slate-500 hover:text-brand-700">Privacidade</Link>
                    </nav>
                    <div className="border-t border-slate-200 pt-5 text-xs text-slate-400 md:col-span-3">
                        © {new Date().getFullYear()} ProConnect. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
