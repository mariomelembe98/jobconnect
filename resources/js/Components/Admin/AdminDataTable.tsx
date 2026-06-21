import type { ReactNode } from 'react';

import { Card, CardContent } from '../ui/Card';

interface AdminDataTableProps {
    headers: ReactNode[];
    children: ReactNode;
    caption?: string;
}

export function AdminDataTable({ headers, children, caption }: AdminDataTableProps) {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                        {caption ? <caption className="sr-only">{caption}</caption> : null}
                        <thead>
                            <tr className="bg-slate-50">
                                {headers.map((header, index) => (
                                    <th
                                        key={index}
                                        scope="col"
                                        className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>{children}</tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
