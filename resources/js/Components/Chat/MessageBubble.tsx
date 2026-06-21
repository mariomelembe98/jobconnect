import { MessageAttachmentPreview } from './MessageAttachmentPreview';
import { formatDateTime } from '../../lib/formatters';
import type { ChatMessage } from '../../types';

export function MessageBubble({ message, currentUserId }: { message: ChatMessage; currentUserId?: number }) {
    const isOwn = message.sender_id === currentUserId;

    if (message.message_type === 'system') {
        return <div className="mx-auto max-w-xl rounded-full bg-slate-100 px-4 py-2 text-center text-xs text-slate-500">{message.message}</div>;
    }

    return (
        <article className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[72%] ${isOwn ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                {!isOwn ? <p className="mb-1 text-xs font-semibold text-brand-700">{message.sender?.name ?? 'Participante'}</p> : null}
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.message}</p>
                {message.attachments?.length ? <div className="mt-3 grid gap-2">{message.attachments.map((attachment) => <MessageAttachmentPreview key={attachment.id} attachment={attachment} />)}</div> : null}
                <p className={`mt-2 text-right text-[0.68rem] ${isOwn ? 'text-brand-100' : 'text-slate-400'}`}>{formatDateTime(message.created_at)}{isOwn && message.read_at ? ' · Lida' : ''}</p>
            </div>
        </article>
    );
}
