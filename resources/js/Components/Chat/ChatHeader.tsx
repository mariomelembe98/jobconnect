import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { initials } from '../../lib/formatters';
import type { Conversation, UserType } from '../../types';

interface ChatHeaderProps {
    conversation: Conversation;
    viewerType?: UserType;
    isRefreshing: boolean;
    canArchive: boolean;
    onRefresh: () => void;
    onArchive: () => void;
}

export function ChatHeader({ conversation, viewerType, isRefreshing, canArchive, onRefresh, onArchive }: ChatHeaderProps) {
    const participant = viewerType === 'client' ? conversation.professional_profile?.user : conversation.client;
    const participantName = participant?.name ?? 'Participante';

    return (
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 font-bold text-brand-700">
                    {participant?.avatar ? <img src={participant.avatar} alt="" className="size-full object-cover" /> : initials(participantName)}
                </span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-bold text-slate-950">{participantName}</h1><Badge variant={conversation.status === 'active' ? 'green' : 'gray'}>{conversation.status === 'active' ? 'Ativa' : 'Arquivada'}</Badge></div>
                    <p className="mt-1 truncate text-sm text-slate-500">{conversation.service_request?.title ?? 'Conversa de serviço'}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" isLoading={isRefreshing} onClick={onRefresh}>Atualizar</Button>
                {canArchive && conversation.status === 'active' ? <Button variant="ghost" size="sm" onClick={onArchive}>Arquivar</Button> : null}
            </div>
        </header>
    );
}
