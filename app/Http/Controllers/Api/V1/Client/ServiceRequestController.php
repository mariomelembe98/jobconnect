<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestListResource;
use App\Models\ServiceRequest as ServiceRequestModel;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->isClient($request)) {
            return $this->clientOnlyResponse();
        }

        $serviceRequests = ServiceRequestModel::query()
            ->with(['client', 'category'])
            ->withCount('attachments')
            ->where('client_id', $request->user()->id)
            ->latest()
            ->paginate(15)
            ->withQueryString();

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

    private function isClient(Request $request): bool
    {
        return $request->user()?->hasRole('client') === true;
    }

    private function clientOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a clientes.',
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }
}
