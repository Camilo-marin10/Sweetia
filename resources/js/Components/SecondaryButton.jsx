export default function SecondaryButton({
    type = "button",
    className = "",
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center rounded-full border border-[#f0d9e4] bg-[#fffafc] px-4 py-2.5 text-sm font-semibold text-[#4b3b4b] shadow-[0_8px_20px_rgba(89,54,76,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e9bed0] hover:bg-[#fff2f8] focus:outline-none focus:ring-4 focus:ring-[#f8dfe9] disabled:cursor-not-allowed disabled:opacity-25 ${
                    disabled && "opacity-25"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
