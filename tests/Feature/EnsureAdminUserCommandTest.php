<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EnsureAdminUserCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_does_nothing_without_admin_env_vars(): void
    {
        $this->artisan('app:ensure-admin')->assertExitCode(0);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_it_creates_the_admin_account_once(): void
    {
        config(['app.admin_email' => 'boss@sweetia.test', 'app.admin_password' => 'super-secret']);

        $this->artisan('app:ensure-admin')->assertExitCode(0);

        $user = User::where('email', 'boss@sweetia.test')->firstOrFail();
        $this->assertSame('admin', $user->role);
        $this->assertTrue(Hash::check('super-secret', $user->password));
    }

    public function test_it_never_overwrites_an_existing_account(): void
    {
        $user = User::factory()->create([
            'email' => 'boss@sweetia.test',
            'password' => Hash::make('original-password'),
        ]);

        config(['app.admin_email' => 'boss@sweetia.test', 'app.admin_password' => 'new-password']);

        $this->artisan('app:ensure-admin')->assertExitCode(0);

        $this->assertTrue(Hash::check('original-password', $user->fresh()->password));
    }
}
