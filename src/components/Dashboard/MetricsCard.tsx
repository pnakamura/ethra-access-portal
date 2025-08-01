import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'card-modern',
  primary: 'border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 card-modern',
  success: 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-500/5 card-modern',
  warning: 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 card-modern',
  danger: 'border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-500/5 card-modern',
};

export function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: MetricsCardProps) {
  const iconColorClass = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  }[variant];

  return (
    <Card className={cn(
      'transition-all duration-300 animate-fade-in group',
      variantStyles[variant],
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground/80">
          {title}
          {Icon && (
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-white/10 to-white/5 group-hover:scale-110 transition-transform duration-200">
              <Icon className={cn("h-4 w-4", iconColorClass)} />
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/70 leading-relaxed">{description}</p>
        )}
        {trend && (
          <div className={cn(
            'text-xs flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 w-fit',
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          )}>
            <span className="text-sm">{trend.isPositive ? '↗' : '↘'}</span>
            <span className="font-medium">{Math.abs(trend.value)}% vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}