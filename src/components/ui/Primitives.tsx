import React from 'react';

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-2 focus-visible:border-indigo-500 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-2 focus-visible:border-indigo-500 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md hover:shadow-indigo-500/20",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200/80",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
      destructive: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm hover:shadow-rose-500/20",
      outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900"
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// --- Badge ---
import { ReviewStatus } from '../../types';

export const StatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  const styles = {
    [ReviewStatus.Published]: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    [ReviewStatus.Pending]: "bg-amber-50 text-amber-700 border-amber-200/50",
    [ReviewStatus.Draft]: "bg-slate-50 text-slate-700 border-slate-200/50",
    [ReviewStatus.Trash]: "bg-rose-50 text-rose-700 border-rose-200/50",
  };

  const labels = {
    [ReviewStatus.Published]: "Published",
    [ReviewStatus.Pending]: "Pending",
    [ReviewStatus.Draft]: "Draft",
    [ReviewStatus.Trash]: "Trash",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};