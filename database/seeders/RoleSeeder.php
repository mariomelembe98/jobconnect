<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->roles() as $role) {
            Role::findOrCreate($role);
        }
    }

    /**
     * @return array<int, string>
     */
    private function roles(): array
    {
        return [
            'client',
            'professional',
            'admin',
            'super_admin',
            'moderator',
            'analyst',
        ];
    }
}
