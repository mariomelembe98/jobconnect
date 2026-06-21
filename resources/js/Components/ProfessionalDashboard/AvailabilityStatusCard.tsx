import type { ProfessionalProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface AvailabilityStatusCardProps {
    availability: ProfessionalProfile['availability'];
}

const states: Record<ProfessionalProfile['availability'], { label: string; description: string; badge: 'green' | 'amber' | 'gray' }> = {
    available: { label: 'Disponível', description: 'Pode receber novos pedidos e convites.', badge: 'green' },
    busy: { label: 'Ocupado', description: 'O seu perfil indica capacidade limitada.', badge: 'amber' },
    away: { label: 'Ausente', description: 'Os clientes verão que está temporariamente ausente.', badge: 'gray' },
    vacation: { label: 'De férias', description: 'O seu perfil está marcado como indisponível por férias.', badge: 'gray' },
    unavailable: { label: 'Indisponível', description: 'Não está a aceitar novos trabalhos neste momento.', badge: 'gray' },
};

export function AvailabilityStatusCard({ availability }: AvailabilityStatusCardProps) {
    const state = states[availability];

    return (
        <Card className="h-full">
            <CardContent className="flex h-full items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold text-slate-950">Disponibilidade</h2>
                        <Badge variant={state.badge}>{state.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{state.description}</p>
                </div>
            </CardContent>
        </Card>
    );
}
