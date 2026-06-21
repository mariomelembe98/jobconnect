import type { ProfessionalDocument, ProfessionalVerification } from '../../types';
import { formatFileSize } from '../../lib/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export interface DocumentDraft {
    document_type: string;
    file: File | null;
}

interface VerificationDocumentsManagerProps {
    verification: ProfessionalVerification | null;
    documents: ProfessionalDocument[];
    drafts: DocumentDraft[];
    disabled?: boolean;
    isUploading?: boolean;
    showUploadAction?: boolean;
    onAddDraft: () => void;
    onUpdateDraft: (index: number, draft: DocumentDraft) => void;
    onRemoveDraft: (index: number) => void;
    onSubmitDrafts: () => void;
}

export function VerificationDocumentsManager({ verification, documents, drafts, disabled = false, isUploading = false, showUploadAction = true, onAddDraft, onUpdateDraft, onRemoveDraft, onSubmitDrafts }: VerificationDocumentsManagerProps) {
    const statusLabel = verification ? {
        approved: 'Aprovado',
        pending: 'Pendente',
        under_review: 'Em análise',
        rejected: 'Rejeitado',
        expired: 'Expirado',
    }[verification.verification_status] : 'Sem dados';

    const statusVariant = verification ? {
        approved: 'green',
        pending: 'amber',
        under_review: 'blue',
        rejected: 'red',
        expired: 'gray',
    }[verification.verification_status] : 'gray';

    return (
        <Card>
            <CardContent className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-brand-600">Verificação</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">Documentos de verificação</h2>
                        <p className="mt-1 text-sm text-slate-500">Carregue BI, NUIT ou outros comprovativos para validar o seu perfil.</p>
                    </div>
                    <Badge variant={statusVariant as 'blue' | 'green' | 'amber' | 'red' | 'gray'}>{statusLabel}</Badge>
                </div>

                {verification ? (
                    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Stat label="Enviados" value={verification.documents_submitted} />
                        <Stat label="Obrigatórios" value={verification.documents_required} />
                        <Stat label="Pendentes" value={verification.missing_required_documents.length} />
                        <Stat label="Tipos" value={verification.required_documents.join(', ').toUpperCase()} compact />
                    </div>
                ) : null}

                {documents.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {documents.map((document) => (
                            <article key={document.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="truncate font-semibold text-slate-950">{document.file_name}</h3>
                                        <p className="mt-1 text-xs text-slate-500">{document.document_type.toUpperCase()}</p>
                                    </div>
                                    <Badge variant={document.status === 'approved' ? 'green' : document.status === 'pending' ? 'amber' : document.status === 'rejected' ? 'red' : 'gray'}>{document.status}</Badge>
                                </div>
                                {document.file_size ? <p className="text-sm text-slate-500">{formatFileSize(document.file_size)}</p> : null}
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Sem documentos de verificação" description="Adicione documentos para acelerar a validação do perfil." />
                )}

                <div className="grid gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-950">Adicionar novo documento</h3>
                            <p className="text-sm text-slate-500">Pode guardar vários envios para carregar depois.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={onAddDraft} disabled={disabled}>Adicionar documento</Button>
                            {showUploadAction && drafts.length > 0 ? <Button size="sm" onClick={onSubmitDrafts} isLoading={isUploading} disabled={disabled}>Carregar documentos</Button> : null}
                        </div>
                    </div>

                    {drafts.length > 0 ? (
                        <div className="grid gap-4">
                            {drafts.map((draft, index) => (
                                <div key={`${index}-${draft.document_type}`} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="font-semibold text-slate-950">Documento #{index + 1}</h4>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={disabled} onClick={() => onRemoveDraft(index)}>Remover</Button>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Select
                                            label="Tipo de documento"
                                            value={draft.document_type}
                                            options={[
                                                { label: 'BI', value: 'bi' },
                                                { label: 'NUIT', value: 'nuit' },
                                                { label: 'Certificado', value: 'certificate' },
                                                { label: 'Outro', value: 'other' },
                                            ]}
                                            disabled={disabled}
                                            onChange={(event) => onUpdateDraft(index, { ...draft, document_type: event.target.value })}
                                        />
                                        <Input
                                            label="Ficheiro"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                                            disabled={disabled}
                                            onChange={(event) => onUpdateDraft(index, { ...draft, file: event.target.files?.[0] ?? null })}
                                        />
                                    </div>
                                    {draft.file ? <p className="text-sm text-slate-500">{draft.file.name} · {formatFileSize(draft.file.size)}</p> : <p className="text-sm text-slate-500">Seleccione um ficheiro opcional.</p>}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

function Stat({ label, value, compact = false }: { label: string; value: number | string; compact?: boolean }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className={`mt-1 font-bold text-slate-950 ${compact ? 'text-sm' : 'text-2xl'}`}>{value}</p>
        </div>
    );
}
