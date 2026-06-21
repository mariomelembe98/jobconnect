import { initials } from '../../lib/formatters';
import type { ProfessionalProfile } from '../../types';
import { Badge } from '../ui/Badge';

export function ProfessionalDetailHeader({ professional }: { professional: ProfessionalProfile }) {
    const name = professional.user?.name ?? 'Profissional ProConnect';
    const location = [professional.city, professional.province].filter(Boolean).join(', ');

    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 px-5 py-8 text-white shadow-elevated sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-2xl font-bold ring-1 ring-white/20">{initials(name)}</div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
                        {professional.verification_status === 'approved' ? <Badge className="bg-white/15 text-white ring-white/20">Perfil verificado</Badge> : null}
                    </div>
                    <p className="mt-2 text-base text-blue-50 sm:text-lg">{professional.headline || 'Profissional de serviços'}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
                        <span>{location || 'Moçambique'}</span>
                        <span>★ {Number(professional.average_rating).toFixed(1)} ({professional.total_reviews} avaliações)</span>
                        <span>{professional.availability === 'available' ? 'Disponível' : 'Indisponível neste momento'}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
