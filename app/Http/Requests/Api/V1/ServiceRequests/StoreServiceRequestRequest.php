<?php

namespace App\Http\Requests\Api\V1\ServiceRequests;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class StoreServiceRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('client') === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'title' => ['required', 'string', 'min:5', 'max:255'],
            'description' => ['required', 'string', 'min:30'],
            'service_type' => ['required', Rule::in(['local', 'remote', 'hybrid'])],
            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'min:0', Rule::when($this->filled('budget_min'), ['gte:budget_min'])],
            'budget_type' => ['required', Rule::in(['fixed', 'hourly', 'negotiable'])],
            'province' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'deadline_at' => ['nullable', 'date', 'after:now'],
            'visibility' => ['required', Rule::in(['public', 'private', 'invited_only'])],
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
                message: 'Acesso reservado a clientes.',
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
