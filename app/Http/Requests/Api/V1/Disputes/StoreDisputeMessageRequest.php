<?php

namespace App\Http\Requests\Api\V1\Disputes;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

class StoreDisputeMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return ['message' => ['required', 'string', 'max:5000']];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return ['message' => 'mensagem'];
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
