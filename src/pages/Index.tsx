import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Users, Info, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Load user profile
            const { data: profile, error } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching user profile:', error);
              toast({
                title: "Erro ao carregar perfil",
                description: "Não foi possível carregar seus dados. Tente novamente.",
                variant: "destructive",
              });
            }
            
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load user profile
          const { data: profile, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching user profile:', error);
            toast({
              title: "Erro ao carregar perfil",
              description: "Não foi possível carregar seus dados. Tente novamente.",
              variant: "destructive",
            });
          }
          
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o logout.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethra mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-ethra/10">
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-8">
          <div className="flex items-center justify-center space-x-3">
            <Shield className="h-12 w-12 text-ethra" />
            <h1 className="text-4xl md:text-6xl font-bold bg-ethra-gradient bg-clip-text text-transparent">
              Ethra
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema de acesso seguro e portal de administração
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-ethra hover:bg-ethra/80 shadow-ethra-glow"
          >
            Acessar Sistema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-ethra/10">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-glass bg-glass backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-ethra" />
            <span className="text-xl font-bold bg-ethra-gradient bg-clip-text text-transparent">
              Ethra
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Bem-vindo, {user.user_metadata?.full_name || user.email}
            </span>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center space-y-8">
          <h1 className="text-2xl md:text-4xl font-bold">
            Painel de Controle Ethra
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Bem-vindo ao sistema de administração Ethra
          </p>
          
          {/* Information Alert for Cliente/Dependente Users */}
          {userProfile && (userProfile.tipo_usuario === 'cliente' || userProfile.tipo_usuario === 'dependente') && (
            <Alert className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 max-w-4xl mx-auto">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Acesso Limitado:</strong> Como {userProfile.tipo_usuario}, você tem acesso apenas ao seu próprio perfil 
                e não pode criar dependentes. Utilize "Dashboard Nutricional" para acompanhar seus dados e "Gerenciar Usuários" 
                para editar seu perfil pessoal.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="group">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full p-6 rounded-lg bg-glass border border-glass backdrop-blur-lg hover:bg-glass/80 h-auto min-h-[160px] flex flex-col items-center justify-center space-y-4 text-center"
                variant="ghost"
              >
                <Shield className="h-8 w-8 text-ethra flex-shrink-0" />
                <div className="space-y-2 flex-1 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-foreground leading-tight">
                    Dashboard Nutricional
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed px-2">
                    Acompanhe seu progresso e evolução nutricional
                  </p>
                </div>
              </Button>
            </div>
            
            <div className="group">
              <Button 
                onClick={() => navigate('/users')}
                className="w-full p-6 rounded-lg bg-glass border border-glass backdrop-blur-lg hover:bg-glass/80 h-auto min-h-[160px] flex flex-col items-center justify-center space-y-4 text-center"
                variant="ghost"
              >
                {userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente' ? (
                  <User className="h-8 w-8 text-ethra flex-shrink-0" />
                ) : (
                  <Users className="h-8 w-8 text-ethra flex-shrink-0" />
                )}
                <div className="space-y-2 flex-1 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-foreground leading-tight">
                    {userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente' 
                      ? 'Meu Perfil' 
                      : 'Gerenciar Usuários'
                    }
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed px-2">
                    {userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente'
                      ? 'Visualizar e editar seus dados pessoais'
                      : 'Visualizar, editar e deletar usuários do sistema'
                    }
                  </p>
                </div>
              </Button>
            </div>
            
            <div className="group">
              <Button 
                onClick={() => navigate('/create-dependent')}
                className={`w-full p-6 rounded-lg bg-glass border border-glass backdrop-blur-lg h-auto min-h-[160px] flex flex-col items-center justify-center space-y-4 text-center ${
                  userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente'
                    ? 'opacity-50 cursor-not-allowed hover:bg-glass' 
                    : 'hover:bg-glass/80'
                }`}
                variant="ghost"
                disabled={userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente'}
              >
                <Users className="h-8 w-8 text-ethra flex-shrink-0" />
                <div className="space-y-2 flex-1 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-foreground leading-tight">
                    Criar Dependente
                    {(userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente') && (
                      <span className="block text-xs text-red-500 font-normal mt-1">
                        (Não disponível)
                      </span>
                    )}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed px-2">
                    {userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente'
                      ? 'Funcionalidade restrita ao seu tipo de usuário'
                      : 'Criar novos usuários dependentes vinculados à sua conta'
                    }
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
