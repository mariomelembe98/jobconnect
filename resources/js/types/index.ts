export type UserType = 'client' | 'professional' | 'admin' | 'super_admin';
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
    province?: string;
    city?: string;
    location?: {
        province: string | null;
        city: string | null;
        address: string | null;
        latitude: string | null;
        longitude: string | null;
    };
    verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
    availability: 'available' | 'busy' | 'away' | 'vacation' | 'unavailable';
    average_rating: string;
    total_reviews: number;
    user?: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    categories?: Category[];
    skills?: Skill[];
    portfolio_items?: PortfolioItem[];
    created_at?: string;
}

export interface PortfolioItem {
    id: number;
    professional_profile_id?: number;
    title: string;
    description: string | null;
    file_path?: string;
    file_name?: string;
    file_type?: string | null;
    file_url?: string | null;
    file_size?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ProfessionalDocument {
    id: number;
    document_type: string;
    file_name: string;
    file_type: string | null;
    file_size: number | null;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    reviewed_at: string | null;
    rejection_reason: string | null;
}

export interface ProfessionalVerification {
    verification_status: ProfessionalProfile['verification_status'];
    documents_submitted: number;
    documents_required: number;
    required_documents: string[];
    missing_required_documents: string[];
    documents: ProfessionalDocument[];
}

export interface Review {
    id: number;
    contract_id: number;
    reviewer_id: number;
    reviewed_id: number;
    rating: number;
    comment: string | null;
    reviewer?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    reviewed?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    contract?: {
        id: number;
        status: ContractStatus;
        service_request_id: number;
    };
    created_at: string;
    updated_at?: string;
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
    address?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    category?: Category | null;
    client?: {
        id: number | null;
        name: string | null;
        avatar: string | null;
    } | null;
    attachments_count?: number;
    proposals_count?: number;
    attachments?: ServiceRequestAttachment[];
    deadline_at?: string | null;
    visibility?: 'public' | 'private' | 'invited_only';
    created_at: string;
    updated_at?: string;
}

export interface ServiceRequestAttachment {
    id: number;
    service_request_id: number;
    file_path: string;
    file_url: string | null;
    file_name: string;
    file_type: string | null;
    file_size: number | null;
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
    accepted_at?: string | null;
    rejected_at?: string | null;
    withdrawn_at?: string | null;
    service_request?: {
        id: number;
        title: string;
        status: ServiceRequest['status'];
        province: string | null;
        city: string | null;
        category?: Category | null;
    };
    professional_profile?: {
        id: number;
        headline: string | null;
        availability: ProfessionalProfile['availability'];
        average_rating: string;
        user?: {
            id: number;
            name: string;
            avatar: string | null;
        };
    };
    created_at?: string;
    updated_at?: string;
}

export interface Contract {
    id: number;
    service_request_id: number;
    proposal_id?: number;
    client_id: number;
    professional_profile_id: number;
    amount: string;
    platform_fee?: string;
    professional_amount?: string;
    status: ContractStatus;
    started_at: string | null;
    completed_at: string | null;
    cancelled_at?: string | null;
    service_request?: {
        id: number;
        title: string;
        status: ServiceRequest['status'];
        category?: Category | null;
    };
    proposal?: {
        id: number;
        status: Proposal['status'];
        amount: string;
    };
    client?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    professional_profile?: {
        id: number;
        headline: string | null;
        availability?: ProfessionalProfile['availability'];
        user?: {
            id: number | null;
            name: string | null;
            avatar: string | null;
        };
    };
    conversation?: {
        id: number;
    } | null;
    status_logs_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ContractStatusLog {
    id: number;
    old_status: ContractStatus | null;
    new_status: ContractStatus;
    note: string | null;
    changed_by?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    created_at: string;
    updated_at?: string;
}

export interface Conversation {
    id: number;
    service_request_id: number;
    contract_id: number | null;
    client_id: number;
    professional_profile_id: number;
    status: 'active' | 'archived';
    messages_count: number;
    service_request?: {
        id: number;
        title: string;
        status: ServiceRequest['status'];
        category?: Category | null;
    };
    contract?: {
        id: number;
        status: ContractStatus;
        amount: string;
    } | null;
    client?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    professional_profile?: {
        id: number;
        headline: string | null;
        availability?: ProfessionalProfile['availability'];
        user?: {
            id: number | null;
            name: string | null;
            avatar: string | null;
        };
    };
    created_at: string;
    updated_at?: string;
}

export interface MessageAttachment {
    id: number;
    message_id: number;
    file_path: string;
    file_url: string | null;
    file_name: string;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
}

export interface ChatMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    message: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    read_at: string | null;
    sender?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    attachments?: MessageAttachment[];
    created_at: string;
    updated_at?: string;
}

export interface ConversationSummary {
    conversation: Conversation;
    lastMessage: ChatMessage | null;
    unreadCount: number;
}

export interface ProfessionalInvitation {
    id: number;
    message: string | null;
    status: 'pending' | 'accepted' | 'declined';
    declined_at: string | null;
    service_request?: {
        id: number;
        title: string;
        status: ServiceRequest['status'];
        province: string | null;
        city: string | null;
    };
    client?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    created_at: string;
    updated_at?: string;
}

export type NotificationType = 'proposal_received' | 'proposal_accepted' | 'proposal_rejected' | 'contract_created' | 'contract_completed' | 'contract_cancelled' | 'new_message' | 'verification_approved' | 'verification_rejected' | 'review_received' | 'dispute_opened' | 'dispute_resolved' | 'system';

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    is_read: boolean;
    created_at: string;
    updated_at?: string;
}

