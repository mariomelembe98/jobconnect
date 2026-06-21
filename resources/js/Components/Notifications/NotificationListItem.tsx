import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { NotificationTypeIcon } from './NotificationTypeIcon';
import { formatDateTime } from '../../lib/formatters';
import type { Notification, NotificationType } from '../../types';

interface NotificationListItemProps {
    notification: Notification;
    isMarkingRead: boolean;
    isDeleting: boolean;
    onMarkRead: () => void;
    onDelete: () => void;
}

const typeLabels: Record<NotificationType, string> = {
    proposal_received: 'Proposta recebida',
    proposal_accepted: 'Proposta aceite',
    proposal_rejected: 'Proposta rejeitada',
    contract_created: 'Contrato criado',
    contract_completed: 'Contrato concluído',
    contract_cancelled: 'Contrato cancelado',
    new_message: 'Nova mensagem',
    verification_approved: 'Verificação aprovada',
    verification_rejected: 'Verificação rejeitada',
    review_received: 'Avaliação recebida',
    dispute_opened: 'Disputa aberta',
    dispute_resolved: 'Disputa resolvida',
    system: 'Sistema',
};

export function NotificationListItem({ notification, isMarkingRead, isDeleting, onMarkRead, onDelete }: NotificationListItemProps) {
    return (
        <article className={`relative rounded-2xl border p-4 shadow-card transition sm:p-5 ${notification.is_read ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50/40'}`}>
            {!notification.is_read ? <span className="absolute right-4 top-4 size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-100" aria-label="Não lida" /> : null}
            <div className="flex items-start gap-4 pr-4">
                <NotificationTypeIcon type={notification.type} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className={`text-base text-slate-950 ${notification.is_read ? 'font-semibold' : 'font-bold'}`}>{notification.title}</h2>
                        <Badge variant={notification.is_read ? 'gray' : 'blue'}>{notification.is_read ? 'Lida' : 'Nova'}</Badge>
                    </div>
                    {notification.body ? <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400"><span>{typeLabels[notification.type]}</span><span aria-hidden="true">•</span><time dateTime={notification.created_at}>{formatDateTime(notification.created_at)}</time></div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {!notification.is_read ? <Button variant="secondary" size="sm" isLoading={isMarkingRead} disabled={isDeleting} onClick={onMarkRead}>Marcar como lida</Button> : null}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" isLoading={isDeleting} disabled={isMarkingRead} onClick={onDelete}>Eliminar</Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
