
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, UserPlus, AlertTriangle, Shield, ArrowLeft, LogOut } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { TableSkeleton, StatsSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { UserFilters } from '@/components/UserManagement/UserFilters';
import { UserStats } from '@/components/UserManagement/UserStats';
import { UserTable } from '@/components/UserManagement/UserTable';
import { useNavigate } from 'react-router-dom';
import { CreateUserDialog } from '@/components/UserManagement/CreateUserDialog';

interface Usuario {
  id: string;
  nome_completo: string | null;
  email: string | null;
  tipo_usuario: 'cliente' | 'socio' | 'gestor' | 'dependente' | null;
  atualizado_em: string | null;
  celular?: string | null;
  peso_atual_kg?: number | null;
  plano_id?: string | null;
  whatsapp_id?: string | null;
  admin_responsavel_id?: string | null;
  nome_plano?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: 'gestor' | 'socio' | null;
}

interface Plano {
  id: string;
  nome_plano: string;
  valor: number;
  ativo: boolean;
}

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteUsuario, setDeleteUsuario] = useState<Usuario | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileMode, setIsProfileMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserConfirmPassword, setEditUserConfirmPassword] = useState('');
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoUsuarioFilter, setTipoUsuarioFilter] = useState('all');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user, redirecting to auth');
        navigate('/auth');
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
        navigate('/auth');
        return;
      }

      console.log('User profile loaded:', profile);
      setUserProfile(profile);
      
      // Check if user is admin or socio - correct hierarchy: socio > gestor  
      const userIsAdmin = profile.tipo_usuario === 'gestor';
      const userIsSocio = profile.tipo_usuario === 'socio';
      const isClienteOrDependente = profile.tipo_usuario === 'cliente' || profile.tipo_usuario === 'dependente';
      setIsAdmin(userIsAdmin || userIsSocio);
      setIsProfileMode(isClienteOrDependente);
      
      // All authenticated users can access - different views based on role
      const canAccess = userIsAdmin || userIsSocio || isClienteOrDependente;
      
      if (!canAccess) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Load data based on user role - now passing profile to avoid timing issues
      if (userIsAdmin || userIsSocio) {
        await Promise.all([loadUsuarios(profile), loadPlanos()]);
      } else {
        // For cliente/dependente, only load plans for their own profile editing
        await loadPlanos();
      }
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async (profile?: Usuario) => {
    try {
      const currentProfile = profile || userProfile;
      if (currentProfile?.tipo_usuario === 'socio') {
        // Sócios podem ver todos os usuários - usando consultas separadas para evitar problemas com JOIN complexo
        const { data: usuarios, error: usuariosError } = await supabase
          .from('usuarios')
          .select(`
            *,
            planos:plano_id (
              nome_plano
            )
          `)
          .order('atualizado_em', { ascending: false });

        if (usuariosError) throw usuariosError;

        // Get vinculos separately 
        const { data: vinculos, error: vinculosError } = await supabase
          .from('vinculos_usuarios')
          .select(`
            usuario_id,
            usuario_principal_id,
            responsavel:usuarios!usuario_principal_id (
              nome_completo,
              tipo_usuario
            )
          `)
          .eq('ativo', true);

        if (vinculosError) throw vinculosError;

        // Create a map for faster lookup
        const vinculosMap = new Map();
        vinculos?.forEach(vinculo => {
          vinculosMap.set(vinculo.usuario_id, vinculo);
        });
        
        // Map the data to include nome_plano and responsavel info
        const usuariosWithPlanos = usuarios?.map(usuario => {
          const vinculo = vinculosMap.get(usuario.id);
          return {
            ...usuario,
            nome_plano: usuario.planos?.nome_plano || null,
            responsavel_nome: vinculo?.responsavel?.nome_completo || null,
            responsavel_tipo: vinculo?.responsavel?.tipo_usuario || null
          };
        }) || [];
        
        setUsuarios(usuariosWithPlanos);
      } else if (currentProfile?.tipo_usuario === 'gestor') {
        // Gestores podem ver apenas usuários vinculados a eles
        const { data: userIds, error: vinculosError } = await supabase
          .from('vinculos_usuarios')
          .select('usuario_id')
          .eq('usuario_principal_id', currentProfile.id)
          .eq('ativo', true);
        
        if (!vinculosError && userIds && userIds.length > 0) {
          const ids = userIds.map(v => v.usuario_id);
          const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select(`
              *,
              planos:plano_id (
                nome_plano
              )
            `)
            .in('id', ids)
            .order('atualizado_em', { ascending: false });
          
          if (usuariosError) throw usuariosError;
          
          // Map the joined data to include nome_plano and add current user
          const usuariosWithPlanos = usuarios?.map(usuario => ({
            ...usuario,
            nome_plano: usuario.planos?.nome_plano || null,
            responsavel_nome: currentProfile.nome_completo,
            responsavel_tipo: currentProfile.tipo_usuario as 'gestor'
          })) || [];
          
          setUsuarios([currentProfile, ...usuariosWithPlanos]);
        } else {
          // No linked users, only show themselves
          setUsuarios([currentProfile]);
        }
      } else {
        // Other user types only see themselves
        setUsuarios([currentProfile]);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlanos = async () => {
    try {
      const { data: planos, error: planosError } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .is('deletado_em', null)
        .order('nome_plano');

      if (planosError) throw planosError;
      
      setPlanos(planos || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar planos",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario({ ...usuario });
    setEditUserPassword('');
    setEditUserConfirmPassword('');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUsuario) return;
    
    const isSocio = userProfile?.tipo_usuario === 'socio';
    const isGestor = userProfile?.tipo_usuario === 'gestor';
    const isOwnProfile = editingUsuario.id === user?.id;
    
    // Validate password if provided
    if (editUserPassword || editUserConfirmPassword) {
      if (editUserPassword !== editUserConfirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }
      
      if (editUserPassword.length < 6) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }
    }
    
    // For profile mode (cliente/dependente), only allow editing own profile
    if (isProfileMode && !isOwnProfile) {
      toast({
        title: "Acesso Negado",
        description: "Você só pode editar seu próprio perfil",
        variant: "destructive",
      });
      return;
    }
    
    // For admin mode, apply original permissions
    if (!isProfileMode) {
      const originalUser = usuarios.find(u => u.id === editingUsuario.id);
      if (!originalUser) return;
      
      const canEdit = isSocio || (isGestor && originalUser.tipo_usuario === 'dependente');
      if (!canEdit) {
        toast({
          title: "Acesso Negado",
          description: isSocio ? "Erro inesperado" : "Gestores podem editar apenas dependentes",
          variant: "destructive",
        });
        return;
      }

      // SECURITY: Prevent privilege escalation
      const isPromotingToHigherRole = isGestor && ['socio', 'gestor'].includes(editingUsuario.tipo_usuario || '');
      if (isPromotingToHigherRole) {
        toast({
          title: "Erro de Segurança", 
          description: "Gestores não podem promover usuários a sócio ou gestor",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Prepare update data - in profile mode, exclude administrative fields
      const updateData: any = {
        nome_completo: editingUsuario.nome_completo,
        email: editingUsuario.email,
        celular: editingUsuario.celular,
        peso_atual_kg: editingUsuario.peso_atual_kg,
        atualizado_em: new Date().toISOString(),
      };

      // Only include admin fields if not in profile mode
      if (!isProfileMode) {
        updateData.tipo_usuario = editingUsuario.tipo_usuario as 'cliente' | 'socio' | 'gestor' | 'dependente';
        updateData.plano_id = editingUsuario.plano_id;
        
        // Log admin action for audit purposes
        await supabase.rpc('log_admin_action', {
          action_type: 'user_update',
          target_user_id: editingUsuario.id,
          target_email: editingUsuario.email,
          action_details: {
            old_tipo: usuarios.find(u => u.id === editingUsuario.id)?.tipo_usuario,
            new_tipo: editingUsuario.tipo_usuario,
            updated_fields: ['nome_completo', 'email', 'tipo_usuario', 'celular', 'peso_atual_kg', 'plano_id']
          }
        });
      }

      // Update usuario with security validation
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', editingUsuario.id);

      if (usuarioError) throw usuarioError;

      // Update password if provided
      if (editUserPassword) {
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke(
            'update-user-password',
            {
              body: {
                userId: editingUsuario.id,
                newPassword: editUserPassword
              }
            }
          );

          if (functionError) {
            console.error('Error updating password:', functionError);
            toast({
              title: "Erro",
              description: functionError.message || "Erro ao atualizar senha",
              variant: "destructive",
            });
            return;
          }

          if (!functionData?.success) {
            toast({
              title: "Erro",
              description: functionData?.error || "Erro ao atualizar senha",
              variant: "destructive",
            });
            return;
          }
        } catch (err) {
          console.error('Error calling update password function:', err);
          toast({
            title: "Erro",
            description: "Erro ao atualizar senha",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Sucesso",
        description: editUserPassword 
          ? (isProfileMode ? "Perfil e senha atualizados com sucesso" : "Usuário e senha atualizados com sucesso")
          : (isProfileMode ? "Perfil atualizado com sucesso" : "Usuário atualizado com sucesso"),
      });

      setIsEditDialogOpen(false);
      setEditingUsuario(null);
      setEditUserPassword('');
      setEditUserConfirmPassword('');
      
      if (isProfileMode) {
        // Reload user profile data
        await checkAuthAndLoadData();
      } else {
        await loadUsuarios();
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setDeleteUsuario(usuario);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUsuario || !isAdmin) return;

    // Prevent admin from deleting their own account
    if (deleteUsuario.id === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode deletar sua própria conta.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada",
          variant: "destructive",
        });
        return;
      }

      // Call the Edge Function to delete the user completely
      const response = await fetch(`https://jjpajouvaovffcfjjqkf.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: deleteUsuario.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error deleting user:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro ao excluir usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído completamente do sistema",
      });

      setIsDeleteDialogOpen(false);
      setDeleteUsuario(null);
      await loadUsuarios();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar usuário",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });

      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar senha",
        variant: "destructive",
      });
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

  // Aplicar filtros aos usuários
  const filteredUsuarios = usuarios.filter(usuario => {
    // Filtro por busca (nome ou email)
    const matchesSearch = !searchTerm || 
      (usuario.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro por tipo de usuário
    const matchesTipo = tipoUsuarioFilter === 'all' || usuario.tipo_usuario === tipoUsuarioFilter;

    // Filtro por data
    let matchesData = true;
    if (dataInicioFilter || dataFimFilter) {
      const usuarioDate = usuario.atualizado_em ? new Date(usuario.atualizado_em) : null;
      if (usuarioDate) {
        if (dataInicioFilter) {
          matchesData = matchesData && usuarioDate >= new Date(dataInicioFilter);
        }
        if (dataFimFilter) {
          matchesData = matchesData && usuarioDate <= new Date(dataFimFilter + 'T23:59:59');
        }
      }
    }

    return matchesSearch && matchesTipo && matchesData;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6">
          <Breadcrumbs />
          <div className="mb-8">
            <div className="h-10 w-80 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-60 bg-muted animate-pulse rounded" />
          </div>
          <StatsSkeleton className="mb-8" />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // All authenticated users can access, but with different views
  const canAccessPage = userProfile?.tipo_usuario === 'gestor' || userProfile?.tipo_usuario === 'socio' || 
                       userProfile?.tipo_usuario === 'cliente' || userProfile?.tipo_usuario === 'dependente';
  if (!canAccessPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs />
        
        <PageHeader
          title={isProfileMode ? "Meu Perfil" : "Gerenciamento de Usuários"}
          description={isProfileMode ? "Visualize e edite suas informações pessoais" : "Gerencie todos os usuários cadastrados no sistema"}
          showBackButton
        >
          {userProfile && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Logado como:</span>
              <Badge variant={getRoleBadgeVariant(userProfile.tipo_usuario)}>
                {getRoleDisplayName(userProfile.tipo_usuario)}
              </Badge>
              <span className="text-sm font-medium">{userProfile.nome_completo || userProfile.email}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {isProfileMode ? (
              <>
                <Button onClick={() => handleEdit(userProfile)} size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
                <Button onClick={() => setIsPasswordDialogOpen(true)} variant="outline" size="sm">
                  Alterar Senha
                </Button>
              </>
            ) : (
              <>
                {userProfile?.tipo_usuario === 'socio' && (
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </Button>
                )}
                {userProfile?.tipo_usuario === 'gestor' && (
                  <Button size="sm" onClick={() => navigate('/create-dependent')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Dependente
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </PageHeader>

        {/* Admin view - show stats, filters and user table */}
        {!isProfileMode && (
          <>
            <UserStats userProfile={userProfile} />

            <UserFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              tipoUsuarioFilter={tipoUsuarioFilter}
              setTipoUsuarioFilter={setTipoUsuarioFilter}
              dataInicioFilter={dataInicioFilter}
              setDataInicioFilter={setDataInicioFilter}
              dataFimFilter={dataFimFilter}
              setDataFimFilter={setDataFimFilter}
              onClearFilters={() => {
                setSearchTerm('');
                setTipoUsuarioFilter('all');
                setDataInicioFilter('');
                setDataFimFilter('');
              }}
            />

            <UserTable
              usuarios={filteredUsuarios}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              getRoleBadgeVariant={getRoleBadgeVariant}
              getRoleDisplayName={getRoleDisplayName}
            />
          </>
        )}

        {/* Profile view - show user profile card */}
        {isProfileMode && userProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                  <p className="text-sm mt-1">{userProfile.nome_completo || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm mt-1">{userProfile.email || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Celular</Label>
                  <p className="text-sm mt-1">{userProfile.celular || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Peso Atual</Label>
                  <p className="text-sm mt-1">{userProfile.peso_atual_kg ? `${userProfile.peso_atual_kg} kg` : 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Usuário</Label>
                  <div className="mt-1">
                    <Badge variant={getRoleBadgeVariant(userProfile.tipo_usuario)}>
                      {getRoleDisplayName(userProfile.tipo_usuario)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Última Atualização</Label>
                  <p className="text-sm mt-1">
                    {userProfile.atualizado_em 
                      ? new Date(userProfile.atualizado_em).toLocaleDateString('pt-BR')
                      : 'Não informado'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isProfileMode ? "Editar Meu Perfil" : "Editar Usuário"}</DialogTitle>
            </DialogHeader>
            {editingUsuario && (
              <div className="space-y-6 py-4">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informações Pessoais</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo</Label>
                    <Input
                      id="nome_completo"
                      value={editingUsuario.nome_completo || ''}
                      onChange={(e) =>
                        setEditingUsuario({
                          ...editingUsuario,
                          nome_completo: e.target.value,
                        })
                      }
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editingUsuario.email || ''}
                        onChange={(e) =>
                          setEditingUsuario({
                            ...editingUsuario,
                            email: e.target.value,
                          })
                        }
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="celular">Celular</Label>
                      <Input
                        id="celular"
                        value={editingUsuario.celular || ''}
                        onChange={(e) =>
                          setEditingUsuario({
                            ...editingUsuario,
                            celular: e.target.value,
                          })
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="peso_atual_kg">Peso Atual (kg)</Label>
                    <Input
                      id="peso_atual_kg"
                      type="number"
                      step="0.1"
                      value={editingUsuario.peso_atual_kg || ''}
                      onChange={(e) =>
                        setEditingUsuario({
                          ...editingUsuario,
                          peso_atual_kg: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="Ex: 75.5"
                      className="max-w-xs"
                    />
                  </div>
                </div>

                {/* Password Update Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Alterar Senha (Opcional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_new_password">Nova Senha</Label>
                      <Input
                        id="edit_new_password"
                        type="password"
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        placeholder="Deixe em branco para não alterar"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_confirm_password">Confirmar Nova Senha</Label>
                      <Input
                        id="edit_confirm_password"
                        type="password"
                        value={editUserConfirmPassword}
                        onChange={(e) => setEditUserConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                  </div>

                  {(editUserPassword || editUserConfirmPassword) && (
                    <p className="text-xs text-muted-foreground">
                      A senha deve ter pelo menos 6 caracteres.
                    </p>
                  )}
                </div>
                
                {/* Admin-only fields */}
                {!isProfileMode && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">Configurações Administrativas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
                        <select
                          id="tipo_usuario"
                          value={editingUsuario.tipo_usuario || ''}
                          onChange={(e) =>
                            setEditingUsuario({
                              ...editingUsuario,
                              tipo_usuario: e.target.value as 'cliente' | 'socio' | 'gestor' | 'dependente',
                            })
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="cliente">Cliente</option>
                          <option value="dependente">Dependente</option>
                          <option value="gestor">Gestor</option>
                          <option value="socio">Sócio</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="plano_id">Plano</Label>
                        <select
                          id="plano_id"
                          value={editingUsuario.plano_id || ''}
                          onChange={(e) =>
                            setEditingUsuario({
                              ...editingUsuario,
                              plano_id: e.target.value || null,
                            })
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Sem plano</option>
                          {planos.map((plano) => (
                            <option key={plano.id} value={plano.id}>
                              {plano.nome_plano} - R$ {plano.valor.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditUserPassword('');
                setEditUserConfirmPassword('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new_password">Nova Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 6 caracteres.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword('');
                setConfirmPassword('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleChangePassword}>Alterar Senha</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>
            {deleteUsuario && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Tem certeza que deseja deletar o usuário <strong>{deleteUsuario.nome_completo || deleteUsuario.email}</strong>?
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Esta ação não pode ser desfeita!
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    O usuário será permanentemente removido do sistema.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CreateUserDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreated={() => loadUsuarios()}
        />
      </div>
    </div>
  );
}

