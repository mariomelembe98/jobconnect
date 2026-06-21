<?php

namespace App\Http\Controllers\Api\V1\Professional;

use App\Domains\Professionals\Actions\GetProfessionalDashboardSummaryAction;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly GetProfessionalDashboardSummaryAction $getSummary) {}

    public function __invoke(Request $request): JsonResponse
    {
        if ($request->user()?->hasRole('professional') !== true) {
            return ApiResponse::error(
                message: 'Acesso reservado a profissionais.',
                status: JsonResponse::HTTP_FORBIDDEN,
            );
        }

        $professionalProfile = $request->user()->professionalProfile;

        if (! $professionalProfile) {
            return ApiResponse::error(
                message: 'Perfil profissional não encontrado.',
                status: JsonResponse::HTTP_NOT_FOUND,
            );
        }

        return ApiResponse::success(
            data: $this->getSummary->execute($professionalProfile),
            message: 'Painel profissional carregado com sucesso.',
        );
    }
}
