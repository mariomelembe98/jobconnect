<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Users\ChangePasswordRequest;
use App\Http\Requests\Api\V1\Users\UpdateLocationRequest;
use App\Http\Requests\Api\V1\Users\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success(
            data: [
                'user' => new UserResource($request->user()),
            ],
            message: 'Perfil carregado com sucesso.',
        );
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $user->save();

        return ApiResponse::success(
            data: [
                'user' => new UserResource($user->refresh()),
            ],
            message: 'Perfil actualizado com sucesso.',
        );
    }

    public function updateLocation(UpdateLocationRequest $request): JsonResponse
    {
        $user = $request->user();
        $location = $request->validated();

        $user->update($location);

        return ApiResponse::success(
            data: [
                'location' => $location,
                'user' => new UserResource($user->refresh()),
            ],
            message: 'Localização actualizada com sucesso.',
        );
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $request->user()->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return ApiResponse::success(
            message: 'Palavra-passe alterada com sucesso.',
        );
    }
}
