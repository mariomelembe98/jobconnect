<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Favorites\StoreFavoriteRequest;
use App\Http\Resources\FavoriteResource;
use App\Models\Favorite;
use App\Models\ProfessionalProfile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->isClient($request)) {
            return $this->clientOnlyResponse();
        }

        $favorites = Favorite::query()
            ->with(['professionalProfile.user'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ApiResponse::success(
            data: [
                'favorites' => FavoriteResource::collection($favorites->getCollection()),
                'pagination' => [
                    'current_page' => $favorites->currentPage(),
                    'per_page' => $favorites->perPage(),
                    'last_page' => $favorites->lastPage(),
                    'total' => $favorites->total(),
                ],
            ],
            message: 'Favoritos carregados com sucesso.',
        );
    }

    public function store(StoreFavoriteRequest $request): JsonResponse
    {
        if (! $this->isClient($request)) {
            return $this->clientOnlyResponse();
        }

        $validated = $request->validated();
        $professionalProfile = ProfessionalProfile::query()
            ->with('user')
            ->findOrFail($validated['professional_profile_id']);

        if ($professionalProfile->user_id === $request->user()->id) {
            return $this->conflictResponse('Não pode adicionar o seu próprio perfil aos favoritos.');
        }

        if ($professionalProfile->user?->status?->value !== UserStatus::Active->value) {
            return $this->conflictResponse('Não pode adicionar um profissional inactivo aos favoritos.');
        }

        $favoriteExists = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->where('professional_profile_id', $professionalProfile->id)
            ->exists();

        if ($favoriteExists) {
            return $this->conflictResponse('Este profissional já está nos favoritos.');
        }

        $favorite = Favorite::create([
            'user_id' => $request->user()->id,
            'professional_profile_id' => $professionalProfile->id,
        ]);

        return ApiResponse::success(
            data: [
                'favorite' => new FavoriteResource($favorite->fresh()->load(['professionalProfile.user'])),
            ],
            message: 'Profissional adicionado aos favoritos com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function destroy(Request $request, ProfessionalProfile $professionalProfile): JsonResponse
    {
        if (! $this->isClient($request)) {
            return $this->clientOnlyResponse();
        }

        $favorite = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->where('professional_profile_id', $professionalProfile->id)
            ->first();

        if (! $favorite) {
            return $this->notFoundResponse();
        }

        $favorite->delete();

        return ApiResponse::success(
            message: 'Profissional removido dos favoritos com sucesso.',
        );
    }

    private function isClient(Request $request): bool
    {
        return $request->user()?->hasRole('client') === true;
    }

    private function clientOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a clientes.',
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

    private function notFoundResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Favorito não encontrado.',
            status: JsonResponse::HTTP_NOT_FOUND,
        );
    }
}
