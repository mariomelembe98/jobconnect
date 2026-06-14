<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $userType = UserType::from($validated['user_type']);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'user_type' => $userType,
            'status' => UserStatus::Active,
        ]);

        Role::findOrCreate($userType->value);
        $user->assignRole($userType->value);

        return ApiResponse::success(
            data: $this->tokenPayload($user),
            message: 'Conta criada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $this->findUserByIdentifier($validated['identifier']);

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return ApiResponse::error(
                message: 'Credenciais inválidas.',
                status: JsonResponse::HTTP_UNAUTHORIZED,
            );
        }

        return ApiResponse::success(
            data: $this->tokenPayload($user),
            message: 'Sessão iniciada com sucesso.',
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return ApiResponse::success(
            message: 'Sessão terminada com sucesso.',
        );
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(
            data: [
                'user' => new UserResource($request->user()),
            ],
            message: 'Utilizador autenticado.',
        );
    }

    /**
     * @return array{token: string, user: UserResource}
     */
    private function tokenPayload(User $user): array
    {
        return [
            'token' => $user->createToken('tempo-connect-api')->plainTextToken,
            'user' => new UserResource($user),
        ];
    }

    private function findUserByIdentifier(string $identifier): ?User
    {
        $column = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        return User::where($column, $identifier)->first();
    }
}
