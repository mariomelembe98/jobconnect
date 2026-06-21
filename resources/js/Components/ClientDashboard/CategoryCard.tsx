import type { Category } from '../../types';
import { Card, CardContent } from '../ui/Card';

interface CategoryCardProps {
    category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
    return (
        <Card className="group h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated">
            <CardContent className="flex h-full items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg font-bold text-brand-700 transition-colors group-hover:bg-brand-100">
                    {category.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{category.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {category.description ?? 'Encontre profissionais qualificados nesta categoria.'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
