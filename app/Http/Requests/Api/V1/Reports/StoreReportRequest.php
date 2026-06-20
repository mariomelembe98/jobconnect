<?php

namespace App\Http\Requests\Api\V1\Reports;

use App\Enums\ReportReason;
use App\Enums\ReportType;
use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'report_type' => ['required', Rule::in([
                ReportType::User->value,
                ReportType::ServiceRequest->value,
                ReportType::Contract->value,
            ])],
            'reported_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_request_id' => ['nullable', 'integer', 'exists:service_requests,id'],
            'contract_id' => ['nullable', 'integer', 'exists:contracts,id'],
            'reason' => ['required', Rule::enum(ReportReason::class)],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $targets = [
                ReportType::User->value => 'reported_user_id',
                ReportType::ServiceRequest->value => 'service_request_id',
                ReportType::Contract->value => 'contract_id',
            ];
            $type = $this->string('report_type')->toString();
            $requiredTarget = $targets[$type] ?? null;

            if ($requiredTarget && ! $this->filled($requiredTarget)) {
                $validator->errors()->add($requiredTarget, 'O alvo correspondente ao tipo da denúncia é obrigatório.');
            }

            foreach (array_values($targets) as $target) {
                if ($target !== $requiredTarget && $this->filled($target)) {
                    $validator->errors()->add($target, 'Este alvo não corresponde ao tipo da denúncia.');
                }
            }
        }];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'report_type' => 'tipo de denúncia',
            'reported_user_id' => 'utilizador denunciado',
            'service_request_id' => 'pedido de serviço',
            'contract_id' => 'contrato',
            'reason' => 'motivo',
            'description' => 'descrição',
        ];
    }

    protected function failedValidation(ValidatorContract $validator): never
    {
        throw new HttpResponseException(ApiResponse::error(
            message: 'Os dados fornecidos são inválidos.',
            errors: $validator->errors()->toArray(),
            status: JsonResponse::HTTP_UNPROCESSABLE_ENTITY,
        ));
    }
}
