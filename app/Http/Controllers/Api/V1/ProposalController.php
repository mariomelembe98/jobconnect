<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContractStatus;
use App\Enums\ConversationStatus;
use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Proposals\StoreProposalRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\ProposalListResource;
use App\Http\Resources\ProposalResource;
use App\Models\Contract;
use App\Models\ContractStatusLog;
use App\Models\Conversation;
use App\Models\Proposal as ProposalModel;
use App\Models\ServiceRequest as ServiceRequestModel;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProposalController extends Controller
{
    public function store(StoreProposalRequest $request): JsonResponse
    {
        $user = $request->user();
        $professionalProfile = $user?->professionalProfile;
        $validated = $request->validated();
        $serviceRequest = ServiceRequestModel::query()->findOrFail($validated['service_request_id']);

        if ($serviceRequest->client_id === $user?->id) {
            return $this->conflictResponse('Não pode submeter proposta ao seu próprio pedido.');
        }

        $existingProposal = ProposalModel::query()
            ->where('service_request_id', $serviceRequest->id)
            ->where('professional_profile_id', $professionalProfile?->id)
            ->exists();

        if ($existingProposal) {
            return $this->conflictResponse('Já submeteu uma proposta para este pedido.');
        }

        $proposal = ProposalModel::create([
            'service_request_id' => $serviceRequest->id,
            'professional_profile_id' => $professionalProfile->id,
            'amount' => $validated['amount'],
            'delivery_days' => $validated['delivery_days'] ?? null,
            'message' => $validated['message'] ?? null,
            'status' => ProposalStatus::Pending,
        ]);

        return ApiResponse::success(
            data: [
                'proposal' => new ProposalResource(
                    $proposal->fresh()->load(['serviceRequest.category', 'professionalProfile.user']),
                ),
            ],
            message: 'Proposta submetida com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function show(Request $request, ProposalModel $proposal): JsonResponse
    {
        $proposal->load(['serviceRequest.category', 'professionalProfile.user']);

        if (! $this->canViewProposal($request, $proposal)) {
            return $this->forbiddenResponse('Sem permissão para ver esta proposta.');
        }

        return ApiResponse::success(
            data: [
                'proposal' => new ProposalResource($proposal),
            ],
            message: 'Proposta carregada com sucesso.',
        );
    }

    public function professionalIndex(Request $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $professionalProfile = $request->user()?->professionalProfile;

        if (! $professionalProfile) {
            return $this->professionalOnlyResponse();
        }

        $proposals = ProposalModel::query()
            ->with(['serviceRequest.category', 'professionalProfile.user'])
            ->where('professional_profile_id', $professionalProfile->id)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ApiResponse::success(
            data: [
                'proposals' => ProposalListResource::collection($proposals->getCollection()),
                'pagination' => [
                    'current_page' => $proposals->currentPage(),
                    'per_page' => $proposals->perPage(),
                    'last_page' => $proposals->lastPage(),
                    'total' => $proposals->total(),
                ],
            ],
            message: 'Propostas carregadas com sucesso.',
        );
    }

    public function serviceRequestIndex(Request $request, ServiceRequestModel $serviceRequest): JsonResponse
    {
        if (! $this->isRequestOwner($request, $serviceRequest)) {
            return $this->ownerOnlyResponse();
        }

        $proposals = ProposalModel::query()
            ->with(['serviceRequest.category', 'professionalProfile.user'])
            ->where('service_request_id', $serviceRequest->id)
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return ApiResponse::success(
            data: [
                'proposals' => ProposalListResource::collection($proposals->getCollection()),
                'pagination' => [
                    'current_page' => $proposals->currentPage(),
                    'per_page' => $proposals->perPage(),
                    'last_page' => $proposals->lastPage(),
                    'total' => $proposals->total(),
                ],
            ],
            message: 'Propostas carregadas com sucesso.',
        );
    }

    public function withdraw(Request $request, ProposalModel $proposal): JsonResponse
    {
        if (! $this->isProfessional($request) || ! $this->isProposalOwner($request, $proposal)) {
            return $this->professionalOnlyResponse();
        }

        if ($proposal->status?->value !== ProposalStatus::Pending->value) {
            return $this->conflictResponse('Só é possível retirar uma proposta pendente.');
        }

        $proposal->update([
            'status' => ProposalStatus::Withdrawn,
            'withdrawn_at' => now(),
        ]);

        return ApiResponse::success(
            data: [
                'proposal' => new ProposalResource($proposal->refresh()->load(['serviceRequest.category', 'professionalProfile.user'])),
            ],
            message: 'Proposta retirada com sucesso.',
        );
    }

    public function accept(Request $request, ProposalModel $proposal): JsonResponse
    {
        $serviceRequest = $proposal->serviceRequest()->first();

        if (! $this->isRequestOwner($request, $serviceRequest)) {
            return $this->ownerOnlyResponse();
        }

        if ($proposal->status?->value !== ProposalStatus::Pending->value) {
            return $this->conflictResponse('Só é possível aceitar uma proposta pendente.');
        }

        $contract = null;
        $conversation = null;

        DB::transaction(function () use ($proposal, $serviceRequest, $request, &$contract, &$conversation): void {
            $now = now();

            $proposal->update([
                'status' => ProposalStatus::Accepted,
                'accepted_at' => $now,
                'rejected_at' => null,
                'withdrawn_at' => null,
            ]);

            ProposalModel::query()
                ->where('service_request_id', $serviceRequest->id)
                ->where('status', ProposalStatus::Pending->value)
                ->where('id', '!=', $proposal->id)
                ->update([
                    'status' => ProposalStatus::Rejected,
                    'rejected_at' => $now,
                ]);

            $serviceRequest->update([
                'status' => ServiceRequestStatus::InProgress,
            ]);

            $contract = Contract::create([
                'service_request_id' => $serviceRequest->id,
                'proposal_id' => $proposal->id,
                'client_id' => $serviceRequest->client_id,
                'professional_profile_id' => $proposal->professional_profile_id,
                'amount' => $proposal->amount,
                'platform_fee' => round(((float) $proposal->amount) * 0.1, 2),
                'professional_amount' => round(((float) $proposal->amount) * 0.9, 2),
                'status' => ContractStatus::Active,
                'started_at' => $now,
            ]);

            ContractStatusLog::create([
                'contract_id' => $contract->id,
                'old_status' => null,
                'new_status' => ContractStatus::Active->value,
                'changed_by' => $request->user()?->id,
                'note' => 'Contrato criado a partir da proposta aceite.',
            ]);

            $conversation = Conversation::create([
                'service_request_id' => $serviceRequest->id,
                'contract_id' => $contract->id,
                'client_id' => $serviceRequest->client_id,
                'professional_profile_id' => $proposal->professional_profile_id,
                'status' => ConversationStatus::Active,
            ]);
        });

        return ApiResponse::success(
            data: [
                'proposal' => new ProposalResource($proposal->refresh()->load(['serviceRequest.category', 'professionalProfile.user'])),
                'contract' => new ContractResource(
                    $contract->load(['serviceRequest.category', 'proposal', 'client', 'professionalProfile.user', 'statusLogs.changedBy']),
                ),
                'conversation' => new ConversationResource(
                    $conversation->load(['serviceRequest.category', 'contract', 'client', 'professionalProfile.user'])->loadCount('messages'),
                ),
            ],
            message: 'Proposta aceite com sucesso.',
        );
    }

    public function reject(Request $request, ProposalModel $proposal): JsonResponse
    {
        $serviceRequest = $proposal->serviceRequest()->first();

        if (! $this->isRequestOwner($request, $serviceRequest)) {
            return $this->ownerOnlyResponse();
        }

        if ($proposal->status?->value !== ProposalStatus::Pending->value) {
            return $this->conflictResponse('Só é possível rejeitar uma proposta pendente.');
        }

        $proposal->update([
            'status' => ProposalStatus::Rejected,
            'rejected_at' => now(),
        ]);

        return ApiResponse::success(
            data: [
                'proposal' => new ProposalResource($proposal->refresh()->load(['serviceRequest.category', 'professionalProfile.user'])),
            ],
            message: 'Proposta rejeitada com sucesso.',
        );
    }

    private function canViewProposal(Request $request, ProposalModel $proposal): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        return $proposal->professionalProfile?->user_id === $user->id
            || $proposal->serviceRequest?->client_id === $user->id;
    }

    private function isProfessional(Request $request): bool
    {
        return $request->user()?->hasRole('professional') === true;
    }

    private function isProposalOwner(Request $request, ProposalModel $proposal): bool
    {
        return $proposal->professionalProfile?->user_id === $request->user()?->id;
    }

    private function isRequestOwner(Request $request, ?ServiceRequestModel $serviceRequest): bool
    {
        return $request->user()?->hasRole('client') === true
            && $serviceRequest !== null
            && $serviceRequest->client_id === $request->user()?->id;
    }

    private function professionalOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a profissionais.',
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
