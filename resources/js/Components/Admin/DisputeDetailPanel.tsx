import type { ReactNode } from 'react';

import { AdminStatusBadge } from './AdminStatusBadge';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { formatDateTime, formatFileSize } from '../../lib/formatters';

export interface AdminDisputeItem {
    id: number;
    contract_id: number;
    opened_by: number;
    assigned_to: number | null;
    reason: string;
    description: string | null;
    status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    resolution: 'favor_client' | 'favor_professional' | 'mutual_agreement' | 'dismissed' | null;
    resolution_note: string | null;
    resolved_at: string | null;
    contract?: {
        id: number;
        status: 'active' | 'completed' | 'cancelled' | 'disputed';
        client_id: number;
        professional_profile_id: number;
    } | null;
    opener?: { id: number; name: string } | null;
    assignee?: { id: number; name: string } | null;
    evidence?: Array<{
        id: number;
        file_name: string;
        file_type: string | null;
        file_size: number | null;
        file_url: string | null;
        uploader?: { id: number; name: string } | null;
        created_at: string;
    }>;
    messages?: Array<{
        id: number;
        message: string;
        sender?: { id: number; name: string } | null;
        created_at: string;
    }>;
    created_at?: string;
    updated_at?: string;
}

interface DisputeDetailPanelProps {
    dispute: AdminDisputeItem | null;
    actionSlot?: ReactNode;
    onAssignToMe: () => void;
    onResolve: () => void;
    isAssigning?: boolean;
    isResolving?: boolean;
}

export function DisputeDetailPanel({ dispute, actionSlot, onAssignToMe, onResolve, isAssigning = false, isResolving = false }: DisputeDetailPanelProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                {dispute ? (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Detalhe da disputa</p>
                                <h3 className="mt-1 text-xl font-bold text-slate-950"># {dispute.id}</h3>
                                <p className="mt-1 text-sm text-slate-500">{formatDateTime(dispute.created_at ?? new Date())}</p>
                            </div>
                            <AdminStatusBadge kind="dispute" value={dispute.status} />
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Info label="Contrato" value={`#${dispute.contract_id}`} />
                            <Info label="Aberta por" value={dispute.opener?.name ?? `Utilizador #${dispute.opened_by}`} />
                            <Info label="Atribuída a" value={dispute.assignee?.name ?? 'Sem atribuição'} />
                            <Info label="Resolução" value={dispute.resolution ? resolutionLabel(dispute.resolution) : '—'} />
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                            <Info label="Estado do contrato" value={dispute.contract ? dispute.contract.status : '—'} />
                            <Info label="Contrato relacionado" value={dispute.contract ? `Cliente #${dispute.contract.client_id} · Profissional #${dispute.contract.professional_profile_id}` : '—'} />
                            <Info label="Resolvida em" value={dispute.resolved_at ? formatDateTime(dispute.resolved_at) : '—'} />
                        </div>

                        {dispute.description ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{dispute.description}</p> : <EmptyState title="Sem descrição" description="A disputa não inclui descrição adicional." />}

                        {dispute.resolution_note ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{dispute.resolution_note}</p> : null}

                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold text-slate-950">Provas</h4>
                                <Badge variant="gray">{dispute.evidence?.length ?? 0}</Badge>
                            </div>
                            {dispute.evidence && dispute.evidence.length > 0 ? (
                                <div className="grid gap-3">
                                    {dispute.evidence.map((item) => (
                                        <article key={item.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h5 className="font-semibold text-slate-950">{item.file_name}</h5>
                                                    <p className="mt-1 text-xs text-slate-500">{item.uploader?.name ?? 'Sem autor'}</p>
                                                </div>
                                                {item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">Abrir</a> : null}
                                            </div>
                                            <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                                                <span>{item.file_type ?? '—'}</span>
                                                <span>{formatFileSize(item.file_size)}</span>
                                                <span>{formatDateTime(item.created_at)}</span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="Sem provas" description="Ainda não foram anexados ficheiros nesta disputa." />
                            )}
                        </div>

                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold text-slate-950">Mensagens</h4>
                                <Badge variant="gray">{dispute.messages?.length ?? 0}</Badge>
                            </div>
                            {dispute.messages && dispute.messages.length > 0 ? (
                                <div className="grid gap-3">
                                    {dispute.messages.map((message) => (
                                        <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h5 className="font-semibold text-slate-950">{message.sender?.name ?? 'Utilizador'}</h5>
                                                <span className="text-xs text-slate-500">{formatDateTime(message.created_at)}</span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{message.message}</p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="Sem mensagens" description="A conversa da disputa ainda não tem mensagens." />
                            )}
                        </div>

                        {actionSlot}

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={onAssignToMe} isLoading={isAssigning}>Atribuir a mim</Button>
                            <Button onClick={onResolve} isLoading={isResolving}>Resolver disputa</Button>
                        </div>
                    </>
                ) : (
                    <EmptyState title="Selecione uma disputa" description="Clique numa linha da lista para abrir os detalhes." />
                )}
            </CardContent>
        </Card>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function resolutionLabel(value: NonNullable<AdminDisputeItem['resolution']>): string {
    return {
        favor_client: 'Favor do cliente',
        favor_professional: 'Favor do profissional',
        mutual_agreement: 'Acordo mútuo',
        dismissed: 'Descartada',
    }[value];
}
