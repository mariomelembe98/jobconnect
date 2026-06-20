<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Enums\UserType;
use Illuminate\Validation\Rule;

class AdminUpdateUserRequest extends AdminRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($userId)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', Rule::unique('users')->ignore($userId)],
            'user_type' => ['sometimes', Rule::enum(UserType::class)],
            'status' => ['sometimes', Rule::enum(UserStatus::class)],
        ];
    }
}
