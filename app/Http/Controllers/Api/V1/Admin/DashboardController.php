<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ContractStatus;
use App\Enums\DisputeStatus;
use App\Enums\ReportStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Dispute;
use App\Models\ProfessionalProfile;
use App\Models\Report;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return ApiResponse::success(
            data: [
                'users_total' => User::query()->count(),
                'clients_total' => User::query()->where('user_type', UserType::Client->value)->count(),
                'professionals_total' => User::query()->where('user_type', UserType::Professional->value)->count(),
                'verified_professionals' => ProfessionalProfile::query()->where('verification_status', VerificationStatus::Approved->value)->count(),
                'service_requests_total' => ServiceRequest::query()->count(),
                'active_contracts' => Contract::query()->where('status', ContractStatus::Active->value)->count(),
                'completed_contracts' => Contract::query()->where('status', ContractStatus::Completed->value)->count(),
                'open_disputes' => Dispute::query()->whereIn('status', [DisputeStatus::Pending->value, DisputeStatus::UnderReview->value])->count(),
                'pending_reports' => Report::query()->where('status', ReportStatus::Pending->value)->count(),
            ],
            message: 'Painel administrativo carregado com sucesso.',
        );
    }
}
