<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\NotificationType;
use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Support\ApiResponse;
use App\Support\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Notification::query()->where('user_id', $request->user()->id);

        $read = $request->query('read');
        if ($read === 'true') {
            $query->whereNotNull('read_at');
        } elseif ($read === 'false') {
            $query->whereNull('read_at');
        }

        $type = $request->string('type')->toString();
        if ($type !== '' && in_array($type, NotificationType::values(), true)) {
            $query->where('type', $type);
        }

        $notifications = $query->latest()->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'notifications' => NotificationResource::collection($notifications->getCollection()),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'per_page' => $notifications->perPage(),
                    'last_page' => $notifications->lastPage(),
                    'total' => $notifications->total(),
                ],
            ],
            message: 'Notificações carregadas com sucesso.',
        );
    }

    public function show(Request $request, Notification $notification): JsonResponse
    {
        if (! $this->ownsNotification($request, $notification)) {
            return $this->notFoundResponse();
        }

        return ApiResponse::success(
            data: [
                'notification' => new NotificationResource($notification),
            ],
            message: 'Notificação carregada com sucesso.',
        );
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        if (! $this->ownsNotification($request, $notification)) {
            return $this->notFoundResponse();
        }

        $this->notificationService->markAsRead($notification);

        return ApiResponse::success(
            data: [
                'notification' => new NotificationResource($notification->fresh()),
            ],
            message: 'Notificação marcada como lida com sucesso.',
        );
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $this->notificationService->markAllAsRead($request->user());

        return ApiResponse::success(
            message: 'Todas as notificações foram marcadas como lidas.',
        );
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        if (! $this->ownsNotification($request, $notification)) {
            return $this->notFoundResponse();
        }

        if ($notification->read_at === null && in_array($notification->type?->value, [
            NotificationType::ContractCreated->value,
            NotificationType::ContractCompleted->value,
            NotificationType::ContractCancelled->value,
            NotificationType::VerificationRejected->value,
        ], true)) {
            return ApiResponse::error(
                message: 'Não pode eliminar uma notificação importante por ler.',
                status: JsonResponse::HTTP_CONFLICT,
            );
        }

        $notification->delete();

        return ApiResponse::success(
            message: 'Notificação eliminada com sucesso.',
        );
    }

    private function ownsNotification(Request $request, Notification $notification): bool
    {
        return $notification->user_id === $request->user()?->id;
    }

    private function notFoundResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Notificação não encontrada.',
            status: JsonResponse::HTTP_NOT_FOUND,
        );
    }
}
