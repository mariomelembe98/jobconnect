import type { Category } from '../../types';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface ProfessionalCategorySelectorProps {
    categories: Category[];
    selectedCategoryIds: number[];
    disabled?: boolean;
    error?: string;
    onToggle: (categoryId: number) => void;
}

export function ProfessionalCategorySelector({ categories, selectedCategoryIds, disabled = false, error, onToggle }: ProfessionalCategorySelectorProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-brand-600">Categorias</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-950">Escolha as áreas em que trabalha</h2>
                        <p className="mt-1 text-sm text-slate-500">Isto ajuda a ligar o seu perfil aos pedidos correctos.</p>
                    </div>
                    <Badge variant="gray">{selectedCategoryIds.length} seleccionadas</Badge>
                </div>

                {categories.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {categories.map((category) => {
                            const selected = selectedCategoryIds.includes(category.id);

                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    disabled={disabled}
                                    aria-pressed={selected}
                                    className={`flex min-h-16 items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                        selected ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/60'
                                    } ${disabled ? 'opacity-70' : ''}`}
                                    onClick={() => onToggle(category.id)}
                                >
                                    <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                            <path d="M4 6h16v12H4z" />
                                            <path d="M8 10h8M8 14h5" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold">{category.name}</span>
                                        {category.description ? <span className="mt-1 block text-sm leading-6 text-slate-500">{category.description}</span> : null}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState title="Sem categorias disponíveis" description="Não foi possível encontrar categorias para seleccionar." />
                )}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </CardContent>
        </Card>
    );
}
