import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => (
  <AlertDialogContext.Provider value={{ open, setOpen: onOpenChange }}>
    {children}
  </AlertDialogContext.Provider>
);

export const AlertDialogContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-sand-200/20 bg-ink-900/90 p-6 shadow-card",
          className
        )}
        {...props}
      />
    </div>
  );
};

export const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2", className)} {...props} />
);

export const AlertDialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold text-sand-100", className)} {...props} />
);

export const AlertDialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-sand-200/80", className)} {...props} />
);

export const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6 flex flex-wrap justify-end gap-2", className)} {...props} />
);

export const AlertDialogCancel = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="outline" className={className} {...props} />
);

export const AlertDialogAction = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button className={className} {...props} />
);
