import type { ReactNode } from 'react';

import { AdminLayout } from './AdminLayout';
import { ClientLayout } from './ClientLayout';
import { ProfessionalLayout } from './ProfessionalLayout';
import { getStoredAuthUser } from '../lib/auth';

interface ReviewsLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
}

export function ReviewsLayout(props: ReviewsLayoutProps) {
    const userType = getStoredAuthUser()?.user_type;

    if (userType === 'professional') {
        return <ProfessionalLayout {...props} />;
    }

    if (userType === 'admin' || userType === 'super_admin') {
        return <AdminLayout {...props} />;
    }

    return <ClientLayout {...props} />;
}
