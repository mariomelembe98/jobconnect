<?php

namespace App\Providers;

use App\Support\ApiResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth', function (Request $request): Limit {
            return Limit::perMinute(10)
                ->by('auth:'.$request->ip())
                ->response(fn (Request $request, array $headers) => ApiResponse::error(
                    message: 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.',
                    status: 429,
                    headers: $headers,
                ));
        });

        RateLimiter::for('user-writes', function (Request $request): Limit {
            return Limit::perMinute(15)
                ->by('user-writes:'.$request->user()?->id)
                ->response(fn (Request $request, array $headers) => ApiResponse::error(
                    message: 'Demasiados pedidos. Tente novamente dentro de alguns minutos.',
                    status: 429,
                    headers: $headers,
                ));
        });

        RateLimiter::for('messages', function (Request $request): Limit {
            return Limit::perMinute(30)
                ->by('messages:'.$request->user()?->id)
                ->response(fn (Request $request, array $headers) => ApiResponse::error(
                    message: 'Demasiadas mensagens. Aguarde um momento e tente novamente.',
                    status: 429,
                    headers: $headers,
                ));
        });

        RateLimiter::for('uploads', function (Request $request): Limit {
            return Limit::perMinute(20)
                ->by('uploads:'.$request->user()?->id)
                ->response(fn (Request $request, array $headers) => ApiResponse::error(
                    message: 'Demasiados carregamentos. Aguarde um momento e tente novamente.',
                    status: 429,
                    headers: $headers,
                ));
        });
    }
}
