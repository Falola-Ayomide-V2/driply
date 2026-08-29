import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium tracking-wide text-ink-600">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-lg border border-bone-300 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors duration-200 focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
);

Input.displayName = "Input";
export default Input;
