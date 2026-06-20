<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->hasAnyRole(['admin', 'super_admin']) !== true) {
            return ApiResponse::error(
                message: 'Acesso reservado a administradores.',
                status: JsonResponse::HTTP_FORBIDDEN,
            );
        }

        return $next($request);
    }
}
