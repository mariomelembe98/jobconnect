import { Link } from '@inertiajs/react';

import { formatCurrency, initials } from '../../lib/formatters';
import type { ProfessionalProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

export function ProfessionalDirectoryCard({ professional }: { professional: ProfessionalProfile }) {
    const name = professional.user?.name ?? 'Profissional ProConnect';
    const location = [professional.city, professional.province].filter(Boolean).join(', ');

    return (
        <Card className="group h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-5">
                <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 font-bold text-brand-700">{initials(name)}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-semibold text-slate-950">{name}</h2>
                            {professional.verification_status === 'approved' ? <Badge variant="blue">Verificado</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{professional.headline || 'Profissional de serviços'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {professional.categories?.slice(0, 2).map((category) => <Badge key={category.id} variant="gray">{category.name}</Badge>)}
                    {professional.skills?.slice(0, 1).map((skill) => <Badge key={skill.id} variant="violet">{skill.name}</Badge>)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Avaliação</p><p className="mt-1 font-semibold text-amber-600">★ {Number(professional.average_rating).toFixed(1)} <span className="font-normal text-slate-500">({professional.total_reviews})</span></p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Experiência</p><p className="mt-1 font-semibold text-slate-900">{professional.experience_years} anos</p></div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                    <div className="min-w-0">
                        <p className="truncate text-xs text-slate-500">{location || 'Moçambique'}</p>
                        <p className="mt-1 font-semibold text-slate-950">{professional.base_price ? formatCurrency(professional.base_price) : 'Preço a combinar'}</p>
                    </div>
                    <Link href={`/professionals/${professional.id}`} className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Ver perfil</Link>
                </div>
            </CardContent>
        </Card>
    );
}
