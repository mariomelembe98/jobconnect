<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContractStatus;
use App\Enums\NotificationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Reviews\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Contract;
use App\Models\Review;
use App\Support\ApiResponse;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request): JsonResponse
    {
        $user = $request->user();
        $contract = Contract::query()->with(['client', 'professionalProfile.user'])->findOrFail($request->validated('contract_id'));

        if ($contract->status?->value !== ContractStatus::Completed->value) {
            return $this->conflictResponse('Só é possível avaliar contratos concluídos.');
        }

        $reviewedUser = null;

        if ($user?->hasRole('client') === true && $contract->client_id === $user->id) {
            $reviewedUser = $contract->professionalProfile?->user;
        } elseif ($user?->hasRole('professional') === true && $user->professionalProfile?->id === $contract->professional_profile_id) {
            $reviewedUser = $contract->client;
        } else {
            return $this->forbiddenResponse('Sem permissão para avaliar este contrato.');
        }

        if (! $reviewedUser) {
            return $this->conflictResponse('Não foi possível identificar o utilizador avaliado.');
        }

        $alreadyReviewed = Review::query()
            ->where('contract_id', $contract->id)
            ->where('reviewer_id', $user?->id)
            ->exists();

        if ($alreadyReviewed) {
            return $this->conflictResponse('Já avaliou este contrato.');
        }

        $review = DB::transaction(function () use ($contract, $reviewedUser, $request, $user): Review {
            $review = Review::create([
                'contract_id' => $contract->id,
                'reviewer_id' => $user?->id,
                'reviewed_id' => $reviewedUser->id,
                'rating' => $request->validated('rating'),
                'comment' => $request->validated('comment') ?? null,
            ]);

            if ($reviewedUser->professionalProfile) {
                $profile = $reviewedUser->professionalProfile;
                $aggregate = Review::query()
                    ->where('reviewed_id', $reviewedUser->id)
                    ->selectRaw('COUNT(*) as total_reviews, AVG(rating) as average_rating')
                    ->first();

                $profile->update([
                    'total_reviews' => (int) ($aggregate?->total_reviews ?? 0),
                    'average_rating' => round((float) ($aggregate?->average_rating ?? 0), 2),
                ]);
            }

            return $review;
        });

        app(NotificationService::class)->create(
            $reviewedUser,
            NotificationType::ReviewReceived->value,
            'Nova avaliação recebida',
            'Recebeu uma nova avaliação.',
            [
                'review_id' => $review->id,
                'contract_id' => $contract->id,
            ],
        );

        return ApiResponse::success(
            data: [
                'review' => new ReviewResource(
                    $review->fresh()->load(['contract', 'reviewer', 'reviewed']),
                ),
            ],
            message: 'Avaliação criada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function show(Request $request, Review $review): JsonResponse
    {
        if (! $this->canViewReview($request, $review)) {
            return $this->forbiddenResponse('Sem permissão para ver esta avaliação.');
        }

        return ApiResponse::success(
            data: [
                'review' => new ReviewResource(
                    $review->load(['contract', 'reviewer', 'reviewed']),
                ),
            ],
            message: 'Avaliação carregada com sucesso.',
        );
    }

    public function me(Request $request): JsonResponse
    {
        $reviews = Review::query()
            ->with(['contract', 'reviewer', 'reviewed'])
            ->where(function ($query) use ($request): void {
                $query->where('reviewer_id', $request->user()?->id)
                    ->orWhere('reviewed_id', $request->user()?->id);
            })
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

    private function canViewReview(Request $request, Review $review): bool
    {
        if ($request->user()?->hasAnyRole(['admin', 'super_admin']) === true) {
            return true;
        }

        return $review->reviewer_id === $request->user()?->id
            || $review->reviewed_id === $request->user()?->id;
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
