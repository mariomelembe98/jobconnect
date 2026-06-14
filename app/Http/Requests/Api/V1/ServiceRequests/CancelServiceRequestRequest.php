<?php

namespace App\Http\Requests\Api\V1\ServiceRequests;

use App\Models\ServiceRequest;
use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

class CancelServiceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $serviceRequest = $this->route('serviceRequest');

        return $this->user()?->hasRole('client') === true
            && $serviceRequest instanceof ServiceRequest
            && $serviceRequest->client_id === $this->user()?->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
        ];
    }

    protected function failedAuthorization(): never
    {
        throw new HttpResponseException(
            ApiResponse::error(
                message: 'Acesso reservado ao proprietário.',
                status: JsonResponse::HTTP_FORBIDDEN,
            ),
        );
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            ApiResponse::error(
                message: 'Os dados fornecidos são inválidos.',
                errors: $validator->errors()->toArray(),
                status: JsonResponse::HTTP_UNPROCESSABLE_ENTITY,
            ),
        );
    }
}
