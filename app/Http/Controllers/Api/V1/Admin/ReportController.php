<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminDismissReportRequest;
use App\Http\Requests\Api\V1\Admin\AdminResolveReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reports = Report::query()
            ->with($this->relations())
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('report_type'), fn ($query) => $query->where('report_type', $request->string('report_type')->toString()))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return ApiResponse::success(
            data: ['reports' => ReportResource::collection($reports->getCollection()), 'pagination' => $this->pagination($reports)],
            message: 'Denúncias administrativas carregadas com sucesso.',
        );
    }

    public function show(Report $report): JsonResponse
    {
        return $this->reportResponse($report, 'Denúncia carregada com sucesso.');
    }

    public function review(Request $request, Report $report): JsonResponse
    {
        $report->update([
            'status' => ReportStatus::Reviewing,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
        ]);

        return $this->reportResponse($report, 'Denúncia marcada para análise com sucesso.');
    }

    public function resolve(AdminResolveReportRequest $request, Report $report): JsonResponse
    {
        $this->complete($request, $report, ReportStatus::Resolved);

        return $this->reportResponse($report, 'Denúncia resolvida com sucesso.');
    }

    public function dismiss(AdminDismissReportRequest $request, Report $report): JsonResponse
    {
        $this->complete($request, $report, ReportStatus::Dismissed);

        return $this->reportResponse($report, 'Denúncia descartada com sucesso.');
    }

    private function complete(Request $request, Report $report, ReportStatus $status): void
    {
        $report->update([
            'status' => $status,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'resolution_note' => $request->string('resolution_note')->toString(),
        ]);
    }

    private function reportResponse(Report $report, string $message): JsonResponse
    {
        return ApiResponse::success(
            data: ['report' => new ReportResource($report->refresh()->load($this->relations()))],
            message: $message,
        );
    }

    /** @return array<int, string> */
    private function relations(): array
    {
        return ['reporter', 'reportedUser', 'serviceRequest', 'contract', 'reviewedBy'];
    }

    /** @return array<string, int> */
    private function pagination(LengthAwarePaginator $paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'last_page' => $paginator->lastPage(), 'total' => $paginator->total()];
    }
}
