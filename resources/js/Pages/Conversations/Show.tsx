import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { ArchiveConversationModal } from '../../Components/Chat/ArchiveConversationModal';
import { ChatHeader } from '../../Components/Chat/ChatHeader';
import { MessageBubble } from '../../Components/Chat/MessageBubble';
import { MessageComposer } from '../../Components/Chat/MessageComposer';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ConversationsLayout } from '../../Layouts/ConversationsLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import type { ChatMessage, Conversation } from '../../types';

const messagePageSize = 30;

export default function ConversationShow({ conversationId }: { conversationId: number }) {
    const currentUser = getStoredAuthUser();
    const messageEndRef = useRef<HTMLDivElement>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [visibleCount, setVisibleCount] = useState(messagePageSize);
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [composerError, setComposerError] = useState<string | undefined>();
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const isParticipant = currentUser?.user_type === 'client' || currentUser?.user_type === 'professional';

    const loadConversation = useCallback(async (signal: AbortSignal) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const [conversationData, messageData] = await Promise.all([
                api.get<{ conversation: Conversation }>(`/conversations/${conversationId}`, { signal }),
                api.get<{ messages: ChatMessage[] }>(`/conversations/${conversationId}/messages`, { signal }),
            ]);

            if (signal.aborted) return;
            setConversation(conversationData.conversation);
            setMessages(messageData.messages);

            if (isParticipant) {
                try {
                    await api.post(`/conversations/${conversationId}/read`, undefined, { signal });
                } catch {
                    // Reading is best-effort and must not prevent access to the conversation.
                }
            }
        } catch (caughtError) {
            if (!signal.aborted) setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar esta conversa.');
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [conversationId, isParticipant]);

    useEffect(() => {
        const controller = new AbortController();
        void loadConversation(controller.signal);
        return () => controller.abort();
    }, [loadConversation, reloadKey]);

    useEffect(() => {
        if (!isLoading) messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isLoading, messages.length]);

    const visibleMessages = useMemo(() => messages.slice(-visibleCount), [messages, visibleCount]);

    async function sendMessage(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const cleanMessage = message.trim();

        if (!cleanMessage) {
            setComposerError('Escreva uma mensagem antes de enviar.');
            return;
        }

        const invalidFile = files.find((file) => file.size > 20 * 1024 * 1024 || !isAllowedFile(file));
        if (invalidFile) {
            setComposerError(`O ficheiro “${invalidFile.name}” não é suportado ou excede 20 MB.`);
            return;
        }

        setIsSending(true);
        setComposerError(undefined);
        setFeedback(null);

        try {
            const data = await api.post<{ message: ChatMessage }>(`/conversations/${conversationId}/messages`, { message: cleanMessage });
            setMessage('');
            setFiles([]);

            try {
                await Promise.all(files.map((file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    return api.post(`/messages/${data.message.id}/attachments`, formData);
                }));
                setFeedback({ type: 'success', message: 'Mensagem enviada com sucesso.' });
            } catch (attachmentError) {
                setFeedback({ type: 'error', message: attachmentError instanceof ApiError ? `A mensagem foi enviada, mas um anexo falhou: ${attachmentError.message}` : 'A mensagem foi enviada, mas não foi possível carregar todos os anexos.' });
            }

            setVisibleCount((count) => Math.max(count, messagePageSize));
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            if (caughtError instanceof ApiError) {
                setComposerError(caughtError.errors.message?.[0] ?? caughtError.message);
            } else {
                setComposerError('Não foi possível enviar a mensagem.');
            }
        } finally {
            setIsSending(false);
        }
    }

    async function archiveConversation(): Promise<void> {
        setIsArchiving(true);
        setFeedback(null);

        try {
            await api.post(`/conversations/${conversationId}/archive`);
            setArchiveOpen(false);
            setFeedback({ type: 'success', message: 'Conversa arquivada com sucesso.' });
            setReloadKey((value) => value + 1);
        } catch (caughtError) {
            setArchiveOpen(false);
            setFeedback({ type: 'error', message: caughtError instanceof ApiError ? caughtError.message : 'Não foi possível arquivar a conversa.' });
        } finally {
            setIsArchiving(false);
        }
    }

    return (
        <ConversationsLayout title="Conversa" description="Troque mensagens sobre o serviço contratado.">
            <Head title={conversation?.service_request?.title ?? 'Conversa'} />

            {isLoading && !conversation ? <ChatSkeleton /> : null}

            {!isLoading && error ? <EmptyState title="Não foi possível carregar a conversa" description={error} icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />} action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>} /> : null}

            {!error && conversation ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-card">
                    <ChatHeader conversation={conversation} viewerType={currentUser?.user_type} isRefreshing={isLoading} canArchive={isParticipant} onRefresh={() => setReloadKey((value) => value + 1)} onArchive={() => setArchiveOpen(true)} />

                    {feedback ? <div className={`border-b px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div> : null}

                    <div className="flex min-h-[32rem] max-h-[62vh] flex-col overflow-y-auto p-4 sm:p-6">
                        {messages.length > visibleCount ? <Button variant="ghost" size="sm" className="mx-auto mb-5" onClick={() => setVisibleCount((count) => count + messagePageSize)}>Carregar mensagens anteriores</Button> : null}
                        {visibleMessages.length > 0 ? <div className="grid gap-3">{visibleMessages.map((chatMessage) => <MessageBubble key={chatMessage.id} message={chatMessage} currentUserId={currentUser?.id} />)}</div> : <div className="grid flex-1 place-items-center"><EmptyState className="min-h-52 w-full max-w-lg" title="Ainda não existem mensagens" description="Envie a primeira mensagem para iniciar esta conversa." /></div>}
                        <div ref={messageEndRef} />
                    </div>

                    <MessageComposer message={message} files={files} error={composerError} isSending={isSending} disabled={!isParticipant || conversation.status === 'archived'} onMessageChange={setMessage} onFilesChange={setFiles} onSubmit={sendMessage} />
                </div>
            ) : null}

            <div className="mt-4"><Button variant="ghost" onClick={() => router.visit('/conversations')}>Voltar às conversas</Button></div>
            <ArchiveConversationModal open={archiveOpen} isLoading={isArchiving} onConfirm={archiveConversation} onClose={() => setArchiveOpen(false)} />
        </ConversationsLayout>
    );
}

function isAllowedFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension !== undefined && ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension);
}

function ChatSkeleton() {
    return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card" aria-label="A carregar conversa" aria-busy="true"><div className="flex items-center gap-3 border-b border-slate-200 p-5"><LoadingSkeleton className="size-11 rounded-xl" /><div className="grid flex-1 gap-2"><LoadingSkeleton className="h-5 w-40" /><LoadingSkeleton className="h-4 w-64" /></div></div><div className="grid min-h-[32rem] content-end gap-4 bg-slate-50 p-6"><LoadingSkeleton className="h-20 w-2/3 rounded-2xl" /><LoadingSkeleton className="ml-auto h-24 w-2/3 rounded-2xl" /><LoadingSkeleton className="h-16 w-1/2 rounded-2xl" /></div><div className="flex gap-3 border-t border-slate-200 p-4"><LoadingSkeleton className="size-11 rounded-xl" /><LoadingSkeleton className="h-11 flex-1 rounded-xl" /><LoadingSkeleton className="h-11 w-24 rounded-xl" /></div></div>;
}
