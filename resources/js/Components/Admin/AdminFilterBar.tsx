import type { ReactNode } from 'react';

import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';

interface AdminFilterBarProps {
    title: string;
    description: string;
    search: string;
    onSearchChange: (value: string) => void;
    onApply: () => void;
    onReset: () => void;
    showSearch?: boolean;
    children?: ReactNode;
    action?: ReactNode;
}

export function AdminFilterBar({ title, description, search, onSearchChange, onApply, onReset, showSearch = true, children, action }: AdminFilterBarProps) {
    return (
        <Card>
            <CardContent className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                    {action}
                </div>

                <div className={showSearch ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]' : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)]'}>
                    {showSearch ? (
                        <Input
                            label="Pesquisar"
                            value={search}
                            placeholder="Pesquisar por nome, email ou referência..."
                            onChange={(event) => onSearchChange(event.target.value)}
                        />
                    ) : null}
                    <div className="flex items-end gap-2">
                        <Button variant="outline" onClick={onReset}>Limpar</Button>
                        <Button onClick={onApply}>Aplicar filtros</Button>
                    </div>
                </div>

                {children ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div> : null}
            </CardContent>
        </Card>
    );
}
