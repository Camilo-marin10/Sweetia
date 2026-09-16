<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EnsureAdminUser extends Command
{
    protected $signature = 'app:ensure-admin';

    protected $description = 'Creates the first admin account from ADMIN_EMAIL/ADMIN_PASSWORD env vars, if it does not exist yet';

    public function handle(): int
    {
        $email = config('app.admin_email');
        $password = config('app.admin_password');

        if (blank($email) || blank($password)) {
            $this->info('ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping.');

            return self::SUCCESS;
        }

        // Only bootstraps the account once. Deploys run this on every boot,
        // and we never want a redeploy to silently reset a password someone
        // already changed from inside the app.
        if (User::where('email', $email)->exists()) {
            $this->info('Admin user already exists — leaving it untouched.');

            return self::SUCCESS;
        }

        $user = User::create([
            'name' => config('app.admin_name', 'Admin'),
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        $this->info("Admin user created: {$email}");

        return self::SUCCESS;
    }
}
