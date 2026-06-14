<?php

namespace App\Http\Requests\Api\V1\ServiceRequests;

use App\Models\ServiceRequest;
use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class UpdateServiceRequestRequest extends FormRequest
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
            'category_id' => ['sometimes', 'exists:categories,id'],
            'title' => ['sometimes', 'string', 'min:5', 'max:255'],
            'description' => ['sometimes', 'string', 'min:30'],
            'service_type' => ['sometimes', Rule::in(['local', 'remote', 'hybrid'])],
            'budget_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'budget_max' => ['sometimes', 'nullable', 'numeric', 'min:0', Rule::when($this->filled('budget_min'), ['gte:budget_min'])],
            'budget_type' => ['sometimes', Rule::in(['fixed', 'hourly', 'negotiable'])],
            'province' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'deadline_at' => ['sometimes', 'nullable', 'date', 'after:now'],
            'visibility' => ['sometimes', Rule::in(['public', 'private', 'invited_only'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'category_id' => 'categoria',
            'title' => 'título',
            'description' => 'descrição',
            'service_type' => 'tipo de serviço',
            'budget_min' => 'orçamento mínimo',
            'budget_max' => 'orçamento máximo',
            'budget_type' => 'tipo de orçamento',
            'province' => 'província',
            'city' => 'cidade',
            'address' => 'endereço',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
            'deadline_at' => 'prazo',
            'visibility' => 'visibilidade',
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
