import '../css/app.css';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { lazy, StrictMode, Suspense, type LazyExoticComponent, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import { APP_NAME } from './lib/constants';

const pages = import.meta.glob<{ default: ResolvedComponent }>('./Pages/**/*.tsx');
const lazyPages = new Map<string, LazyExoticComponent<ComponentType<unknown>>>();

function getLazyPage(name: string): LazyExoticComponent<ComponentType<unknown>> {
    const cached = lazyPages.get(name);
    if (cached) {
        return cached;
    }

    const page = pages[`./Pages/${name}.tsx`];

    if (!page) {
        throw new Error(`Página Inertia não encontrada: ${name}`);
    }

    const resolved = lazy(async () => {
        const module = await page();
        return { default: module.default as ComponentType<unknown> };
    });

    lazyPages.set(name, resolved);

    return resolved;
}

createInertiaApp({
    title: (title) => (title ? `${title} — ${APP_NAME}` : APP_NAME),
    resolve: (name) => getLazyPage(name),
    setup({ el, App, props }) {
        createRoot(el).render(
            <StrictMode>
                <Suspense fallback={<AppShellFallback />}>
                    <App {...props} />
                </Suspense>
            </StrictMode>,
        );
    },
    progress: {
        color: '#2563eb',
        showSpinner: false,
    },
});

function AppShellFallback() {
    return (
        <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
            <div className="max-w-sm">
                <div className="mx-auto size-12 animate-pulse rounded-2xl bg-brand-100" />
                <p className="mt-4 text-sm font-medium text-slate-600">A carregar a página…</p>
            </div>
        </div>
    );
}
