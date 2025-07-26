import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield, ArrowLeft } from 'lucide-react';

interface Usuario {
  id: string;
  nome_completo: string | null;
  email: string | null;
  tipo_usuario: 'cliente' | 'socio' | 'gestor' | 'dependente' | null;
}

export default function CreateDependent() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form fields
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndPermissions();
  }, []);

  const checkAuthAndPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      
      setUser(user);

      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil do usuário:', profileError);
        toast({
          title: "Erro",
          description: "Falha ao verificar permissões do usuário",
          variant: "destructive",
        });
        window.location.href = '/auth';
        return;
      }

      setUserProfile(profile);
      
      // Check if user is socio or gestor
      const userIsAuthorized = profile.tipo_usuario === 'gestor' || profile.tipo_usuario === 'socio';
      setIsAuthorized(userIsAuthorized);
      
      if (!userIsAuthorized) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para criar dependentes",
          variant: "destructive",
        });
        window.location.href = '/';
        return;
      }
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      window.location.href = '/auth';
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomeCompleto || !email || !password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada, faça login novamente",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to create dependent
      const { data, error } = await supabase.functions.invoke('create-dependent', {
        body: {
          nomeCompleto,
          email,
          celular,
          password
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Erro ao chamar função:', error);
        toast({
          title: "Erro",
          description: error.message || "Falha ao criar dependente",
          variant: "destructive",
        });
        return;
      }

      if (data.warning) {
        toast({
          title: "Aviso",
          description: data.warning,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Dependente criado com sucesso",
        });
      }

      // Reset form
      setNomeCompleto('');
      setEmail('');
      setCelular('');
      setPassword('');

    } catch (error) {
      console.error('Erro ao criar dependente:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar dependente",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethra mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => window.location.href = '/'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Criar Dependente
            </h1>
            <p className="text-muted-foreground mt-2">
              Crie novos usuários dependentes vinculados à sua conta
            </p>
            {userProfile && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Logado como:</span>
                <Badge variant={getRoleBadgeVariant(userProfile.tipo_usuario)}>
                  {getRoleDisplayName(userProfile.tipo_usuario)}
                </Badge>
                <span className="text-sm font-medium">{userProfile.nome_completo || userProfile.email}</span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Voltar ao Dashboard
            </Button>
            <Button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} variant="destructive">
              Sair
            </Button>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto bg-card-dark border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Novo Dependente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDependent} className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite o email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="Digite o celular"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Dependente'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}