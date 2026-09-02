import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import NavLink from "@/Components/NavLink";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="app-shell">
            <nav className="sticky top-0 z-40 border-b border-[#f0dce6] bg-white/85 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-3">
                                <ApplicationLogo className="block h-11 w-11 rounded-2xl ring-4 ring-[#f8dfe9]" />
                                <span className="hidden text-xl font-semibold tracking-[0.08em] text-[#b93d69] sm:block">
                                    SWEETÍA
                                </span>
                            </Link>

                            <div className="hidden items-center gap-2 sm:-my-px sm:ms-8 sm:flex">
                                <NavLink
                                    href={route("events.index")}
                                    active={route().current("events.*")}
                                >
                                    Eventos
                                </NavLink>
                                <NavLink
                                    href={route("products.index")}
                                    active={route().current("products.*")}
                                >
                                    Productos
                                </NavLink>
                                <NavLink
                                    href={route("reports.index")}
                                    active={route().current("reports.*")}
                                >
                                    Finanzas
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-full">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-full border border-[#f2d8e4] bg-[#fff8fb] px-3.5 py-2 text-sm font-medium leading-4 text-[#4b3b4b] transition-all duration-200 hover:border-[#e7bfd0] hover:text-[#b93d69] focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route("profile.edit")}
                                        >
                                            Perfil
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                        >
                                            Cerrar sesión
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-full border border-[#f2d8e4] bg-[#fff8fb] p-2.5 text-[#685a6b] transition duration-200 hover:bg-[#fff1f7] hover:text-[#b93d69] focus:outline-none"
                            >
                                <svg
                                    className="h-5 w-5"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? "inline-flex"
                                                : "hidden"
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? "block" : "hidden") +
                        " border-t border-[#f2dce7] bg-white/95 sm:hidden"
                    }
                >
                    <div className="space-y-1 px-3 py-3">
                        <ResponsiveNavLink
                            href={route("events.index")}
                            active={route().current("events.*")}
                        >
                            Eventos
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("products.index")}
                            active={route().current("products.*")}
                        >
                            Productos
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route("reports.index")}
                            active={route().current("reports.*")}
                        >
                            Finanzas
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-[#f2dce7] px-4 py-4">
                        <div className="text-base font-semibold text-[#241b2a]">
                            {user.name}
                        </div>
                        <div className="mt-1 text-sm text-[#6e6774]">
                            {user.email}
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route("profile.edit")}>
                                Perfil
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route("logout")}
                                as="button"
                            >
                                Cerrar sesión
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-[#f4dfe8] bg-white/60 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
