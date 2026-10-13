import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet');
  }
  return context;
}

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({
  open = false,
  onOpenChange = () => {},
  children,
}: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  showClose?: boolean;
}

export function SheetContent({
  side = 'right',
  showClose = true,
  className,
  children,
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = useSheet();

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideClasses = {
    top: 'inset-x-0 top-0 border-b max-h-[85vh] animate-in slide-in-from-top',
    bottom:
      'inset-x-0 bottom-0 border-t max-h-[85vh] animate-in slide-in-from-bottom',
    left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-md border-r animate-in slide-in-from-left',
    right:
      'inset-y-0 right-0 h-full w-full sm:max-w-lg md:max-w-xl border-l animate-in slide-in-from-right',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex"
      data-testid="sheet-root"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
        data-testid="sheet-backdrop"
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-slate-900 border-slate-800 text-slate-100 p-6 shadow-2xl transition ease-in-out duration-300 overflow-y-auto',
          sideClasses[side],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {showClose && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            className="absolute right-4 top-4 rounded-sm p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-2 text-left pr-6', className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-xl font-bold tracking-tight text-white', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-slate-400 leading-relaxed', className)}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto pt-4 border-t border-slate-800',
        className
      )}
      {...props}
    />
  );
}
