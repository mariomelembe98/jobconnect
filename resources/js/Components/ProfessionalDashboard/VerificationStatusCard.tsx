import type { ProfessionalProfile } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface VerificationStatusCardProps {
    status: ProfessionalProfile['verification_status'];
}

const states: Record<ProfessionalProfile['verification_status'], { label: string; description: string; badge: 'blue' | 'green' | 'amber' | 'red' | 'gray' }> = {
    approved: { label: 'Perfil verificado', description: 'A sua identidade profissional está confirmada.', badge: 'green' },
    pending: { label: 'Verificação pendente', description: 'Envie os documentos necessários para validação.', badge: 'amber' },
    under_review: { label: 'Em análise', description: 'A equipa está a analisar os seus documentos.', badge: 'blue' },
    rejected: { label: 'Verificação rejeitada', description: 'Reveja os documentos submetidos no seu perfil.', badge: 'red' },
    expired: { label: 'Verificação expirada', description: 'Actualize os seus documentos para voltar a verificar o perfil.', badge: 'gray' },
};

export function VerificationStatusCard({ status }: VerificationStatusCardProps) {
    const state = states[status];

    return (
        <Card className="h-full">
            <CardContent className="flex h-full items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" strokeLinejoin="round" />
                        <path d="m9 12 2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold text-slate-950">Verificação</h2>
                        <Badge variant={state.badge}>{state.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{state.description}</p>
                </div>
            </CardContent>
        </Card>
    );
}
