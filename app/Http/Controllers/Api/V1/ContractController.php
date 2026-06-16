<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContractStatus;
use App\Enums\NotificationType;
use App\Enums\ServiceRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Contracts\CancelContractRequest;
use App\Http\Requests\Api\V1\Contracts\CompleteContractRequest;
use App\Http\Resources\ContractListResource;
use App\Http\Resources\ContractResource;
use App\Http\Resources\ContractStatusLogResource;
use App\Models\Contract;
use App\Models\ContractStatusLog;
use App\Support\ApiResponse;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return $this->forbiddenResponse('Sem permissão para ver contratos.');
        }

        $query = Contract::query()->with(['serviceRequest.category', 'proposal', 'client', 'professionalProfile.user']);

        if ($user->hasAnyRole(['admin', 'super_admin']) !== true) {
            if ($user->hasRole('client') === true) {
                $query->where('client_id', $user->id);
            } elseif ($user->hasRole('professional') === true && $user->professionalProfile) {
                $query->where('professional_profile_id', $user->professionalProfile->id);
            } else {
                return $this->forbiddenResponse('Sem permissão para ver contratos.');
            }
        }

        $contracts = $query->latest()->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'contracts' => ContractListResource::collection($contracts->getCollection()),
                'pagination' => [
                    'current_page' => $contracts->currentPage(),
                    'per_page' => $contracts->perPage(),
                    'last_page' => $contracts->lastPage(),
                    'total' => $contracts->total(),
                ],
            ],
            message: 'Contratos carregados com sucesso.',
        );
    }

    public function show(Request $request, Contract $contract): JsonResponse
    {
        if (! $this->canViewContract($request, $contract)) {
            return $this->forbiddenResponse('Sem permissão para ver este contrato.');
        }

        $contract->load(['serviceRequest.category', 'proposal', 'client', 'professionalProfile.user', 'statusLogs.changedBy']);

        return ApiResponse::success(
            data: [
                'contract' => new ContractResource($contract),
            ],
            message: 'Contrato carregado com sucesso.',
        );
    }

    public function complete(CompleteContractRequest $request, Contract $contract): JsonResponse
    {
        if (! $this->isClientOwner($request, $contract)) {
            return $this->forbiddenResponse('Apenas o cliente proprietário pode concluir este contrato.');
        }

        if ($contract->status?->value !== ContractStatus::Active->value) {
            return $this->conflictResponse('Só é possível concluir um contrato activo.');
        }

        DB::transaction(function () use ($contract, $request): void {
            $oldStatus = $contract->status?->value;

            $contract->update([
                'status' => ContractStatus::Completed,
                'completed_at' => now(),
            ]);

            $contract->serviceRequest()->update([
                'status' => ServiceRequestStatus::Completed,
            ]);

            ContractStatusLog::create([
                'contract_id' => $contract->id,
                'old_status' => $oldStatus,
                'new_status' => ContractStatus::Completed->value,
                'changed_by' => $request->user()?->id,
                'note' => 'Contrato concluído pelo cliente.',
            ]);
        });

        if ($contract->professionalProfile?->user) {
            app(NotificationService::class)->create(
                $contract->professionalProfile->user,
                NotificationType::ContractCompleted->value,
                'Contrato concluído',
                'O contrato foi concluído pelo cliente.',
                [
                    'contract_id' => $contract->id,
                    'service_request_id' => $contract->service_request_id,
                ],
            );
        }

        return ApiResponse::success(
            data: [
                'contract' => new ContractResource($contract->refresh()->load(['serviceRequest.category', 'proposal', 'client', 'professionalProfile.user', 'statusLogs.changedBy'])),
            ],
            message: 'Contrato concluído com sucesso.',
        );
    }

    public function cancel(CancelContractRequest $request, Contract $contract): JsonResponse
    {
        if (! $this->canCancelContract($request, $contract)) {
            return $this->forbiddenResponse('Sem permissão para cancelar este contrato.');
        }

        if ($contract->status?->value !== ContractStatus::Active->value) {
            return $this->conflictResponse('Só é possível cancelar um contrato activo.');
        }

        DB::transaction(function () use ($contract, $request): void {
            $oldStatus = $contract->status?->value;

            $contract->update([
                'status' => ContractStatus::Cancelled,
                'cancelled_at' => now(),
            ]);

            $contract->serviceRequest()->update([
                'status' => ServiceRequestStatus::Cancelled,
            ]);

            ContractStatusLog::create([
                'contract_id' => $contract->id,
                'old_status' => $oldStatus,
                'new_status' => ContractStatus::Cancelled->value,
                'changed_by' => $request->user()?->id,
                'note' => 'Contrato cancelado.',
            ]);
        });

        $recipient = $request->user()?->hasRole('client') === true
            ? $contract->professionalProfile?->user
            : $contract->client;

        if ($recipient) {
            app(NotificationService::class)->create(
                $recipient,
                NotificationType::ContractCancelled->value,
                'Contrato cancelado',
                'Um contrato foi cancelado.',
                [
                    'contract_id' => $contract->id,
                    'service_request_id' => $contract->service_request_id,
                ],
            );
        }

        return ApiResponse::success(
            data: [
                'contract' => new ContractResource($contract->refresh()->load(['serviceRequest.category', 'proposal', 'client', 'professionalProfile.user', 'statusLogs.changedBy'])),
            ],
            message: 'Contrato cancelado com sucesso.',
        );
    }

    public function logs(Request $request, Contract $contract): JsonResponse
    {
        if (! $this->canViewContract($request, $contract)) {
            return $this->forbiddenResponse('Sem permissão para ver este contrato.');
        }

        $logs = ContractStatusLog::query()
            ->with('changedBy')
            ->where('contract_id', $contract->id)
            ->orderBy('created_at')
            ->get();

        return ApiResponse::success(
            data: [
                'logs' => ContractStatusLogResource::collection($logs),
            ],
            message: 'Registos do contrato carregados com sucesso.',
        );
    }

    private function canViewContract(Request $request, Contract $contract): bool
    {
        if ($request->user()?->hasAnyRole(['admin', 'super_admin']) === true) {
            return true;
        }

        return $this->isClientOwner($request, $contract) || $this->isProfessionalOwner($request, $contract);
    }

    private function isClientOwner(Request $request, Contract $contract): bool
    {
        return $request->user()?->hasRole('client') === true
            && $contract->client_id === $request->user()?->id;
    }

    private function isProfessionalOwner(Request $request, Contract $contract): bool
    {
        return $request->user()?->hasRole('professional') === true
            && $request->user()?->professionalProfile?->id === $contract->professional_profile_id;
    }

    private function canCancelContract(Request $request, Contract $contract): bool
    {
        return $this->isClientOwner($request, $contract) || $this->isProfessionalOwner($request, $contract);
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
