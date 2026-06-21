import { formatDate } from '../../lib/formatters';
import type { ProfessionalInvitation } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface InvitationCardProps {
    invitation: ProfessionalInvitation;
}

const labels: Record<ProfessionalInvitation['status'], string> = {
    pending: 'Pendente',
    accepted: 'Aceite',
    declined: 'Recusado',
};

export function InvitationCard({ invitation }: InvitationCardProps) {
    const location = [invitation.service_request?.city, invitation.service_request?.province].filter(Boolean).join(', ');

    return (
        <Card className="h-full transition hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">Convite de {invitation.client?.name ?? 'um cliente'}</p>
                        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-950">{invitation.service_request?.title ?? 'Novo pedido de serviço'}</h3>
                    </div>
                    <Badge variant={invitation.status === 'pending' ? 'amber' : invitation.status === 'accepted' ? 'green' : 'gray'}>{labels[invitation.status]}</Badge>
                </div>
                {invitation.message ? <p className="line-clamp-3 text-sm leading-6 text-slate-500">{invitation.message}</p> : null}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>{location || 'Local a confirmar'}</span>
                    <span>{formatDate(invitation.created_at)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
