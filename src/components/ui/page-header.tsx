import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  onBack?: () => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  showBackButton = false,
  backHref = '/',
  onBack,
  showRefresh = false,
  onRefresh,
  isRefreshing = false,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backHref);
    }
  };

  return (
    <div className={cn("flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 animate-fade-in", className)}>
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        {showRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
        )}
        
        {showBackButton && (
          <Button 
            onClick={handleBack} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}