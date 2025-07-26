import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Início',
  '/dashboard': 'Dashboard',
  '/users': 'Usuários',
  '/auth': 'Autenticação',
  '/create-dependent': 'Criar Dependente',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current route if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);
  
  if (breadcrumbItems.length <= 1) return null;
  
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground mb-6", className)}>
      <Link 
        to="/" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.current || !item.href ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  segments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : path,
      current: isLast,
    });
  });
  
  return breadcrumbs;
}