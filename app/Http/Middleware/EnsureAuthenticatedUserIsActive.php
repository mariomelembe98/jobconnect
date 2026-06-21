<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAuthenticatedUserIsActive
{
    /** @param  Closure(Request): Response  $next */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        if ($user->status === UserStatus::Active) {
            return $next($request);
        }

        $request->user()?->currentAccessToken()?->delete();

        return ApiResponse::error(
            message: match ($user->status) {
                UserStatus::Suspended => 'A sua conta está suspensa.',
                UserStatus::Blocked => 'A sua conta está bloqueada.',
                default => 'A sua conta não está activa.',
            },
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }
}
