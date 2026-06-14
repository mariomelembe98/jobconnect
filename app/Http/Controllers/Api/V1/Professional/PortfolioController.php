<?php

namespace App\Http\Controllers\Api\V1\Professional;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Professional\StorePortfolioItemRequest;
use App\Http\Resources\PortfolioResource;
use App\Models\ProfessionalPortfolioItem;
use App\Models\ProfessionalProfile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        return ApiResponse::success(
            data: [
                'portfolio_items' => PortfolioResource::collection(
                    $profile->portfolioItems()->latest()->get(),
                ),
            ],
            message: 'Portefólio carregado com sucesso.',
        );
    }

    public function store(StorePortfolioItemRequest $request): JsonResponse
    {
        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        $file = $request->file('file');
        $filePath = $file->store("professional-portfolios/{$profile->id}", 'public');

        $portfolioItem = $profile->portfolioItems()->create([
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return ApiResponse::success(
            data: [
                'portfolio_item' => new PortfolioResource($portfolioItem),
            ],
            message: 'Item de portefólio carregado com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function destroy(Request $request, ProfessionalPortfolioItem $portfolioItem): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        if ($portfolioItem->professional_profile_id !== $profile->id) {
            return ApiResponse::error(
                message: 'Não pode eliminar este item de portefólio.',
                status: JsonResponse::HTTP_FORBIDDEN,
            );
        }

        if ($portfolioItem->file_path && Storage::disk('public')->exists($portfolioItem->file_path)) {
            Storage::disk('public')->delete($portfolioItem->file_path);
        }

        $portfolioItem->delete();

        return ApiResponse::success(
            message: 'Item de portefólio eliminado com sucesso.',
        );
    }

    private function isProfessional(Request $request): bool
    {
        return $request->user()?->hasRole('professional') === true;
    }

    private function profileFor(Request $request): ?ProfessionalProfile
    {
        return $request->user()?->professionalProfile;
    }

    private function professionalOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a profissionais.',
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private function missingProfileResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Crie um perfil profissional antes de gerir o portefólio.',
            status: JsonResponse::HTTP_CONFLICT,
        );
    }
}
