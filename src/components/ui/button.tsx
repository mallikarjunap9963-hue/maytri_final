import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#2a94b5] text-white font-bold hover:bg-[#237d99] shadow-xs",
        destructive: "bg-red-600 text-white font-bold hover:bg-red-700 shadow-xs",
        outline: "border border-slate-300 bg-white text-slate-900 font-bold hover:bg-slate-100 hover:text-slate-900 shadow-xs",
        secondary: "bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs",
        ghost: "hover:bg-slate-100 text-slate-900 font-bold",
        link: "text-[#2a94b5] underline-offset-4 hover:underline font-bold",
        emerald: "bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-xs",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base font-semibold",
        icon: "h-10 w-10 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
