import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { ConversationListItem } from '../../Components/Chat/ConversationListItem';
import { MiniIcon } from '../../Components/Dashboard/StatCard';
import { Button } from '../../Components/ui/Button';
import { EmptyState } from '../../Components/ui/EmptyState';
import { LoadingSkeleton } from '../../Components/ui/LoadingSkeleton';
import { ConversationsLayout } from '../../Layouts/ConversationsLayout';
import { api, ApiError } from '../../lib/api';
import { getAuthToken, getStoredAuthUser } from '../../lib/auth';
import { formatNumber } from '../../lib/formatters';
import type { ChatMessage, Conversation, ConversationSummary, PaginatedData, Pagination } from '../../types';

type ConversationsData = PaginatedData<'conversations', Conversation>;

const initialPagination: Pagination = { current_page: 1, per_page: 15, last_page: 1, total: 0 };

export default function ConversationsIndex() {
    const currentUser = getStoredAuthUser();
    const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const loadConversations = useCallback(async (signal: AbortSignal, currentPage: number) => {
        if (!getAuthToken()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await api.get<ConversationsData>('/conversations', { signal, query: { page: currentPage } });
            const messageResults = await Promise.allSettled(
                data.conversations.map((conversation) => api.get<{ messages: ChatMessage[] }>(`/conversations/${conversation.id}/messages`, { signal })),
            );

            if (signal.aborted) return;

            setSummaries(data.conversations.map((conversation, index) => {
                const result = messageResults[index];
                const messages = result?.status === 'fulfilled' ? result.value.messages : [];

                return {
                    conversation,
                    lastMessage: messages.at(-1) ?? null,
                    unreadCount: messages.filter((message) => message.sender_id !== currentUser?.id && message.read_at === null).length,
                };
            }));
            setPagination(data.pagination);
        } catch (caughtError) {
            if (!signal.aborted) {
                setError(caughtError instanceof ApiError ? caughtError.message : 'Não foi possível carregar as conversas.');
            }
        } finally {
            if (!signal.aborted) setIsLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        const controller = new AbortController();
        void loadConversations(controller.signal, page);
        return () => controller.abort();
    }, [loadConversations, page, reloadKey]);

    return (
        <ConversationsLayout title="Mensagens" description="Acompanhe as conversas sobre os seus serviços.">
            <Head title="Mensagens" />

            <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-card sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-sm font-semibold text-brand-100">Comunicação</p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">As suas conversas</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-50">Converse com clientes e profissionais mantendo o contexto de cada serviço.</p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm"><p className="text-xs text-brand-100">Total</p><p className="mt-1 text-2xl font-bold">{formatNumber(pagination.total)}</p></div>
                </div>
            </section>

            {isLoading && summaries.length === 0 ? <ConversationsSkeleton /> : null}

            {!isLoading && error ? (
                <EmptyState
                    title="Não foi possível carregar as conversas"
                    description={error}
                    icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />}
                    action={<Button onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button>}
                />
            ) : null}

            {!error && (!isLoading || summaries.length > 0) ? (
                <div className="grid gap-5">
                    <div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{formatNumber(pagination.total)} conversas encontradas</p><Button variant="outline" size="sm" isLoading={isLoading} onClick={() => setReloadKey((value) => value + 1)}>Atualizar</Button></div>
                    {summaries.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{summaries.map((summary) => <ConversationListItem key={summary.conversation.id} summary={summary} viewerType={currentUser?.user_type} />)}</div> : <EmptyState title="Ainda não existem conversas" description="Uma conversa será criada quando uma proposta for aceite." />}
                    {pagination.last_page > 1 ? (
                        <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="Paginação">
                            <Button variant="outline" size="sm" disabled={pagination.current_page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                            <span className="text-sm text-slate-500">Página {pagination.current_page} de {pagination.last_page}</span>
                            <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page || isLoading} onClick={() => setPage((current) => current + 1)}>Seguinte</Button>
                        </nav>
                    ) : null}
                </div>
            ) : null}
        </ConversationsLayout>
    );
}

function ConversationsSkeleton() {
    return <div className="grid gap-4 xl:grid-cols-2" aria-label="A carregar conversas" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex min-h-48 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><LoadingSkeleton className="size-12 shrink-0 rounded-2xl" /><div className="grid flex-1 gap-3"><LoadingSkeleton className="h-5 w-40" /><LoadingSkeleton className="h-4 w-2/3" /><LoadingSkeleton className="h-12 w-full" /><LoadingSkeleton className="mt-auto h-9 w-28" /></div></div>)}</div>;
}
