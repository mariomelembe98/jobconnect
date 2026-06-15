<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InvitationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvitationResource;
use App\Models\ProfessionalInvitation;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessionalInvitationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $professionalProfile = $request->user()?->professionalProfile;

        if (! $professionalProfile) {
            return ApiResponse::success(
                data: [
                    'invitations' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'per_page' => 15,
                        'last_page' => 1,
                        'total' => 0,
                    ],
                ],
                message: 'Convites carregados com sucesso.',
            );
        }

        $invitations = ProfessionalInvitation::query()
            ->with(['serviceRequest', 'professionalProfile.user', 'client'])
            ->where('professional_profile_id', $professionalProfile->id)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ApiResponse::success(
            data: [
                'invitations' => InvitationResource::collection($invitations->getCollection()),
                'pagination' => [
                    'current_page' => $invitations->currentPage(),
                    'per_page' => $invitations->perPage(),
                    'last_page' => $invitations->lastPage(),
                    'total' => $invitations->total(),
                ],
            ],
            message: 'Convites carregados com sucesso.',
        );
    }

    public function decline(Request $request, ProfessionalInvitation $invitation): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $professionalProfile = $request->user()?->professionalProfile;

        if (! $professionalProfile || $invitation->professional_profile_id !== $professionalProfile->id) {
            return $this->forbiddenResponse('Sem permissão para recusar este convite.');
        }

        if ($invitation->status?->value !== InvitationStatus::Pending->value) {
            return $this->conflictResponse('Só é possível recusar um convite pendente.');
        }

        $invitation->update([
            'status' => InvitationStatus::Declined,
            'declined_at' => now(),
        ]);

        return ApiResponse::success(
            data: [
                'invitation' => new InvitationResource($invitation->refresh()->load(['serviceRequest', 'professionalProfile.user', 'client'])),
            ],
            message: 'Convite recusado com sucesso.',
        );
    }

    private function isProfessional(Request $request): bool
    {
        return $request->user()?->hasRole('professional') === true;
    }

    private function professionalOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a profissionais.',
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return ApiResponse::error(
            message: $message,
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private function conflictResponse(string $message): JsonResponse
    {
        return ApiResponse::error(
            message: $message,
            status: JsonResponse::HTTP_CONFLICT,
        );
    }
}
