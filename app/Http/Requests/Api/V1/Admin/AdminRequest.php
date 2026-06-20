<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

abstract class AdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(ApiResponse::error(
            message: 'Os dados fornecidos são inválidos.',
            errors: $validator->errors()->toArray(),
            status: JsonResponse::HTTP_UNPROCESSABLE_ENTITY,
        ));
    }
}
