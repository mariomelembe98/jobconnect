import type { ReactNode } from 'react';

interface PublicPageHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
    notice?: ReactNode;
}

export function PublicPageHeader({ eyebrow, title, description, notice }: PublicPageHeaderProps) {
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto grid max-w-5xl gap-5 px-page py-12 sm:px-8 sm:py-16">
                <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>
                <div className="grid max-w-3xl gap-3">
                    <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">{title}</h1>
                    <p className="text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
                </div>
                {notice}
            </div>
        </header>
    );
}

export function DraftNotice({ children }: { children: ReactNode }) {
    return (
        <div className="max-w-3xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="note">
            <strong>Documento em rascunho.</strong> {children}
        </div>
    );
}

interface PublicContentSectionProps {
    id?: string;
    title: string;
    children: ReactNode;
}

export function PublicContentSection({ id, title, children }: PublicContentSectionProps) {
    return (
        <section id={id} className="grid gap-3 border-b border-slate-200 py-8 last:border-b-0">
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2>
            <div className="grid gap-3 text-sm leading-7 text-slate-600 sm:text-base">{children}</div>
        </section>
    );
}

export function PublicBulletList({ items }: { items: string[] }) {
    return (
        <ul className="grid gap-2 pl-5">
            {items.map((item) => (
                <li key={item} className="list-disc pl-1 marker:text-brand-600">{item}</li>
            ))}
        </ul>
    );
}
