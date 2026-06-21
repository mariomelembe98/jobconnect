import type { PortfolioItem } from '../../types';
import { formatFileSize } from '../../lib/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export interface PortfolioDraft {
    title: string;
    description: string;
    file: File | null;
}

interface PortfolioManagerProps {
    items: PortfolioItem[];
    drafts: PortfolioDraft[];
    disabled?: boolean;
    isUploading?: boolean;
    showUploadAction?: boolean;
    onAddDraft: () => void;
    onUpdateDraft: (index: number, draft: PortfolioDraft) => void;
    onRemoveDraft: (index: number) => void;
    onDeleteItem: (id: number) => void;
    onSubmitDrafts: () => void;
}

export function PortfolioManager({ items, drafts, disabled = false, isUploading = false, showUploadAction = true, onAddDraft, onUpdateDraft, onRemoveDraft, onDeleteItem, onSubmitDrafts }: PortfolioManagerProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-brand-600">Portefólio</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">Mostre trabalhos anteriores</h2>
                        <p className="mt-1 text-sm text-slate-500">Adicione imagens ou PDFs para reforçar a confiança do cliente.</p>
                    </div>
                    <Badge variant="gray">{items.length} existentes</Badge>
                </div>

                {items.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {items.map((item) => (
                            <article key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="truncate font-semibold text-slate-950">{item.title}</h3>
                                        <p className="mt-1 text-xs text-slate-500">{item.file_name}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={disabled} onClick={() => onDeleteItem(item.id)}>Eliminar</Button>
                                </div>
                                <p className="line-clamp-3 text-sm leading-6 text-slate-600">{item.description || 'Sem descrição disponível.'}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                    {item.file_type ? <Badge variant="gray">{item.file_type}</Badge> : null}
                                    {item.file_size ? <Badge variant="gray">{formatFileSize(item.file_size)}</Badge> : null}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="Sem itens no portefólio" description="Adicione trabalhos concluídos para mostrar aos clientes o seu estilo e experiência." />
                )}

                <div className="grid gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-950">Adicionar novo item</h3>
                            <p className="text-sm text-slate-500">Pode guardar vários itens para carregar depois.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={onAddDraft} disabled={disabled}>Adicionar item</Button>
                            {showUploadAction && drafts.length > 0 ? <Button size="sm" onClick={onSubmitDrafts} isLoading={isUploading} disabled={disabled}>Carregar portefólio</Button> : null}
                        </div>
                    </div>

                    {drafts.length > 0 ? (
                        <div className="grid gap-4">
                            {drafts.map((draft, index) => (
                                <div key={`${index}-${draft.title}`} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="font-semibold text-slate-950">Novo item #{index + 1}</h4>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={disabled} onClick={() => onRemoveDraft(index)}>Remover</Button>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Input label="Título" value={draft.title} disabled={disabled} onChange={(event) => onUpdateDraft(index, { ...draft, title: event.target.value })} />
                                        <Input
                                            label="Ficheiro"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                                            disabled={disabled}
                                            onChange={(event) => onUpdateDraft(index, { ...draft, file: event.target.files?.[0] ?? null })}
                                        />
                                    </div>
                                    <Textarea label="Descrição" rows={4} value={draft.description} disabled={disabled} onChange={(event) => onUpdateDraft(index, { ...draft, description: event.target.value })} />
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
