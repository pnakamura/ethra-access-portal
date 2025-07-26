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
  default: '',
  primary: 'border-primary/50 bg-primary/5',
  success: 'border-green-500/50 bg-green-500/5',
  warning: 'border-yellow-500/50 bg-yellow-500/5',
  danger: 'border-red-500/50 bg-red-500/5',
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
  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md animate-fade-in',
      variantStyles[variant],
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          {title}
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn(
            'text-xs mt-2 flex items-center gap-1',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}% vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}