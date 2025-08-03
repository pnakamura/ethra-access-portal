import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export function ResponsiveWrapper({ 
  children, 
  className, 
  mobileClassName, 
  desktopClassName 
}: ResponsiveWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      className,
      isMobile ? mobileClassName : desktopClassName
    )}>
      {children}
    </div>
  );
}

// Helper hook for responsive values
export function useResponsiveValue<T>(mobileValue: T, desktopValue: T): T {
  const isMobile = useIsMobile();
  return isMobile ? mobileValue : desktopValue;
}

// Responsive grid component
export function ResponsiveGrid({ 
  children, 
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}) {
  const gridCols = `grid-cols-${cols.mobile || 1} md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3}`;

  return (
    <div className={cn(
      'grid gap-4',
      gridCols,
      className
    )}>
      {children}
    </div>
  );
}