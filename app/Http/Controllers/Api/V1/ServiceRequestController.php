<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InvitationStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProfessionalInvitations\InviteProfessionalRequest;
use App\Http\Requests\Api\V1\ServiceRequests\CancelServiceRequestRequest;
use App\Http\Requests\Api\V1\ServiceRequests\StoreServiceRequestAttachmentRequest;
use App\Http\Requests\Api\V1\ServiceRequests\StoreServiceRequestRequest;
use App\Http\Requests\Api\V1\ServiceRequests\UpdateServiceRequestRequest;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\ServiceRequestAttachmentResource;
use App\Http\Resources\ServiceRequestListResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ProfessionalInvitation;
use App\Models\ProfessionalProfile;
use App\Models\ServiceRequest as ServiceRequestModel;
use App\Models\ServiceRequestAttachment as ServiceRequestAttachmentModel;
use App\Support\ActivityLogService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ServiceRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->isProfessionalViewer($request) && ! $this->isAdminViewer($request)) {
            return $this->viewerOnlyResponse();
        }

        $query = ServiceRequestModel::query()
            ->with(['client', 'category'])
            ->withCount('attachments')
            ->where('visibility', 'public');

        $this->applyPublicFilters($query, $request);
        $this->applySorting($query, $request->string('sort')->toString());

        $serviceRequests = $query->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'service_requests' => ServiceRequestListResource::collection($serviceRequests->getCollection()),
                'pagination' => [
                    'current_page' => $serviceRequests->currentPage(),
                    'per_page' => $serviceRequests->perPage(),
                    'last_page' => $serviceRequests->lastPage(),
                    'total' => $serviceRequests->total(),
                ],
            ],
            message: 'Pedidos de serviço carregados com sucesso.',
        );
    }

    public function show(Request $request, ServiceRequestModel $serviceRequest): JsonResponse
    {
        $serviceRequest->load(['client', 'category', 'attachments'])->loadCount('proposals');

        if (! $this->canViewServiceRequest($request, $serviceRequest)) {
            return $this->notFoundResponse();
        }

        return ApiResponse::success(
            data: [
                'service_request' => new ServiceRequestResource($serviceRequest),
            ],
            message: 'Pedido de serviço carregado com sucesso.',
        );
    }

    public function store(StoreServiceRequestRequest $request, ActivityLogService $activityLogs): JsonResponse
    {
        $serviceRequest = ServiceRequestModel::create([
            ...$request->validated(),
            'client_id' => $request->user()->id,
            'status' => ServiceRequestStatus::Published,
        ]);

        $response = ApiResponse::success(
            data: [
                'service_request' => new ServiceRequestResource(
                    $serviceRequest->refresh()->load(['client', 'category', 'attachments'])->loadCount('proposals'),
                ),
            ],
            message: 'Pedido de serviço criado com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );

        $activityLogs->logServiceRequestCreated($request->user(), $serviceRequest->fresh());

        return $response;
    }

    public function update(UpdateServiceRequestRequest $request, ServiceRequestModel $serviceRequest): JsonResponse
    {
        if (! $this->canEdit($serviceRequest)) {
            return $this->conflictResponse('Não é possível actualizar este pedido no estado actual.');
        }

        $serviceRequest->update($request->validated());

        return ApiResponse::success(
            data: [
                'service_request' => new ServiceRequestResource(
                    $serviceRequest->refresh()->load(['client', 'category', 'attachments'])->loadCount('proposals'),
                ),
            ],
            message: 'Pedido de serviço actualizado com sucesso.',
        );
    }

    public function cancel(CancelServiceRequestRequest $request, ServiceRequestModel $serviceRequest, ActivityLogService $activityLogs): JsonResponse
    {
        if (in_array($serviceRequest->status?->value, [
            ServiceRequestStatus::Completed->value,
            ServiceRequestStatus::Cancelled->value,
        ], true)) {
            return $this->conflictResponse('Não é possível cancelar este pedido no estado actual.');
        }

        $serviceRequest->update([
            'status' => ServiceRequestStatus::Cancelled,
        ]);

        $response = ApiResponse::success(
            data: [
                'service_request' => new ServiceRequestResource(
                    $serviceRequest->refresh()->load(['client', 'category', 'attachments'])->loadCount('proposals'),
                ),
            ],
            message: 'Pedido de serviço cancelado com sucesso.',
        );

        $activityLogs->logServiceRequestCancelled($request->user(), $serviceRequest->fresh());

        return $response;
    }

    public function storeAttachments(
        StoreServiceRequestAttachmentRequest $request,
        ServiceRequestModel $serviceRequest,
    ): JsonResponse {
        if (! $this->canManageAttachments($serviceRequest)) {
            return $this->conflictResponse('Não é possível gerir anexos neste pedido no estado actual.');
        }

        $attachments = DB::transaction(function () use ($request, $serviceRequest) {
            $createdAttachments = [];

            foreach ($request->file('files', []) as $file) {
                $filePath = $file->store("service-requests/{$serviceRequest->id}/attachments", 'public');

                $createdAttachments[] = $serviceRequest->attachments()->create([
                    'file_path' => $filePath,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }

            return $createdAttachments;
        });

        return ApiResponse::success(
            data: [
                'attachments' => ServiceRequestAttachmentResource::collection(collect($attachments)),
            ],
            message: 'Anexos carregados com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function destroyAttachment(
        Request $request,
        ServiceRequestModel $serviceRequest,
        ServiceRequestAttachmentModel $attachment,
    ): JsonResponse {
        if ($request->user()?->id !== $serviceRequest->client_id) {
            return ApiResponse::error(
                message: 'Não pode eliminar este anexo.',
                status: JsonResponse::HTTP_FORBIDDEN,
            );
        }

        if (! $this->canManageAttachments($serviceRequest)) {
            return $this->conflictResponse('Não é possível gerir anexos neste pedido no estado actual.');
        }

        if ($attachment->service_request_id !== $serviceRequest->id) {
            return $this->notFoundResponse();
        }

        if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return ApiResponse::success(
            message: 'Anexo eliminado com sucesso.',
        );
    }

    public function invite(InviteProfessionalRequest $request, ServiceRequestModel $serviceRequest): JsonResponse
    {
        if (! $this->isClientOwner($request, $serviceRequest)) {
            return $this->ownerOnlyResponse();
        }

        if (in_array($serviceRequest->status?->value, [
            ServiceRequestStatus::Completed->value,
            ServiceRequestStatus::Cancelled->value,
        ], true)) {
            return $this->conflictResponse('Não pode convidar profissionais neste pedido no estado actual.');
        }

        $validated = $request->validated();

        $professionalProfile = ProfessionalProfile::query()
            ->with('user')
            ->findOrFail($validated['professional_profile_id']);

        if ($professionalProfile->user_id === $request->user()?->id) {
            return $this->conflictResponse('Não pode convidar o seu próprio perfil profissional.');
        }

        if ($professionalProfile->user?->status?->value !== UserStatus::Active->value) {
            return $this->conflictResponse('Não pode convidar um profissional inactivo.');
        }

        $alreadyInvited = ProfessionalInvitation::query()
            ->where('service_request_id', $serviceRequest->id)
            ->where('professional_profile_id', $professionalProfile->id)
            ->exists();

        if ($alreadyInvited) {
            return $this->conflictResponse('Este profissional já foi convidado para este pedido.');
        }

        $invitation = ProfessionalInvitation::create([
            'service_request_id' => $serviceRequest->id,
            'professional_profile_id' => $professionalProfile->id,
            'client_id' => $request->user()->id,
            'message' => $validated['message'] ?? null,
            'status' => InvitationStatus::Pending,
        ]);

        return ApiResponse::success(
            data: [
                'invitation' => new InvitationResource(
                    $invitation->fresh()->load(['serviceRequest', 'professionalProfile.user', 'client']),
                ),
            ],
            message: 'Convite enviado com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    private function applyPublicFilters(Builder $query, Request $request): void
    {
        $query->whereIn('status', [
            ServiceRequestStatus::Published->value,
            ServiceRequestStatus::ReceivingProposals->value,
        ]);

        $query->when($request->filled('category_id'), function (Builder $query) use ($request): void {
            $query->where('category_id', $request->integer('category_id'));
        });

        $query->when($request->filled('province'), fn (Builder $query) => $query->where('province', $request->string('province')->toString()));
        $query->when($request->filled('city'), fn (Builder $query) => $query->where('city', $request->string('city')->toString()));
        $query->when($request->filled('service_type'), fn (Builder $query) => $query->where('service_type', $request->string('service_type')->toString()));
        $query->when($request->filled('status'), function (Builder $query) use ($request): void {
            $status = $request->string('status')->toString();

            if (in_array($status, ServiceRequestStatus::values(), true)) {
                $query->where('status', $status);
            }
        });

        $query->when($request->filled('budget_min'), function (Builder $query) use ($request): void {
            $budgetMin = (float) $request->input('budget_min');
            $query->where(function (Builder $query) use ($budgetMin): void {
                $query->whereNull('budget_max')->orWhere('budget_max', '>=', $budgetMin);
            });
        });

        $query->when($request->filled('budget_max'), function (Builder $query) use ($request): void {
            $budgetMax = (float) $request->input('budget_max');
            $query->where(function (Builder $query) use ($budgetMax): void {
                $query->whereNull('budget_min')->orWhere('budget_min', '<=', $budgetMax);
            });
        });

        $query->when($request->filled('q'), function (Builder $query) use ($request): void {
            $search = $request->string('q')->toString();

            $query->where(function (Builder $query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"));
            });
        });
    }

    private function applySorting(Builder $query, string $sort): void
    {
        $sortOptions = [
            '-created_at' => ['created_at', 'desc'],
            'deadline_at' => ['deadline_at', 'asc'],
            'budget_max' => ['budget_max', 'asc'],
        ];

        [$column, $direction] = $sortOptions[$sort] ?? ['created_at', 'desc'];

        $query->orderBy($column, $direction);
    }

    private function canViewServiceRequest(Request $request, ServiceRequestModel $serviceRequest): bool
    {
        if ($serviceRequest->visibility === 'public' && in_array($serviceRequest->status?->value, [
            ServiceRequestStatus::Published->value,
            ServiceRequestStatus::ReceivingProposals->value,
        ], true)) {
            return true;
        }

        $user = $request->user();

        if (! $user) {
            return false;
        }

        return $serviceRequest->client_id === $user->id || $user->hasAnyRole(['admin', 'super_admin']) === true;
    }

    private function canEdit(ServiceRequestModel $serviceRequest): bool
    {
        return in_array($serviceRequest->status?->value, [
            ServiceRequestStatus::Draft->value,
            ServiceRequestStatus::Published->value,
            ServiceRequestStatus::ReceivingProposals->value,
        ], true);
    }

    private function canManageAttachments(ServiceRequestModel $serviceRequest): bool
    {
        return ! in_array($serviceRequest->status?->value, [
            ServiceRequestStatus::Completed->value,
            ServiceRequestStatus::Cancelled->value,
        ], true);
    }

    private function isClientOwner(Request $request, ServiceRequestModel $serviceRequest): bool
    {
        return $request->user()?->hasRole('client') === true
            && $serviceRequest->client_id === $request->user()?->id;
    }

    private function isProfessionalViewer(Request $request): bool
    {
        return $request->user()?->hasRole('professional') === true;
    }

    private function isAdminViewer(Request $request): bool
    {
        return $request->user()?->hasAnyRole(['admin', 'super_admin']) === true;
    }

    private function viewerOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a profissionais e administradores.',
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private function ownerOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado ao proprietário do pedido.',
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
            message: 'Pedido de serviço não encontrado.',
            status: JsonResponse::HTTP_NOT_FOUND,
        );
    }
}
