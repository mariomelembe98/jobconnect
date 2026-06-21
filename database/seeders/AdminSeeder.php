<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Spatie\Permission\Models\Role;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        $admin = $this->adminCredentials();

        $user = User::updateOrCreate(
            ['email' => $admin['email']],
            [
                'name' => $admin['name'],
                'phone' => $admin['phone'],
                'password' => Hash::make($admin['password']),
                'user_type' => UserType::Admin->value,
                'status' => UserStatus::Active->value,
                'email_verified_at' => now(),
                'phone_verified_at' => $admin['phone'] === null ? null : now(),
            ],
        );

        if (method_exists($user, 'assignRole') && class_exists(Role::class)) {
            $user->assignRole('super_admin');
        }
    }

    /**
     * @return array{name: string, email: string, phone: string|null, password: string}
     */
    private function adminCredentials(): array
    {
        $credentials = [
            'name' => env('ADMIN_NAME'),
            'email' => env('ADMIN_EMAIL'),
            'phone' => env('ADMIN_PHONE'),
            'password' => env('ADMIN_PASSWORD'),
        ];

        if ($this->hasRequiredCredentials($credentials)) {
            return $credentials;
        }

        if (! app()->isLocal() && ! app()->runningUnitTests()) {
            throw new RuntimeException('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured before seeding the default super admin user.');
        }

        return [
            'name' => $credentials['name'] ?: 'Admin',
            'email' => $credentials['email'] ?: 'admin@tempoconnect.local',
            'phone' => $credentials['phone'] ?: '+258840000000',
            'password' => $credentials['password'] ?: 'password',
        ];
    }

    /**
     * @param  array{name: string|null, email: string|null, phone: string|null, password: string|null}  $credentials
     */
    private function hasRequiredCredentials(array $credentials): bool
    {
        return filled($credentials['name'])
            && filled($credentials['email'])
            && filled($credentials['password']);
    }
}
