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

interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  tipo_usuario: 'socio' | 'gestor' | 'cliente' | 'dependente';
}

interface UserStatsProps {
  userProfile?: Usuario;
}

export function UserStats({ userProfile }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadStats();
    }
  }, [userProfile]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_stats_by_role');
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

  if (!stats || !userProfile) return null;

  // Define which cards to show based on user type
  const getVisibleCards = () => {
    const allCards = [
      {
        title: "Total de Usuários",
        value: stats.total_usuarios,
        icon: Users,
        color: "text-primary",
        key: "total"
      },
      {
        title: "Clientes",
        value: stats.total_clientes,
        icon: UserCheck,
        color: "text-blue-500",
        key: "clientes"
      },
      {
        title: "Sócios",
        value: stats.total_socios,
        icon: Crown,
        color: "text-yellow-500",
        key: "socios"
      },
      {
        title: "Gestores",
        value: stats.total_gestores,
        icon: Shield,
        color: "text-red-500",
        key: "gestores"
      },
      {
        title: "Dependentes",
        value: stats.total_dependentes,
        icon: UserPlus,
        color: "text-green-500",
        key: "dependentes"
      },
      {
        title: "Ativos (30d)",
        value: stats.usuarios_ativos_30_dias,
        icon: Users,
        color: "text-purple-500",
        key: "ativos"
      }
    ];

    switch (userProfile.tipo_usuario) {
      case 'socio':
        // Socios see all cards
        return allCards;
      
      case 'gestor':
        // Gestores only see total users, dependentes, and active users
        return allCards.filter(card => 
          ['total', 'dependentes', 'ativos'].includes(card.key)
        );
      
      case 'cliente':
      case 'dependente':
        // Clientes and dependentes see minimal stats
        return allCards.filter(card => 
          ['total', 'ativos'].includes(card.key)
        );
      
      default:
        return [];
    }
  };

  const visibleCards = getVisibleCards();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${
      visibleCards.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-6'
    }`}>
      {visibleCards.map((stat, index) => {
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