import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Shield } from 'lucide-react';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { NutritionChart } from '@/components/Dashboard/NutritionChart';
import { WeightChart } from '@/components/Dashboard/WeightChart';
import { HydrationChart } from '@/components/Dashboard/HydrationChart';
import { ActivitySummary } from '@/components/Dashboard/ActivitySummary';

interface DashboardData {
  peso_atual: number;
  ultimo_peso: number;
  meta_peso: number;
  meta_calorias: number;
  meta_agua: number;
  calorias_hoje: number;
  agua_hoje: number;
  registros_peso_30_dias: number;
  registros_nutricao_30_dias: number;
  registros_agua_30_dias: number;
}

interface Usuario {
  id: string;
  nome_completo: string | null;
  email: string | null;
  tipo_usuario: 'cliente' | 'socio' | 'gestor' | 'dependente' | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [hydrationData, setHydrationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutritionPeriod, setNutritionPeriod] = useState<"7d" | "30d">("7d");
  const [weightPeriod, setWeightPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      
      setUser(user);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        toast({
          title: "Erro",
          description: "Falha ao carregar perfil do usuário",
          variant: "destructive",
        });
        return;
      }

      setUserProfile(profile);
      await loadDashboardData(user.id);
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      window.location.href = '/auth';
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Load dashboard summary data
      const { data: dashData, error: dashError } = await supabase
        .rpc('get_user_dashboard_data', { user_id: userId });

      if (dashError) throw dashError;
      
      if (dashData && dashData.length > 0) {
        setDashboardData(dashData[0]);
      }

      // Load nutrition data
      await loadNutritionData(userId, nutritionPeriod);
      
      // Load weight data
      await loadWeightData(userId, weightPeriod);
      
      // Load hydration data (last 7 days)
      await loadHydrationData(userId);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNutritionData = async (userId: string, period: "7d" | "30d") => {
    const days = period === "7d" ? 7 : 30;
    const { data, error } = await supabase
      .from('informacoes_nutricionais')
      .select('data_registro, calorias, proteinas, carboidratos, gorduras')
      .eq('usuario_id', userId)
      .gte('data_registro', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .is('deletado_em', null)
      .order('data_registro', { ascending: true });

    if (!error && data) {
      // Agrupar por dia
      const grouped = data.reduce((acc, item) => {
        const date = item.data_registro.split('T')[0];
        if (!acc[date]) {
          acc[date] = { data_registro: date, calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
        }
        acc[date].calorias += item.calorias || 0;
        acc[date].proteinas += item.proteinas || 0;
        acc[date].carboidratos += item.carboidratos || 0;
        acc[date].gorduras += item.gorduras || 0;
        return acc;
      }, {} as Record<string, any>);

      setNutritionData(Object.values(grouped));
    }
  };

  const loadWeightData = async (userId: string, period: "7d" | "30d" | "90d") => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const { data, error } = await supabase
      .from('registro_peso')
      .select('data_registro, peso_kg')
      .eq('usuario_id', userId)
      .gte('data_registro', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .is('deletado_em', null)
      .order('data_registro', { ascending: true });

    if (!error && data) {
      setWeightData(data);
    }
  };

  const loadHydrationData = async (userId: string) => {
    const { data, error } = await supabase
      .from('registro_hidratacao')
      .select('horario, quantidade_ml')
      .eq('usuario_id', userId)
      .gte('horario', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .is('deletado_em', null)
      .order('horario', { ascending: true });

    if (!error && data) {
      const formattedData = data.map(item => ({
        date: item.horario,
        quantidade_ml: item.quantidade_ml
      }));
      setHydrationData(formattedData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getRoleBadgeVariant = (tipoUsuario: string | null) => {
    if (tipoUsuario === 'gestor') return 'destructive';
    if (tipoUsuario === 'socio') return 'secondary';
    return 'outline';
  };

  const getRoleDisplayName = (tipoUsuario: string | null) => {
    if (tipoUsuario === 'gestor') return 'Gestor';
    if (tipoUsuario === 'socio') return 'Sócio';
    if (tipoUsuario === 'dependente') return 'Dependente';
    return 'Cliente';
  };

  const handleNutritionPeriodChange = (period: "7d" | "30d") => {
    setNutritionPeriod(period);
    if (user) {
      loadNutritionData(user.id, period);
    }
  };

  const handleWeightPeriodChange = (period: "7d" | "30d" | "90d") => {
    setWeightPeriod(period);
    if (user) {
      loadWeightData(user.id, period);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethra mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard Nutricional
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe seu progresso e evolução
            </p>
            {userProfile && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Bem-vindo,</span>
                <span className="text-sm font-medium">{userProfile.nome_completo || userProfile.email}</span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            {userProfile?.tipo_usuario === 'gestor' && (
              <Button onClick={() => window.location.href = '/users'} variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Gerenciar Usuários
              </Button>
            )}
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardData && (
          <div className="mb-8">
            <StatsCards
              pesoAtual={dashboardData.peso_atual}
              metaPeso={dashboardData.meta_peso}
              caloriasHoje={dashboardData.calorias_hoje}
              metaCalorias={dashboardData.meta_calorias}
              aguaHoje={dashboardData.agua_hoje}
              metaAgua={dashboardData.meta_agua}
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <NutritionChart
            data={nutritionData}
            period={nutritionPeriod}
            onPeriodChange={handleNutritionPeriodChange}
          />
          <WeightChart
            data={weightData}
            metaPeso={dashboardData?.meta_peso}
            period={weightPeriod}
            onPeriodChange={handleWeightPeriodChange}
          />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <HydrationChart
            data={hydrationData}
            metaAgua={dashboardData?.meta_agua}
          />
          <div className="lg:col-span-2">
            {dashboardData && (
              <ActivitySummary
                registrosPeso30Dias={dashboardData.registros_peso_30_dias}
                registrosNutricao30Dias={dashboardData.registros_nutricao_30_dias}
                registrosAgua30Dias={dashboardData.registros_agua_30_dias}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}