import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-cream pt-6 sm:justify-center sm:pt-0">
            <div className="flex flex-col items-center gap-2">
                <Link href="/">
                    <ApplicationLogo className="h-24 w-24 rounded-full shadow-md" />
                </Link>
                <span className="font-display text-2xl font-bold tracking-wide text-rose-700">
                    Sweetía
                </span>
            </div>

            <div className="mt-6 w-full overflow-hidden border-t-4 border-rose-600 bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
