<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminSuspendUserRequest;
use App\Http\Requests\Api\V1\Admin\AdminUpdateUserRequest;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Support\ActivityLogService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with(['roles', 'professionalProfile']);

        $query->when($request->filled('user_type'), fn ($query) => $query->where('user_type', $request->string('user_type')->toString()));
        $query->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()));
        $query->when($request->filled('q'), function ($query) use ($request): void {
            $search = $request->string('q')->toString();
            $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%"));
        });

        $users = $query->latest()->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'users' => AdminUserResource::collection($users->getCollection()),
                'pagination' => $this->pagination($users),
            ],
            message: 'Utilizadores carregados com sucesso.',
        );
    }

    public function show(User $user): JsonResponse
    {
        return ApiResponse::success(
            data: ['user' => new AdminUserResource($user->load(['roles', 'professionalProfile']))],
            message: 'Utilizador carregado com sucesso.',
        );
    }

    public function update(AdminUpdateUserRequest $request, User $user, ActivityLogService $activityLogs): JsonResponse
    {
        $previousStatus = $user->status;
        $user->update($request->validated());

        if ($user->status === UserStatus::Blocked) {
            $user->tokens()->delete();
        }

        if ($previousStatus !== $user->status) {
            if ($user->status === UserStatus::Suspended) {
                $activityLogs->logUserSuspended($request->user(), $user);
            }

            if ($user->status === UserStatus::Blocked) {
                $activityLogs->logUserBlocked($request->user(), $user);
            }
        }

        return $this->userResponse($user, 'Utilizador actualizado com sucesso.');
    }

    public function suspend(AdminSuspendUserRequest $request, User $user, ActivityLogService $activityLogs): JsonResponse
    {
        $user->update(['status' => UserStatus::Suspended]);

        $activityLogs->logUserSuspended($request->user(), $user, $request->validated('reason'));

        return $this->userResponse($user, 'Utilizador suspenso com sucesso.');
    }

    public function reactivate(User $user): JsonResponse
    {
        $user->update(['status' => UserStatus::Active]);

        return $this->userResponse($user, 'Utilizador reactivado com sucesso.');
    }

    public function block(User $user, ActivityLogService $activityLogs): JsonResponse
    {
        $user->update(['status' => UserStatus::Blocked]);
        $user->tokens()->delete();

        $activityLogs->logUserBlocked(request()->user(), $user);

        return $this->userResponse($user, 'Utilizador bloqueado com sucesso.');
    }

    private function userResponse(User $user, string $message): JsonResponse
    {
        return ApiResponse::success(
            data: ['user' => new AdminUserResource($user->refresh()->load(['roles', 'professionalProfile']))],
            message: $message,
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
