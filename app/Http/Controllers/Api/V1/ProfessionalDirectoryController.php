<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProfessionalListResource;
use App\Http\Resources\ProfessionalPublicResource;
use App\Http\Resources\ReviewResource;
use App\Models\ProfessionalProfile;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessionalDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profiles = ProfessionalProfile::query()
            ->with(['user', 'categories', 'skills.category'])
            ->whereHas('user', fn (Builder $query) => $query->where('status', UserStatus::Active->value))
            ->when($request->filled('q'), function (Builder $query) use ($request): void {
                $search = $request->string('q')->toString();

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('headline', 'like', "%{$search}%")
                        ->orWhere('bio', 'like', "%{$search}%")
                        ->orWhereHas('user', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('categories', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('skills', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('category_id'), function (Builder $query) use ($request): void {
                $query->whereHas(
                    'categories',
                    fn (Builder $query) => $query->whereKey($request->integer('category_id')),
                );
            })
            ->when($request->filled('skill_id'), function (Builder $query) use ($request): void {
                $query->whereHas(
                    'skills',
                    fn (Builder $query) => $query->whereKey($request->integer('skill_id')),
                );
            })
            ->when($request->filled('province'), fn (Builder $query) => $query->where('province', $request->string('province')->toString()))
            ->when($request->filled('city'), fn (Builder $query) => $query->where('city', $request->string('city')->toString()))
            ->when($request->boolean('verified'), fn (Builder $query) => $query->where('verification_status', VerificationStatus::Approved->value))
            ->when($request->filled('availability'), fn (Builder $query) => $query->where('availability', $request->string('availability')->toString()))
            ->when($request->filled('rating'), fn (Builder $query) => $query->where('average_rating', '>=', (float) $request->input('rating')));

        $this->applySorting($profiles, $request->string('sort')->toString());

        $paginatedProfiles = $profiles->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'professionals' => ProfessionalListResource::collection($paginatedProfiles->getCollection()),
                'pagination' => [
                    'current_page' => $paginatedProfiles->currentPage(),
                    'per_page' => $paginatedProfiles->perPage(),
                    'last_page' => $paginatedProfiles->lastPage(),
                    'total' => $paginatedProfiles->total(),
                ],
            ],
            message: 'Profissionais carregados com sucesso.',
        );
    }

    public function show(ProfessionalProfile $professionalProfile): JsonResponse
    {
        $professionalProfile->load(['user', 'categories', 'skills.category']);

        if ($professionalProfile->user?->status !== UserStatus::Active) {
            return $this->notFoundResponse();
        }

        return ApiResponse::success(
            data: [
                'professional' => new ProfessionalPublicResource($professionalProfile),
            ],
            message: 'Profissional carregado com sucesso.',
        );
    }

    public function reviews(Request $request, ProfessionalProfile $professionalProfile): JsonResponse
    {
        $professionalProfile->load('user');

        if ($professionalProfile->user?->status !== UserStatus::Active) {
            return $this->notFoundResponse();
        }

        $reviews = Review::query()
            ->with(['reviewer', 'reviewed', 'contract'])
            ->where('reviewed_id', $professionalProfile->user_id)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ApiResponse::success(
            data: [
                'reviews' => ReviewResource::collection($reviews->getCollection()),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'per_page' => $reviews->perPage(),
                    'last_page' => $reviews->lastPage(),
                    'total' => $reviews->total(),
                ],
            ],
            message: 'Avaliações carregadas com sucesso.',
        );
    }

    public static function missingResponse(): JsonResponse
    {
        return self::notFoundResponse();
    }

    private function applySorting(Builder $query, string $sort): void
    {
        $sortOptions = [
            '-average_rating' => ['average_rating', 'desc'],
            'experience_years' => ['experience_years', 'asc'],
            '-created_at' => ['created_at', 'desc'],
        ];

        [$column, $direction] = $sortOptions[$sort] ?? ['created_at', 'desc'];

        $query->orderBy($column, $direction);
    }

    private static function notFoundResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Profissional não encontrado.',
            status: JsonResponse::HTTP_NOT_FOUND,
        );
    }
}
