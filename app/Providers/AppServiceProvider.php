<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // The app usually sits behind a proxy that terminates TLS — without
        // this, generated links (password reset emails, etc.) come out as
        // http:// even though the site is only ever served over https.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Password::defaults(fn () => $this->app->environment('production')
            ? Password::min(10)->mixedCase()->numbers()->uncompromised()
            : Password::min(8));

        // Surfaces N+1 queries and accidental mass-assignment gaps as loud
        // exceptions while developing, without any risk to production if a
        // spot was missed.
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
    }
}
