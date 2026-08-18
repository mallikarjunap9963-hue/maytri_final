import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#2a94b5]/15 text-[#1b657c] border-[#2a94b5]/30",
        secondary:
          "bg-slate-100 text-slate-900 border-slate-300",
        destructive:
          "bg-red-100 text-red-900 border-red-300",
        outline:
          "text-slate-900 border-slate-300 bg-white",
        success:
          "bg-emerald-100 text-emerald-900 border-emerald-300",
        info:
          "bg-sky-100 text-sky-900 border-sky-300",
        purple:
          "bg-purple-100 text-purple-900 border-purple-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
