import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-ess-purple text-white hover:bg-ess-purple/90 focus:ring-ess-purple/50 shadow-sm',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
      outline: 'border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-200',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-200',
      link: 'text-ess-purple hover:underline focus:ring-ess-purple/50 !p-0 !h-auto',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-4 text-sm gap-1.5',
      md: 'h-11 px-6 text-sm gap-2',
      lg: 'h-14 px-8 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${variant !== 'link' ? sizes[size] : ''} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="flex items-center">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
