<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\User;
use Illuminate\Validation\Validator;

class AdminAssignDisputeRequest extends AdminRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return ['assigned_to' => ['required', 'integer', 'exists:users,id']];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $assignee = User::query()->find($this->integer('assigned_to'));

            if ($assignee && ! $assignee->hasAnyRole(['admin', 'super_admin'])) {
                $validator->errors()->add('assigned_to', 'O responsável deve ser um administrador.');
            }
        }];
    }
}
