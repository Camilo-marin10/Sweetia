export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-gray-300 text-rose-600 shadow-sm focus:ring-rose-500 ' +
                className
            }
        />
    );
}
