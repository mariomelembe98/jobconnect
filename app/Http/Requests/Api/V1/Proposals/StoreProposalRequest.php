<?php

namespace App\Http\Requests\Api\V1\Proposals;

use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class StoreProposalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->hasRole('professional') === true
            && $user->status?->value === UserStatus::Active->value
            && $user->professionalProfile !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'service_request_id' => [
                'required',
                Rule::exists('service_requests', 'id')->where(function ($query): void {
                    $query->whereIn('status', [
                        ServiceRequestStatus::Published->value,
                        ServiceRequestStatus::ReceivingProposals->value,
                    ]);
                }),
            ],
            'amount' => ['required', 'numeric', 'min:1'],
            'delivery_days' => ['nullable', 'integer', 'min:1'],
            'message' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'service_request_id' => 'pedido de serviço',
            'amount' => 'valor',
            'delivery_days' => 'prazo de entrega',
            'message' => 'mensagem',
        ];
    }

    protected function failedAuthorization(): never
    {
        throw new HttpResponseException(
            ApiResponse::error(
                message: 'Acesso reservado a profissionais activos com perfil.',
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
