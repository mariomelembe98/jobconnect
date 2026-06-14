<?php

namespace App\Http\Requests\Api\V1\Professional;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

class UpdateProfessionalProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('professional') === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'headline' => ['sometimes', 'string', 'max:255'],
            'bio' => ['sometimes', 'string', 'min:30'],
            'experience_years' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'base_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'price_type' => ['sometimes', 'in:hourly,fixed,negotiable'],
            'province' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'headline' => 'título profissional',
            'bio' => 'biografia',
            'experience_years' => 'anos de experiência',
            'base_price' => 'preço base',
            'price_type' => 'tipo de preço',
            'province' => 'província',
            'city' => 'cidade',
            'address' => 'endereço',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
        ];
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

    protected function failedAuthorization(): never
    {
        throw new HttpResponseException(
            ApiResponse::error(
                message: 'Acesso reservado a profissionais.',
                status: JsonResponse::HTTP_FORBIDDEN,
            ),
        );
    }
}
