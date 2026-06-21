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
                <div className="mx-auto flex max-w-[96rem] flex-col gap-2 px-page py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <span>ProConnect — serviços de confiança em Moçambique.</span>
                    <Link href="/professionals" className="font-medium text-brand-700">Explorar profissionais</Link>
                </div>
            </footer>
        </div>
    );
}
