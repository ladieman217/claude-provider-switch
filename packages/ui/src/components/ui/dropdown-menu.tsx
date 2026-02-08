import { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "../../lib/utils";

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const context = useDropdownMenuContext();
  
  if (asChild) {
    return (
      <div onClick={() => context.setOpen(!context.open)} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <button
      onClick={() => context.setOpen(!context.open)}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DropdownMenuContent({ children, className, align = "end" }: DropdownMenuContentProps) {
  const context = useDropdownMenuContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context.setOpen(false);
      }
    }

    if (context.open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [context]);

  if (!context.open) return null;

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border border-sand-200/10 bg-ink-800/95 p-1 shadow-lg backdrop-blur-sm animate-fade-in",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function DropdownMenuItem({ children, className, onClick, disabled }: DropdownMenuItemProps) {
  const context = useDropdownMenuContext();

  return (
    <button
      disabled={disabled}
      onClick={() => {
        onClick?.();
        context.setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "text-sand-200 hover:bg-sand-200/10 hover:text-sand-100",
        "focus:bg-sand-200/10 focus:text-sand-100",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

