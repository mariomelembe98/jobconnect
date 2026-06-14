<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ApproveVerificationRequest;
use App\Http\Requests\Api\V1\Admin\RejectVerificationRequest;
use App\Http\Resources\AdminVerificationResource;
use App\Models\ProfessionalProfile;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VerificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->isAdmin($request)) {
            return $this->adminOnlyResponse();
        }

        $query = ProfessionalProfile::query()
            ->with(['user', 'documents.reviewer'])
            ->whereHas('user', fn (Builder $query) => $query->where('status', UserStatus::Active->value));

        $status = $request->string('status')->toString();

        if ($status !== '' && in_array($status, VerificationStatus::values(), true)) {
            $query->where('verification_status', $status);
        }

        $verifications = $query->latest()->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'verifications' => AdminVerificationResource::collection($verifications->getCollection()),
                'pagination' => [
                    'current_page' => $verifications->currentPage(),
                    'per_page' => $verifications->perPage(),
                    'last_page' => $verifications->lastPage(),
                    'total' => $verifications->total(),
                ],
            ],
            message: 'Verificações carregadas com sucesso.',
        );
    }

    public function show(Request $request, ProfessionalProfile $professionalProfile): JsonResponse
    {
        if (! $this->isAdmin($request)) {
            return $this->adminOnlyResponse();
        }

        $professionalProfile->load(['user', 'documents.reviewer']);

        return ApiResponse::success(
            data: [
                'verification' => new AdminVerificationResource($professionalProfile),
            ],
            message: 'Verificação carregada com sucesso.',
        );
    }

    public function approve(ApproveVerificationRequest $request, ProfessionalProfile $professionalProfile): JsonResponse
    {
        $admin = $request->user();

        DB::transaction(function () use ($admin, $professionalProfile): void {
            $professionalProfile->update([
                'verification_status' => VerificationStatus::Approved,
            ]);

            $professionalProfile->documents()
                ->where('status', VerificationStatus::Pending->value)
                ->update([
                    'status' => VerificationStatus::Approved->value,
                    'reviewed_by' => $admin?->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => null,
                ]);
        });

        return ApiResponse::success(
            data: [
                'verification' => new AdminVerificationResource(
                    $professionalProfile->refresh()->load(['user', 'documents.reviewer']),
                ),
            ],
            message: 'Verificação aprovada com sucesso.',
        );
    }

    public function reject(RejectVerificationRequest $request, ProfessionalProfile $professionalProfile): JsonResponse
    {
        $admin = $request->user();
        $reason = $request->validated('reason');

        DB::transaction(function () use ($admin, $professionalProfile, $reason): void {
            $professionalProfile->update([
                'verification_status' => VerificationStatus::Rejected,
            ]);

            $professionalProfile->documents()
                ->where('status', VerificationStatus::Pending->value)
                ->update([
                    'status' => VerificationStatus::Rejected->value,
                    'reviewed_by' => $admin?->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => $reason,
                ]);
        });

        return ApiResponse::success(
            data: [
                'verification' => new AdminVerificationResource(
                    $professionalProfile->refresh()->load(['user', 'documents.reviewer']),
                ),
            ],
            message: 'Verificação rejeitada com sucesso.',
        );
    }

    public static function missingResponse(): JsonResponse
    {
        return self::notFoundResponse();
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()?->hasAnyRole(['admin', 'super_admin']) === true;
    }

    private function adminOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a administradores.',
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private static function notFoundResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Verificação não encontrada.',
            status: JsonResponse::HTTP_NOT_FOUND,
        );
    }
}
