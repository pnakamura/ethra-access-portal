import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface EnhancedToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function enhancedToast({ title, description, type = 'info', duration = 4000 }: EnhancedToastOptions) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const variants = {
    success: 'default',
    error: 'destructive',
    warning: 'default',
    info: 'default',
  } as const;

  const colors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const Icon = icons[type];

  toast({
    title,
    description: (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colors[type]}`} />
        {description}
      </div>
    ),
    variant: variants[type],
    duration,
  });
}

// Convenience functions
export const successToast = (title: string, description?: string) => 
  enhancedToast({ title, description, type: 'success' });

export const errorToast = (title: string, description?: string) => 
  enhancedToast({ title, description, type: 'error' });

export const warningToast = (title: string, description?: string) => 
  enhancedToast({ title, description, type: 'warning' });

export const infoToast = (title: string, description?: string) => 
  enhancedToast({ title, description, type: 'info' });