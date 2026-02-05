import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-sand-200/40 bg-ink-900/60 px-3 py-2 text-sm text-sand-100 placeholder:text-sand-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-400",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
