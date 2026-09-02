export default function PrimaryButton({
    className = "",
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-full border border-transparent bg-gradient-to-r from-[#d94a7d] to-[#bf3d6e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(190,77,120,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(190,77,120,0.32)] focus:outline-none focus:ring-4 focus:ring-[#f7dce8] active:translate-y-0 ${
                    disabled && "cursor-not-allowed opacity-25"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