export interface Report {
    id: number;
    reporter_id: number;
    reported_user_id: number | null;
    service_request_id: number | null;
    contract_id: number | null;
    report_type: 'user' | 'service_request' | 'contract' | 'message' | 'review';
    reason: string;
    description: string | null;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    reviewed_by?: number | null;
    reviewed_at?: string | null;
    resolution_note?: string | null;
    reporter?: {
        id: number;
        name: string;
        avatar?: string | null;
    } | null;
    reported_user?: {
        id: number;
        name: string;
        avatar?: string | null;
    } | null;
    created_at?: string;
    updated_at?: string;
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
    resolution_note?: string | null;
    resolved_at?: string | null;
    contract?: {
        id: number;
        status: ContractStatus;
        client_id: number;
        professional_profile_id: number;
        amount?: string;
        professional_amount?: string | null;
        started_at?: string | null;
        completed_at?: string | null;
        client?: {
            id: number;
            name: string;
            avatar: string | null;
        };
        professional_profile?: {
            id: number;
            headline: string | null;
            user?: {
                id: number;
                name: string;
                avatar: string | null;
            };
        };
        service_request?: {
            id: number;
            title: string;
            status: ServiceRequest['status'];
            category?: Category | null;
        };
    } | null;
    opener?: {
        id: number;
        name: string;
        avatar?: string | null;
    } | null;
    assignee?: {
        id: number;
        name: string;
        avatar?: string | null;
    } | null;
    evidence?: Array<{
        id: number;
        dispute_id?: number;
        uploaded_by?: number;
        file_name: string;
        file_type: string | null;
        file_size: number | null;
        file_url: string | null;
        description: string | null;
        uploader?: {
            id: number;
            name: string;
        } | null;
        created_at: string;
    }>;
    messages?: Array<{
        id: number;
        dispute_id?: number;
        message: string;
        sender_id: number;
        sender?: {
            id: number;
            name: string;
            avatar: string | null;
        } | null;
        created_at: string;
    }>;
    created_at?: string;
    updated_at?: string;
}

export interface DisputeEvidence {
    id: number;
    dispute_id: number;
    uploaded_by: number;
    file_name: string;
    file_type: string | null;
    file_size: number | null;
    file_url: string | null;
    description: string | null;
    uploader?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

export interface DisputeMessage {
    id: number;
    dispute_id: number;
    sender_id: number;
    message: string;
    sender?: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    created_at: string;
}

export interface ActivityLog {
    id: number;
    user_id: number | null;
    user_name: string | null;
    action: string;
    module: string;
    subject_type: string | null;
    subject_id: number | null;
    ip_address: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
}
