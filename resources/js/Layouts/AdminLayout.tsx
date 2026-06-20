import type { ReactNode } from 'react';

import { AppLayout, type NavigationItem } from './AppLayout';

const navigation: NavigationItem[] = [
    { label: 'Painel', href: '/admin', icon: 'grid' },
    { label: 'Utilizadores', href: '#', icon: 'users' },
    { label: 'Categorias', href: '#', icon: 'file' },
    { label: 'Competências', href: '#', icon: 'briefcase' },
    { label: 'Verificações', href: '#', icon: 'shield', badge: '12' },
    { label: 'Denúncias', href: '#', icon: 'bell', badge: '8' },
    { label: 'Disputas', href: '#', icon: 'chat', badge: '4' },
];

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function AdminLayout(props: AdminLayoutProps) {
    return <AppLayout {...props} navigation={navigation} sectionLabel="Administração" admin />;
}
