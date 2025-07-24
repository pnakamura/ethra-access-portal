import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Crown, Shield, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserStatsData {
  total_usuarios: number;
  total_clientes: number;
  total_socios: number;
  total_gestores: number;
  total_dependentes: number;
  usuarios_ativos_30_dias: number;
}

export function UserStats() {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_stats');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-card-dark border-primary/20">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.total_usuarios,
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Clientes",
      value: stats.total_clientes,
      icon: UserCheck,
      color: "text-blue-500"
    },
    {
      title: "Sócios",
      value: stats.total_socios,
      icon: Crown,
      color: "text-yellow-500"
    },
    {
      title: "Gestores",
      value: stats.total_gestores,
      icon: Shield,
      color: "text-red-500"
    },
    {
      title: "Dependentes",
      value: stats.total_dependentes,
      icon: UserPlus,
      color: "text-green-500"
    },
    {
      title: "Ativos (30d)",
      value: stats.usuarios_ativos_30_dias,
      icon: Users,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="bg-card-dark border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.title === "Ativos (30d)" && stats.total_usuarios > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round((stat.value / stats.total_usuarios) * 100)}% dos usuários
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}