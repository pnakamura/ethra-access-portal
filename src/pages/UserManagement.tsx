
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
import { Pencil, Trash2, UserPlus, AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import { UserFilters } from '@/components/UserManagement/UserFilters';
import { UserStats } from '@/components/UserManagement/UserStats';

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
}

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteUsuario, setDeleteUsuario] = useState<Usuario | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoUsuarioFilter, setTipoUsuarioFilter] = useState('all');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
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
      
      // Check if user is actually admin
      const userIsAdmin = profile.tipo_usuario === 'gestor';
      setIsAdmin(userIsAdmin);
      
      if (!userIsAdmin) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
        window.location.href = '/';
        return;
      }

      await loadUsuarios();
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      window.location.href = '/auth';
    }
  };

  const loadUsuarios = async () => {
    try {
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .order('atualizado_em', { ascending: false });

      if (usuariosError) throw usuariosError;
      
      setUsuarios(usuarios || []);
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

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario({ ...usuario });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUsuario || !isAdmin) return;

    try {
      // Update usuario with tipo_usuario only
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .update({
          nome_completo: editingUsuario.nome_completo,
          email: editingUsuario.email,
          tipo_usuario: editingUsuario.tipo_usuario as 'cliente' | 'socio' | 'gestor' | 'dependente',
          celular: editingUsuario.celular,
          peso_atual_kg: editingUsuario.peso_atual_kg,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', editingUsuario.id);

      if (usuarioError) throw usuarioError;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'UPDATE_USER',
        target_user_id: editingUsuario.id,
        target_email: editingUsuario.email,
        action_details: {
          updated_fields: ['nome_completo', 'email', 'tipo_usuario'],
          new_tipo_usuario: editingUsuario.tipo_usuario
        }
      });

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      setIsEditDialogOpen(false);
      setEditingUsuario(null);
      await loadUsuarios();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethra mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
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
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todos os usuários cadastrados no sistema
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
            <Button onClick={handleLogout} variant="destructive">
              Sair
            </Button>
          </div>
        </div>

        {/* Estatísticas dos usuários */}
        <UserStats />

        {/* Filtros */}
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

        <Card className="bg-card-dark border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Lista de Usuários ({filteredUsuarios.length} de {usuarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">
                        {usuario.nome_completo || 'Não informado'}
                      </TableCell>
                      <TableCell>{usuario.email || 'Não informado'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(usuario.tipo_usuario)}>
                          {getRoleDisplayName(usuario.tipo_usuario)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuario.atualizado_em ? new Date(usuario.atualizado_em).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {usuario.atualizado_em ? new Date(usuario.atualizado_em).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(usuario)}
                            disabled={usuario.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUsuario && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome_completo" className="text-right">
                    Nome Completo
                  </Label>
                  <Input
                    id="nome_completo"
                    value={editingUsuario.nome_completo || ''}
                    onChange={(e) =>
                      setEditingUsuario({
                        ...editingUsuario,
                        nome_completo: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
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
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo_usuario" className="text-right">
                    Tipo Usuário
                  </Label>
                  <select
                    id="tipo_usuario"
                    value={editingUsuario.tipo_usuario || ''}
                    onChange={(e) =>
                      setEditingUsuario({
                        ...editingUsuario,
                        tipo_usuario: e.target.value as 'cliente' | 'socio' | 'gestor' | 'dependente',
                      })
                    }
                    className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="dependente">Dependente</option>
                    <option value="socio">Sócio</option>
                    <option value="gestor">Gestor</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="celular" className="text-right">
                    Celular
                  </Label>
                  <Input
                    id="celular"
                    value={editingUsuario.celular || ''}
                    onChange={(e) =>
                      setEditingUsuario({
                        ...editingUsuario,
                        celular: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
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
      </div>
    </div>
  );
}
