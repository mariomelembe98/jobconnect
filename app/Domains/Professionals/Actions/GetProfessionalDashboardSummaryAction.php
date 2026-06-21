<?php

namespace App\Domains\Professionals\Actions;

use App\Enums\ContractStatus;
use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\ProfessionalProfile;
use App\Models\ServiceRequest;

class GetProfessionalDashboardSummaryAction
{
    /** @return array{available_jobs: int, submitted_proposals: int, accepted_proposals: int, active_contracts: int, monthly_earnings: float, average_rating: float} */
    public function execute(ProfessionalProfile $professionalProfile): array
    {
        $monthStart = now()->startOfMonth();
        $nextMonthStart = $monthStart->copy()->addMonth();

        $proposalMetrics = $professionalProfile->proposals()
            ->toBase()
            ->selectRaw('COUNT(*) as submitted_proposals')
            ->selectRaw(
                'COUNT(CASE WHEN status = ? THEN 1 END) as accepted_proposals',
                [ProposalStatus::Accepted->value],
            )
            ->first();

        $contractMetrics = $professionalProfile->contracts()
            ->toBase()
            ->selectRaw(
                'COUNT(CASE WHEN status IN (?, ?) THEN 1 END) as active_contracts',
                [ContractStatus::Active->value, ContractStatus::Disputed->value],
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN status = ? AND completed_at >= ? AND completed_at < ? THEN professional_amount ELSE 0 END), 0) as monthly_earnings',
                [ContractStatus::Completed->value, $monthStart, $nextMonthStart],
            )
            ->first();

        return [
            'available_jobs' => ServiceRequest::query()
                ->whereIn('status', [ServiceRequestStatus::Published->value, ServiceRequestStatus::ReceivingProposals->value])
                ->where('client_id', '!=', $professionalProfile->user_id)
                ->count(),
            'submitted_proposals' => (int) $proposalMetrics->submitted_proposals,
            'accepted_proposals' => (int) $proposalMetrics->accepted_proposals,
            'active_contracts' => (int) $contractMetrics->active_contracts,
            'monthly_earnings' => (float) $contractMetrics->monthly_earnings,
            'average_rating' => (float) $professionalProfile->average_rating,
        ];
    }
}
