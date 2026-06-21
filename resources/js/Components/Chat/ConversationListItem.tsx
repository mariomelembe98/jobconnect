import { Link } from '@inertiajs/react';

import { Badge } from '../ui/Badge';
import { formatDateTime, initials } from '../../lib/formatters';
import type { ConversationSummary, UserType } from '../../types';

interface ConversationListItemProps {
    summary: ConversationSummary;
    viewerType?: UserType;
}

export function ConversationListItem({ summary, viewerType }: ConversationListItemProps) {
    const { conversation, lastMessage, unreadCount } = summary;
    const participant = viewerType === 'client' ? conversation.professional_profile?.user : conversation.client;
    const participantName = participant?.name ?? 'Participante';

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-elevated sm:p-5">
            <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 font-bold text-brand-700">
                    {participant?.avatar ? <img src={participant.avatar} alt="" className="size-full object-cover" /> : initials(participantName)}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="truncate font-bold text-slate-950">{participantName}</h2>
                            <p className="mt-0.5 truncate text-sm font-medium text-brand-700">{conversation.service_request?.title ?? 'Conversa de serviço'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 ? <span className="flex min-w-6 items-center justify-center rounded-full bg-brand-600 px-2 py-1 text-xs font-bold text-white" aria-label={`${unreadCount} mensagens não lidas`}>{unreadCount}</span> : null}
                            <Badge variant={conversation.status === 'active' ? 'green' : 'gray'}>{conversation.status === 'active' ? 'Ativa' : 'Arquivada'}</Badge>
                        </div>
                    </div>
                    <p className={`mt-3 line-clamp-2 text-sm leading-6 ${unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                        {lastMessage?.message ?? 'Ainda não existem mensagens nesta conversa.'}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="text-xs text-slate-400">{lastMessage?.created_at ? formatDateTime(lastMessage.created_at) : 'Conversa sem mensagens'}</span>
                        <Link href={`/conversations/${conversation.id}`} className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">Abrir conversa</Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
