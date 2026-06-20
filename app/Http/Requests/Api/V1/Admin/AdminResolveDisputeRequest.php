<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\DisputeResolution;
use Illuminate\Validation\Rule;

class AdminResolveDisputeRequest extends AdminRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'resolution' => ['required', Rule::enum(DisputeResolution::class)],
            'resolution_note' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
