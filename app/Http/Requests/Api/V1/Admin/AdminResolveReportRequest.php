<?php

namespace App\Http\Requests\Api\V1\Admin;

class AdminResolveReportRequest extends AdminRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return ['resolution_note' => ['required', 'string', 'max:5000']];
    }
}
