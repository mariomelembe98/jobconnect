import type { ProfessionalDocument } from '../../types';
import { formatFileSize } from '../../lib/formatters';
import { AdminStatusBadge } from './AdminStatusBadge';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

export interface AdminVerificationProfile {
    id: number;
    verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
    user?: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        user_type?: string;
        status?: string;
        location?: {
            province: string | null;
            city: string | null;
            address: string | null;
        };
    } | null;
    documents?: ProfessionalDocument[];
    documents_count?: number;
    pending_documents_count?: number;
    approved_documents_count?: number;
    rejected_documents_count?: number;
    created_at?: string;
    updated_at?: string;
}

interface VerificationDetailPanelProps {
    verification: AdminVerificationProfile | null;
    isApproving?: boolean;
    isRejecting?: boolean;
    downloadingDocumentId?: number | null;
    onApprove: () => void;
    onReject: () => void;
    onDownloadDocument: (document: ProfessionalDocument) => void;
}

export function VerificationDetailPanel({ verification, isApproving = false, isRejecting = false, downloadingDocumentId = null, onApprove, onReject, onDownloadDocument }: VerificationDetailPanelProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                {verification ? (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Detalhe da verificação</p>
                                <h3 className="mt-1 text-xl font-bold text-slate-950">{verification.user?.name ?? `Profissional #${verification.id}`}</h3>
                                <p className="mt-1 text-sm text-slate-500">{verification.user?.email ?? 'Sem email'}</p>
                            </div>
                            <AdminStatusBadge kind="verification" value={verification.verification_status} />
                        </div>

                        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Stat label="Documentos" value={verification.documents_count ?? 0} />
                            <Stat label="Pendentes" value={verification.pending_documents_count ?? 0} />
                            <Stat label="Aprovados" value={verification.approved_documents_count ?? 0} />
                            <Stat label="Rejeitados" value={verification.rejected_documents_count ?? 0} />
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                            <Line label="Telefone" value={verification.user?.phone ?? '—'} />
                            <Line label="Tipo de utilizador" value={verification.user?.user_type ?? '—'} />
                            <Line label="Estado do utilizador" value={verification.user?.status ?? '—'} />
                            <Line label="Localização" value={[verification.user?.location?.province, verification.user?.location?.city].filter(Boolean).join(' · ') || '—'} />
                        </div>

                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="font-semibold text-slate-950">Documentos enviados</h4>
                                <Badge variant="gray">{verification.documents?.length ?? 0}</Badge>
                            </div>
                            {verification.documents && verification.documents.length > 0 ? (
                                <div className="grid gap-3">
                                    {verification.documents.map((document) => (
                                        <article key={document.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h5 className="font-semibold text-slate-950">{document.file_name}</h5>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{document.document_type}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <AdminStatusBadge kind="verification" value={document.status} />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        isLoading={downloadingDocumentId === document.id}
                                                        onClick={() => onDownloadDocument(document)}
                                                    >
                                                        Descarregar
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                                                <span>{document.file_type ?? '—'}</span>
                                                <span>{formatFileSize(document.file_size)}</span>
                                                <span>{document.reviewed_at ? `Revisto em ${document.reviewed_at}` : 'Pendente de análise'}</span>
                                            </div>
                                            {document.rejection_reason ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{document.rejection_reason}</p> : null}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="Sem documentos" description="Este perfil ainda não submeteu documentos de verificação." />
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={onApprove} isLoading={isApproving}>Aprovar verificação</Button>
                            <Button variant="danger" onClick={onReject} isLoading={isRejecting}>Rejeitar verificação</Button>
                        </div>
                    </>
                ) : (
                    <EmptyState title="Selecione uma verificação" description="Clique numa linha da lista para ver os detalhes e os documentos." />
                )}
            </CardContent>
        </Card>
    );
}

function Stat({ label, value }: { label: string; value: number | string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
    );
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="font-medium text-slate-500">{label}</span>
            <span className="text-right font-semibold text-slate-950">{value}</span>
        </div>
    );
}
