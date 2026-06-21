import { formatCurrency, initials } from '../../lib/formatters';
import type { ProfessionalProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface ProfessionalCardProps {
    professional: ProfessionalProfile;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
    const name = professional.user?.name ?? 'Profissional ProConnect';
    const location = [professional.city, professional.province].filter(Boolean).join(', ');
    const rating = Number(professional.average_rating || 0).toFixed(1);

    return (
        <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="grid h-full gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-bold text-brand-700">
                        {initials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-slate-950">{name}</h3>
                            {professional.verification_status === 'approved' ? <Badge variant="blue">Verificado</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{professional.headline}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                        <span aria-hidden="true">★</span> {rating}
                    </span>
                    <span>{professional.total_reviews} avaliações</span>
                    {location ? <span>{location}</span> : null}
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                        <p className="text-xs text-slate-500">Preço base</p>
                        <p className="mt-0.5 font-semibold text-slate-950">
                            {professional.base_price ? formatCurrency(professional.base_price) : 'A combinar'}
                        </p>
                    </div>
                    <Badge variant={professional.availability === 'available' ? 'green' : 'gray'}>
                        {professional.availability === 'available' ? 'Disponível' : 'Indisponível'}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
