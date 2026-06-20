export type UserType = 'client' | 'professional' | 'admin';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'blocked';
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'disputed';

export interface AppPageProps extends Record<string, unknown> {
    appName: string;
    auth: {
        user: User | null;
    };
}

export interface ApiSuccess<T> {
    success: true;
    message: string;
    data: T;
}

export interface ApiFailure {
    success: false;
    message: string;
    errors: Record<string, string[]>;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface Pagination {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
}

export type PaginatedData<K extends string, T> = { pagination: Pagination } & { [P in K]: T[] };

export interface User {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    user_type: UserType;
    status: UserStatus;
    province?: string | null;
    city?: string | null;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    status: 'active' | 'inactive';
}

export interface Skill {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    status: 'active' | 'inactive';
}

export interface ProfessionalProfile {
    id: number;
    user_id: number;
    headline: string;
    bio: string;
    experience_years: number;
    base_price: string | null;
    price_type: 'hourly' | 'fixed' | 'negotiable';
    province: string;
    city: string;
    verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
    availability: 'available' | 'busy' | 'away' | 'vacation' | 'unavailable';
    average_rating: string;
    total_reviews: number;
}

export interface ServiceRequest {
    id: number;
    client_id: number;
    category_id: number;
    title: string;
    description: string;
    service_type: 'local' | 'remote' | 'hybrid';
    budget_min: string | null;
    budget_max: string | null;
    budget_type: 'fixed' | 'hourly' | 'negotiable';
    status: 'draft' | 'published' | 'receiving_proposals' | 'in_progress' | 'completed' | 'cancelled';
    province: string | null;
    city: string | null;
    created_at: string;
}

export interface Proposal {
    id: number;
    service_request_id: number;
    professional_profile_id: number;
    amount: string;
    delivery_days: number | null;
    message: string | null;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
}

export interface Contract {
    id: number;
    service_request_id: number;
    client_id: number;
    professional_profile_id: number;
    amount: string;
    status: ContractStatus;
    started_at: string | null;
    completed_at: string | null;
}

export interface Notification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

export interface Report {
    id: number;
    report_type: 'user' | 'service_request' | 'contract' | 'message' | 'review';
    reason: string;
    description: string | null;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
}

export interface Dispute {
    id: number;
    contract_id: number;
    opened_by: number;
    assigned_to: number | null;
    reason: string;
    description: string | null;
    status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    resolution: 'favor_client' | 'favor_professional' | 'mutual_agreement' | 'dismissed' | null;
}
