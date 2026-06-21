<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Disputes\Actions\OpenDisputeAction;
use App\Domains\Disputes\Actions\StoreDisputeEvidenceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Disputes\StoreDisputeEvidenceRequest;
use App\Http\Requests\Api\V1\Disputes\StoreDisputeMessageRequest;
use App\Http\Requests\Api\V1\Disputes\StoreDisputeRequest;
use App\Http\Resources\DisputeEvidenceResource;
use App\Http\Resources\DisputeMessageResource;
use App\Http\Resources\DisputeResource;
use App\Models\Contract;
use App\Models\Dispute;
use App\Support\ActivityLogService;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;
use LogicException;

class DisputeController extends Controller
{
    public function store(StoreDisputeRequest $request, OpenDisputeAction $action, ActivityLogService $activityLogs): JsonResponse
    {
        $contract = Contract::query()->findOrFail($request->integer('contract_id'));

        try {
            $dispute = $action->execute($request->user(), $contract, $request->safe()->except('contract_id'));
        } catch (AuthorizationException $exception) {
            return ApiResponse::error($exception->getMessage(), status: JsonResponse::HTTP_FORBIDDEN);
        } catch (LogicException $exception) {
            return ApiResponse::error($exception->getMessage(), status: JsonResponse::HTTP_CONFLICT);
        }

        $response = ApiResponse::success(
            data: ['dispute' => new DisputeResource($this->loadDispute($dispute))],
            message: 'Disputa aberta com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );

        $activityLogs->logDisputeCreated($request->user(), $dispute->fresh());

        return $response;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Dispute::query()->with(['contract.professionalProfile', 'openedBy', 'assignedTo']);

        if (! $user?->hasAnyRole(['admin', 'super_admin'])) {
            $query->whereHas('contract', function ($contractQuery) use ($user): void {
                $contractQuery->where('client_id', $user?->id)
                    ->orWhereHas('professionalProfile', fn ($profileQuery) => $profileQuery->where('user_id', $user?->id));
            });
        }

        $disputes = $query->latest()->paginate(15);

        return ApiResponse::success(
            data: [
                'disputes' => DisputeResource::collection($disputes->getCollection()),
                'pagination' => $this->pagination($disputes),
            ],
            message: 'Disputas carregadas com sucesso.',
        );
    }

    public function show(Dispute $dispute): JsonResponse
    {
        if ($this->cannotContribute($dispute)) {
            return $this->forbidden();
        }

        return ApiResponse::success(
            data: ['dispute' => new DisputeResource($this->loadDispute($dispute, true))],
            message: 'Disputa carregada com sucesso.',
        );
    }

    public function storeEvidence(
        StoreDisputeEvidenceRequest $request,
        Dispute $dispute,
        StoreDisputeEvidenceAction $action,
    ): JsonResponse {
        if ($this->cannotContribute($dispute)) {
            return $this->forbidden('Sem permissão para adicionar evidências a esta disputa.');
        }

        $evidence = $action->execute(
            $dispute,
            $request->user(),
            $request->file('file'),
            $request->validated('description'),
        );

        return ApiResponse::success(
            data: ['evidence' => new DisputeEvidenceResource($evidence->load('uploadedBy'))],
            message: 'Evidência carregada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function evidence(Dispute $dispute): JsonResponse
    {
        if ($this->cannotContribute($dispute)) {
            return $this->forbidden();
        }

        $evidence = $dispute->evidence()->with('uploadedBy')->latest()->get();

        return ApiResponse::success(
            data: ['evidence' => DisputeEvidenceResource::collection($evidence)],
            message: 'Evidências carregadas com sucesso.',
        );
    }

    public function messages(Dispute $dispute): JsonResponse
    {
        if ($this->cannotContribute($dispute)) {
            return $this->forbidden();
        }

        $messages = $dispute->messages()->with('sender')->oldest()->paginate(30);

        return ApiResponse::success(
            data: [
                'messages' => DisputeMessageResource::collection($messages->getCollection()),
                'pagination' => $this->pagination($messages),
            ],
            message: 'Mensagens carregadas com sucesso.',
        );
    }

    public function storeMessage(StoreDisputeMessageRequest $request, Dispute $dispute): JsonResponse
    {
        if ($this->cannotContribute($dispute)) {
            return $this->forbidden('Sem permissão para enviar mensagens nesta disputa.');
        }

        $message = $dispute->messages()->create([
            'sender_id' => $request->user()?->id,
            'message' => $request->validated('message'),
        ]);

        return ApiResponse::success(
            data: ['message' => new DisputeMessageResource($message->load('sender'))],
            message: 'Mensagem enviada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    private function loadDispute(Dispute $dispute, bool $withDetails = false): Dispute
    {
        $relations = ['contract.professionalProfile', 'openedBy', 'assignedTo'];

        if ($withDetails) {
            $relations = [...$relations, 'evidence.uploadedBy', 'messages.sender'];
        }

        return $dispute->load($relations);
    }

    private function cannotContribute(Dispute $dispute): bool
    {
        return Gate::denies('contribute', $dispute);
    }

    private function forbidden(string $message = 'Sem permissão para ver esta disputa.'): JsonResponse
    {
        return ApiResponse::error($message, status: JsonResponse::HTTP_FORBIDDEN);
    }

    /** @return array<string, int> */
    private function pagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ];
    }
}
