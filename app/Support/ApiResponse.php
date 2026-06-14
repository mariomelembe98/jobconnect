<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * @param  array<string, string>  $headers
     */
    public static function success(
        mixed $data = [],
        string $message = 'Operação concluída com sucesso.',
        int $status = JsonResponse::HTTP_OK,
        array $headers = [],
        int $options = 0,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status, $headers, $options);
    }

    /**
     * @param  array<string, mixed>  $errors
     * @param  array<string, string>  $headers
     */
    public static function error(
        string $message = 'Ocorreu um erro.',
        array $errors = [],
        int $status = JsonResponse::HTTP_BAD_REQUEST,
        array $headers = [],
        int $options = 0,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status, $headers, $options);
    }
}
