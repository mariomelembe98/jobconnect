import { Link, usePage } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

import { BrandMark } from '../Components/BrandMark';
import { Button } from '../Components/ui/Button';
import { cn } from '../lib/utils';

export type NavigationIcon = 'home' | 'briefcase' | 'search' | 'chat' | 'bell' | 'user' | 'file' | 'users' | 'grid' | 'shield';

export interface NavigationItem {
    label: string;
    href: string;
    icon: NavigationIcon;
    badge?: string;
}

interface AppLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    navigation: NavigationItem[];
    sectionLabel: string;
    actions?: ReactNode;
    admin?: boolean;
}

function NavigationGlyph({ icon }: { icon: NavigationIcon }) {
    const paths: Record<NavigationIcon, ReactNode> = {
        home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
        briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        chat: <path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.5-5A9 9 0 1 1 21 12Z" />,
        bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
        file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
        users: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M17 7a3 3 0 0 1 0 6M18 17a5 5 0 0 1 4 4" /></>,
        grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />,
    };

    return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[icon]}</svg>;
}

export function AppLayout({ children, title, description, navigation, sectionLabel, actions, admin = false }: AppLayoutProps) {
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);

    const navContent = (
        <>
            <div className="px-3 py-2"><BrandMark inverse={admin} /></div>
            <div className="mt-7 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{sectionLabel}</div>
            <nav className="mt-3 grid gap-1.5" aria-label="Navegação principal">
                {navigation.map((item) => {
                    const active = item.href !== '#' && (url === item.href || url.startsWith(`${item.href}/`));
                    const classes = cn(
                        'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                        admin
                            ? active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            : active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    );
                    const content = <><NavigationGlyph icon={item.icon} /><span className="flex-1">{item.label}</span>{item.badge ? <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.65rem] font-bold text-white">{item.badge}</span> : null}</>;

                    return item.href === '#' ? <span key={item.label} className={classes}>{content}</span> : <Link key={item.label} href={item.href} className={classes} onClick={() => setMenuOpen(false)}>{content}</Link>;
                })}
            </nav>
        </>
    );

    return (
        <div className="min-h-screen bg-surface">
            <aside className={cn('fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r px-4 py-5 lg:flex', admin ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white')}>
                {navContent}
                <div className={cn('mt-auto rounded-2xl p-4', admin ? 'bg-white/5' : 'bg-slate-50')}>
                    <p className={cn('text-sm font-semibold', admin ? 'text-white' : 'text-slate-900')}>Precisa de ajuda?</p>
                    <p className={cn('mt-1 text-xs leading-5', admin ? 'text-slate-400' : 'text-slate-500')}>Consulte o centro de suporte da plataforma.</p>
                </div>
            </aside>

            {menuOpen ? <button className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} /> : null}
            <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-72 flex-col px-4 py-5 shadow-elevated transition-transform lg:hidden', admin ? 'bg-slate-950' : 'bg-white', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
                {navContent}
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
                    <div className="flex h-18 items-center gap-4 px-page sm:px-8">
                        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
                            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
                            {description ? <p className="hidden truncate text-sm text-slate-500 sm:block">{description}</p> : null}
                        </div>
                        {actions}
                        <button className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Notificações">
                            <NavigationGlyph icon="bell" />
                            <span className="absolute right-2 top-2 size-2 rounded-full bg-brand-500 ring-2 ring-white" />
                        </button>
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">PC</div>
                    </div>
                </header>
                <main className="mx-auto w-full max-w-[96rem] px-page py-6 sm:px-8 sm:py-8">{children}</main>
            </div>
        </div>
    );
}
