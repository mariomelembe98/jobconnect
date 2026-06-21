<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Reports\Actions\CreateReportAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Reports\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Support\ActivityLogService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;

class ReportController extends Controller
{
    public function store(StoreReportRequest $request, CreateReportAction $action, ActivityLogService $activityLogs): JsonResponse
    {
        $report = $action->execute($request->user(), $request->validated());

        $response = ApiResponse::success(
            data: ['report' => new ReportResource($report->load(['reporter', 'reportedUser']))],
            message: 'Denúncia criada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );

        $activityLogs->logReportCreated($request->user(), $report->fresh());

        return $response;
    }

    public function me(Request $request): JsonResponse
    {
        $reports = Report::query()
            ->with(['reporter', 'reportedUser'])
            ->whereBelongsTo($request->user(), 'reporter')
            ->latest()
            ->paginate(15);

        return ApiResponse::success(
            data: [
                'reports' => ReportResource::collection($reports->getCollection()),
                'pagination' => $this->pagination($reports),
            ],
            message: 'Denúncias carregadas com sucesso.',
        );
    }

    public function show(Report $report): JsonResponse
    {
        if (Gate::denies('view', $report)) {
            return ApiResponse::error('Sem permissão para ver esta denúncia.', status: JsonResponse::HTTP_FORBIDDEN);
        }

        return ApiResponse::success(
            data: ['report' => new ReportResource($report->load(['reporter', 'reportedUser']))],
            message: 'Denúncia carregada com sucesso.',
        );
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
