import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';
import ethraBg from '@/assets/ethra-bg.jpg';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: `url(${ethraBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        
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
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${ethraBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="group">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full p-6 rounded-lg bg-glass border border-glass backdrop-blur-lg hover:bg-glass/80 h-auto min-h-[140px] flex flex-col items-center justify-center space-y-3 text-center"
                variant="ghost"
              >
                <Shield className="h-8 w-8 text-ethra flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Dashboard Nutricional</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
                    Acompanhe seu progresso e evolução nutricional
                  </p>
                </div>
              </Button>
            </div>
            
            <div className="group">
              <Button 
                onClick={() => navigate('/users')}
                className="w-full p-6 rounded-lg bg-glass border border-glass backdrop-blur-lg hover:bg-glass/80 h-auto min-h-[140px] flex flex-col items-center justify-center space-y-3 text-center"
                variant="ghost"
              >
                <Users className="h-8 w-8 text-ethra flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Gerenciar Usuários</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
                    Visualizar, editar e deletar usuários do sistema
                  </p>
                </div>
              </Button>
            </div>
            
            <div className="group">
              <Button 
                onClick={() => navigate('/create-dependent')}
                className="w-full p-6 rounded-lg bg-glass border border-glass backdrop-blur-lg hover:bg-glass/80 h-auto min-h-[140px] flex flex-col items-center justify-center space-y-3 text-center"
                variant="ghost"
              >
                <Users className="h-8 w-8 text-ethra flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Criar Dependente</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
                    Criar novos usuários dependentes vinculados à sua conta
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
