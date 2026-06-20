<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domains\Admin\Actions\ResolveDisputeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminAssignDisputeRequest;
use App\Http\Requests\Api\V1\Admin\AdminResolveDisputeRequest;
use App\Http\Resources\DisputeResource;
use App\Models\Dispute;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class DisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $disputes = Dispute::query()
            ->with($this->relations())
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return ApiResponse::success(
            data: ['disputes' => DisputeResource::collection($disputes->getCollection()), 'pagination' => $this->pagination($disputes)],
            message: 'Disputas administrativas carregadas com sucesso.',
        );
    }

    public function show(Dispute $dispute): JsonResponse
    {
        return $this->disputeResponse($dispute, 'Disputa carregada com sucesso.');
    }

    public function assign(AdminAssignDisputeRequest $request, Dispute $dispute): JsonResponse
    {
        $dispute->update(['assigned_to' => $request->integer('assigned_to')]);

        return $this->disputeResponse($dispute, 'Disputa atribuída com sucesso.');
    }

    public function resolve(
        AdminResolveDisputeRequest $request,
        Dispute $dispute,
        ResolveDisputeAction $action,
    ): JsonResponse {
        $action->execute($dispute, $request->validated());

        return $this->disputeResponse($dispute, 'Disputa resolvida com sucesso.');
    }

    private function disputeResponse(Dispute $dispute, string $message): JsonResponse
    {
        return ApiResponse::success(
            data: ['dispute' => new DisputeResource($dispute->refresh()->load($this->relations()))],
            message: $message,
        );
    }

    /** @return array<int, string> */
    private function relations(): array
    {
        return ['contract.professionalProfile', 'openedBy', 'assignedTo', 'evidence.uploadedBy', 'messages.sender'];
    }

    /** @return array<string, int> */
    private function pagination(LengthAwarePaginator $paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'last_page' => $paginator->lastPage(), 'total' => $paginator->total()];
    }
}
