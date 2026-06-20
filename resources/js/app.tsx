import '../css/app.css';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { APP_NAME } from './lib/constants';

const pages = import.meta.glob<{ default: ResolvedComponent }>('./Pages/**/*.tsx', { eager: true });

createInertiaApp({
    title: (title) => (title ? `${title} — ${APP_NAME}` : APP_NAME),
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`];

        if (!page) throw new Error(`Página Inertia não encontrada: ${name}`);

        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#2563eb',
        showSpinner: false,
    },
});
