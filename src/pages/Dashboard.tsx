import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Shield, RefreshCw, Info, User as UserIcon, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { NutritionChart } from '@/components/Dashboard/NutritionChart';
import { WeightChart } from '@/components/Dashboard/WeightChart';
import { HydrationChart } from '@/components/Dashboard/HydrationChart';
import { ActivitySummary } from '@/components/Dashboard/ActivitySummary';
import { UserSelector } from '@/components/Dashboard/UserSelector';
import { RecentMeals } from '@/components/Dashboard/RecentMeals';
import { GoalsConfig } from '@/components/Dashboard/GoalsConfig';
import { NutritionInsights } from '@/components/Dashboard/NutritionInsights';
import { useNavigate } from 'react-router-dom';

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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserProfile, setSelectedUserProfile] = useState<Usuario | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [weightData, setWeightData] = useState<any[]>([]);
  const [hydrationData, setHydrationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nutritionPeriod, setNutritionPeriod] = useState<"7d" | "30d">("7d");
  const [weightPeriod, setWeightPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Auth error:', userError);
        navigate('/auth');
        return;
      }
      
      setUser(user);

      // Get user profile with error handling
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        toast({
          title: "Erro",
          description: "Falha ao carregar perfil do usuário. Verifique sua conexão.",
          variant: "destructive",
        });
        
        // Still allow access with basic user info
        setUserProfile(null);
        setSelectedUserId(user.id);
        setSelectedUserProfile(null);
        return;
      }

      setUserProfile(profile);
      setSelectedUserId(user.id);
      setSelectedUserProfile(profile);
      
      // Load dashboard data only if profile loaded successfully
      if (profile) {
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      toast({
        title: "Erro de conexão",
        description: "Falha na autenticação. Redirecionando para login.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Load dashboard summary data with timeout
      const dashboardPromise = supabase
        .rpc('get_user_dashboard_data', { user_id: userId });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const result = await Promise.race([
        dashboardPromise,
        timeoutPromise
      ]);
      
      const { data: dashData, error: dashError } = result as any;

      if (dashError) {
        console.error('Dashboard data error:', dashError);
        toast({
          title: "Aviso",
          description: "Alguns dados podem estar indisponíveis temporariamente.",
          variant: "default",
        });
      } else if (dashData && dashData.length > 0) {
        setDashboardData(dashData[0]);
      }

      // Load charts data in parallel with error isolation
      await Promise.allSettled([
        loadNutritionData(userId, nutritionPeriod),
        loadWeightData(userId, weightPeriod),
        loadHydrationData(userId)
      ]);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Conexão instável",
        description: "Verifique sua conexão e tente recarregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNutritionData = async (userId: string, period: "7d" | "30d") => {
    try {
      console.log(`🔍 Loading nutrition data for user: ${userId}, period: ${period}`);
      
      const days = period === "7d" ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      console.log(`📅 Date range: ${startDateStr} to ${new Date().toISOString().split('T')[0]}`);
      
      // First, check if there's ANY data for this user
      const { data: allUserData, error: allDataError } = await supabase
        .from('informacoes_nutricionais')
        .select('data_registro, calorias, proteinas, carboidratos, gorduras')
        .eq('usuario_id', userId)
        .is('deletado_em', null)
        .order('data_registro', { ascending: false })
        .limit(5);
      
      console.log(`📊 All user data (last 5 records):`, allUserData);
      console.log(`❌ Error fetching all data:`, allDataError);
      
      // Now fetch data for the specific period
      const { data, error } = await supabase
        .from('informacoes_nutricionais')
        .select('data_registro, calorias, proteinas, carboidratos, gorduras')
        .eq('usuario_id', userId)
        .gte('data_registro', startDateStr)
        .is('deletado_em', null)
        .order('data_registro', { ascending: true });

      console.log(`📈 Period data (${period}):`, data);
      console.log(`❌ Period data error:`, error);

      if (error) {
        console.error('❌ Error loading nutrition data:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados nutricionais",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ No nutrition data found for period ${period}. Setting empty array.`);
        setNutritionData([]);
        return;
      }

      // Agrupar por dia com melhor formatação de data
      const grouped = data.reduce((acc, item) => {
        // Handle both date and datetime formats
        const dateStr = item.data_registro.includes('T') 
          ? item.data_registro.split('T')[0] 
          : item.data_registro;
        
        if (!acc[dateStr]) {
          acc[dateStr] = { 
            data_registro: dateStr, 
            calorias: 0, 
            proteinas: 0, 
            carboidratos: 0, 
            gorduras: 0 
          };
        }
        
        acc[dateStr].calorias += Number(item.calorias) || 0;
        acc[dateStr].proteinas += Number(item.proteinas) || 0;
        acc[dateStr].carboidratos += Number(item.carboidratos) || 0;
        acc[dateStr].gorduras += Number(item.gorduras) || 0;
        
        return acc;
      }, {} as Record<string, any>);

      const finalData = Object.values(grouped);
      console.log(`✅ Final grouped nutrition data:`, finalData);
      
      setNutritionData(finalData);
      
    } catch (error) {
      console.error('💥 Exception in loadNutritionData:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados nutricionais",
        variant: "destructive",
      });
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
    navigate('/');
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
    if (selectedUserId) {
      loadNutritionData(selectedUserId, period);
    }
  };

  const handleWeightPeriodChange = (period: "7d" | "30d" | "90d") => {
    setWeightPeriod(period);
    if (selectedUserId) {
      loadWeightData(selectedUserId, period);
    }
  };

  const handleUserChange = async (newUserId: string) => {
    setSelectedUserId(newUserId);
    
    // Load selected user profile
    const { data: profile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', newUserId)
      .single();
    
    if (profile) {
      setSelectedUserProfile(profile);
      await loadDashboardData(newUserId);
    }
  };

  const handleRefresh = async () => {
    if (selectedUserId) {
      setRefreshing(true);
      await loadDashboardData(selectedUserId);
      setRefreshing(false);
      toast({
        title: "Dados atualizados",
        description: "Dashboard atualizado com sucesso!",
      });
    }
  };

  const handleGoalsUpdate = () => {
    if (selectedUserId) {
      loadDashboardData(selectedUserId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs />
        
        {/* Header */}
        <PageHeader
          title="Dashboard Nutricional"
          description="Acompanhe seu progresso e evolução"
          showBackButton
          showRefresh
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        >
          {selectedUserProfile && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {selectedUserId === user?.id ? 'Bem-vindo,' : 'Visualizando dados de:'}
              </span>
              <span className="text-sm font-medium">{selectedUserProfile.nome_completo || selectedUserProfile.email}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {(userProfile?.tipo_usuario === 'gestor' || userProfile?.tipo_usuario === 'socio') && (
              <>
                <Button onClick={() => navigate('/users')} variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Button>
                <Button onClick={() => navigate('/reports')} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </>
            )}
            {(userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente') && (
              <>
                <Button onClick={() => navigate('/users')} variant="outline" size="sm">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Meu Perfil
                </Button>
                <Button onClick={() => navigate('/reports')} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Meus Relatórios
                </Button>
              </>
            )}
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </PageHeader>

        {/* Information Alert for Cliente/Dependente Users */}
        {userProfile && (userProfile.tipo_usuario === 'cliente' || userProfile.tipo_usuario === 'dependente') && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Acesso Limitado:</strong> Como {userProfile.tipo_usuario}, você tem acesso apenas ao seu próprio perfil. 
              Para editar seus dados pessoais, acesse <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 dark:text-blue-400 underline"
                onClick={() => navigate('/users')}
              >
                Gerenciamento de Usuários
              </Button>. Não é possível criar dependentes.
            </AlertDescription>
          </Alert>
        )}

        {/* User Selector for Managers and Partners */}
        {userProfile && (userProfile.tipo_usuario === 'gestor' || userProfile.tipo_usuario === 'socio') && (
          <UserSelector
            currentUser={userProfile}
            selectedUserId={selectedUserId}
            onUserChange={handleUserChange}
          />
        )}

        {/* Goals Configuration */}
        {dashboardData && selectedUserId === user?.id && (
          <div className="mb-6">
            <GoalsConfig
              userId={selectedUserId}
              currentGoals={{
                meta_peso: dashboardData.meta_peso,
                meta_calorias: dashboardData.meta_calorias,
                meta_agua: dashboardData.meta_agua,
              }}
              onGoalsUpdate={handleGoalsUpdate}
            />
          </div>
        )}

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
            metaCalorias={dashboardData?.meta_calorias}
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

        {/* Third Row - Recent Meals and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentMeals userId={selectedUserId} />
          {dashboardData && (
            <NutritionInsights 
              userId={selectedUserId} 
              dashboardData={dashboardData}
            />
          )}
        </div>
      </div>
    </div>
  );
}