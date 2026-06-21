<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\Contract;
use App\Models\Dispute;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\Report;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class ActivityLogService
{
    public function logUserLogin(User $user): ActivityLog
    {
        return $this->record($user, 'user_login', 'auth', $user, [
            'user_type' => $user->user_type?->value,
        ]);
    }

    public function logUserLogout(User $user): ActivityLog
    {
        return $this->record($user, 'user_logout', 'auth', $user);
    }

    public function logUserBlocked(User $actor, User $subject): ActivityLog
    {
        return $this->record($actor, 'user_blocked', 'users', $subject, [
            'actor_user_id' => $actor->id,
        ]);
    }

    public function logUserSuspended(User $actor, User $subject, ?string $reason = null): ActivityLog
    {
        return $this->record($actor, 'user_suspended', 'users', $subject, [
            'actor_user_id' => $actor->id,
            'reason_present' => $reason !== null && $reason !== '',
        ]);
    }

    public function logServiceRequestCreated(User $actor, ServiceRequest $serviceRequest): ActivityLog
    {
        return $this->record($actor, 'service_request_created', 'service_requests', $serviceRequest, [
            'service_request_id' => $serviceRequest->id,
            'category_id' => $serviceRequest->category_id,
        ]);
    }

    public function logServiceRequestCancelled(User $actor, ServiceRequest $serviceRequest): ActivityLog
    {
        return $this->record($actor, 'service_request_cancelled', 'service_requests', $serviceRequest, [
            'service_request_id' => $serviceRequest->id,
            'status' => $serviceRequest->status?->value,
        ]);
    }

    public function logProposalSubmitted(User $actor, Proposal $proposal): ActivityLog
    {
        return $this->record($actor, 'proposal_submitted', 'proposals', $proposal, [
            'proposal_id' => $proposal->id,
            'service_request_id' => $proposal->service_request_id,
        ]);
    }

    public function logProposalAccepted(User $actor, Contract $contract): ActivityLog
    {
        return $this->record($actor, 'proposal_accepted', 'proposals', $contract, [
            'contract_id' => $contract->id,
            'proposal_id' => $contract->proposal_id,
            'service_request_id' => $contract->service_request_id,
            'conversation_id' => $contract->conversation?->id,
        ]);
    }

    public function logContractCompleted(User $actor, Contract $contract): ActivityLog
    {
        return $this->record($actor, 'contract_completed', 'contracts', $contract, [
            'contract_id' => $contract->id,
            'service_request_id' => $contract->service_request_id,
        ]);
    }

    public function logContractCancelled(User $actor, Contract $contract): ActivityLog
    {
        return $this->record($actor, 'contract_cancelled', 'contracts', $contract, [
            'contract_id' => $contract->id,
            'service_request_id' => $contract->service_request_id,
        ]);
    }

    public function logReportCreated(User $actor, Report $report): ActivityLog
    {
        return $this->record($actor, 'report_created', 'reports', $report, [
            'report_id' => $report->id,
            'report_type' => $report->report_type?->value,
            'reason' => $report->reason?->value,
        ]);
    }

    public function logDisputeCreated(User $actor, Dispute $dispute): ActivityLog
    {
        return $this->record($actor, 'dispute_created', 'disputes', $dispute, [
            'dispute_id' => $dispute->id,
            'contract_id' => $dispute->contract_id,
        ]);
    }

    public function logVerificationApproved(User $actor, ProfessionalProfile $profile): ActivityLog
    {
        return $this->record($actor, 'verification_approved', 'verifications', $profile, [
            'professional_profile_id' => $profile->id,
            'documents_count' => $profile->documents()->count(),
        ]);
    }

    public function logVerificationRejected(User $actor, ProfessionalProfile $profile): ActivityLog
    {
        return $this->record($actor, 'verification_rejected', 'verifications', $profile, [
            'professional_profile_id' => $profile->id,
            'documents_count' => $profile->documents()->count(),
        ]);
    }

    public function record(?User $user, string $action, string $module, ?Model $subject = null, array $metadata = []): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'module' => $module,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $this->sanitizeMetadata($metadata),
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    private function sanitizeMetadata(array $metadata): array
    {
        $sensitiveKeys = ['password', 'password_confirmation', 'token', 'tokens', 'file_path', 'message', 'body', 'content', 'description'];

        $sanitized = [];

        foreach ($metadata as $key => $value) {
            if (in_array($key, $sensitiveKeys, true)) {
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeMetadata($value);

                continue;
            }

            $sanitized[$key] = $value;
        }

        return Arr::where($sanitized, static fn ($value): bool => $value !== null);
    }
}
