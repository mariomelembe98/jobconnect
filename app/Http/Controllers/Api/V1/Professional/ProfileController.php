<?php

namespace App\Http\Controllers\Api\V1\Professional;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Professional\AssignProfessionalCategoriesRequest;
use App\Http\Requests\Api\V1\Professional\AssignProfessionalSkillsRequest;
use App\Http\Requests\Api\V1\Professional\StoreProfessionalProfileRequest;
use App\Http\Requests\Api\V1\Professional\UpdateAvailabilityRequest;
use App\Http\Requests\Api\V1\Professional\UpdateProfessionalProfileRequest;
use App\Http\Resources\ProfessionalProfileResource;
use App\Models\ProfessionalProfile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function store(StoreProfessionalProfileRequest $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        if ($request->user()->professionalProfile()->exists()) {
            return ApiResponse::error(
                message: 'Já existe um perfil profissional para este utilizador.',
                status: JsonResponse::HTTP_CONFLICT,
            );
        }

        $profile = $request->user()
            ->professionalProfile()
            ->create($request->validated())
            ->load(['user', 'categories', 'skills']);

        return ApiResponse::success(
            data: [
                'profile' => new ProfessionalProfileResource($profile),
            ],
            message: 'Perfil profissional criado com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function show(Request $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->profileNotFoundResponse();
        }

        return ApiResponse::success(
            data: [
                'profile' => new ProfessionalProfileResource($profile->load(['user', 'categories', 'skills'])),
            ],
            message: 'Perfil profissional carregado com sucesso.',
        );
    }

    public function update(UpdateProfessionalProfileRequest $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->profileNotFoundResponse();
        }

        $profile->update($request->validated());

        return ApiResponse::success(
            data: [
                'profile' => new ProfessionalProfileResource($profile->refresh()->load(['user', 'categories', 'skills'])),
            ],
            message: 'Perfil profissional actualizado com sucesso.',
        );
    }

    public function assignCategories(AssignProfessionalCategoriesRequest $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->profileNotFoundResponse();
        }

        $profile->categories()->sync($request->validated('category_ids'));

        return ApiResponse::success(
            data: [
                'profile' => new ProfessionalProfileResource($profile->refresh()->load(['user', 'categories', 'skills'])),
            ],
            message: 'Categorias profissionais actualizadas com sucesso.',
        );
    }

    public function assignSkills(AssignProfessionalSkillsRequest $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->profileNotFoundResponse();
        }

        $profile->skills()->sync($request->validated('skill_ids'));

        return ApiResponse::success(
            data: [
                'profile' => new ProfessionalProfileResource($profile->refresh()->load(['user', 'categories', 'skills'])),
            ],
            message: 'Competências profissionais actualizadas com sucesso.',
        );
    }

    public function updateAvailability(UpdateAvailabilityRequest $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->profileNotFoundResponse();
        }

        $profile->update([
            'availability' => $request->validated('availability'),
        ]);

        return ApiResponse::success(
            data: [
                'profile' => new ProfessionalProfileResource($profile->refresh()->load(['user', 'categories', 'skills'])),
            ],
            message: 'Disponibilidade actualizada com sucesso.',
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

    private function profileNotFoundResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Perfil profissional não encontrado.',
            status: JsonResponse::HTTP_NOT_FOUND,
        );
    }
}
