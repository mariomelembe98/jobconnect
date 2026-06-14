<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => ['sometimes', 'string', 'min:3', 'max:255'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('users', 'phone')->ignore($userId),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nome',
            'email' => 'email',
            'phone' => 'telefone',
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
}
