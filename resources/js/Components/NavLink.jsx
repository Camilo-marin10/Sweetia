import { Link } from "@inertiajs/react";

export default function NavLink({
    active = false,
    className = "",
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                "inline-flex items-center rounded-full px-3.5 py-2 text-sm font-medium leading-5 transition-all duration-200 focus:outline-none " +
                (active
                    ? "bg-[#fff1f7] text-[#b93d69] shadow-[inset_0_0_0_1px_rgba(207,120,157,0.35)]"
                    : "text-[#635867] hover:bg-[#fff8fb] hover:text-[#b93d69]") +
                className
            }
        >
            {children}
        </Link>
    );
}
