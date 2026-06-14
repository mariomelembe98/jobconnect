<?php

namespace App\Http\Requests\Api\V1\Professional;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

class AssignProfessionalSkillsRequest extends FormRequest
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
            'skill_ids' => ['required', 'array', 'min:1'],
            'skill_ids.*' => ['exists:skills,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'skill_ids' => 'competências',
            'skill_ids.*' => 'competência',
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
