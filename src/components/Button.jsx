import { clsx } from 'clsx'

export function Button({ children, variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'gradient-primary text-primary-foreground hover:opacity-90 shadow-glow': variant === 'primary',
          'bg-card text-card-foreground border border-border hover:bg-muted': variant === 'secondary',
          'bg-destructive text-destructive-foreground hover:opacity-90': variant === 'destructive',
          'hover:bg-muted': variant === 'ghost',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
