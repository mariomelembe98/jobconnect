import type { ReactNode } from 'react';

import { AppLayout, type NavigationItem } from './AppLayout';

const navigation: NavigationItem[] = [
    { label: 'Visão geral', href: '/client', icon: 'home' },
    { label: 'Meus pedidos', href: '#', icon: 'file' },
    { label: 'Profissionais', href: '#', icon: 'search' },
    { label: 'Contratos', href: '#', icon: 'briefcase' },
    { label: 'Mensagens', href: '#', icon: 'chat', badge: '3' },
    { label: 'Perfil', href: '#', icon: 'user' },
];

interface ClientLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function ClientLayout(props: ClientLayoutProps) {
    return <AppLayout {...props} navigation={navigation} sectionLabel="Área do cliente" />;
}
