import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface Usuario {
  id: string;
  nome_completo: string | null;
  email: string | null;
  tipo_usuario: 'cliente' | 'socio' | 'gestor' | 'dependente' | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: 'gestor' | 'socio' | null;
}

interface UserSelectorProps {
  currentUser: Usuario;
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

export function UserSelector({ currentUser, selectedUserId, onUserChange }: UserSelectorProps) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Hierarchy: socio > gestor > cliente/dependente
      if (currentUser.tipo_usuario === 'socio') {
        // Sócios can see all users with responsible info
        const { data, error } = await supabase
          .from('usuarios')
          .select(`
            id, nome_completo, email, tipo_usuario,
            vinculos_usuarios!usuario_id (
              responsavel:usuarios!usuario_principal_id (
                nome_completo,
                tipo_usuario
              )
            )
          `)
          .order('nome_completo');
        
        if (!error && data) {
          const usersWithResponsavel = data.map(user => {
            const vinculo = user.vinculos_usuarios?.[0];
            return {
              ...user,
              responsavel_nome: vinculo?.responsavel?.nome_completo || null,
              responsavel_tipo: vinculo?.responsavel?.tipo_usuario || null
            };
          });
          setUsers(usersWithResponsavel);
        }
      } else if (currentUser.tipo_usuario === 'gestor') {
        // Gestores can see only users linked to them in vinculos_usuarios
        const { data: userIds, error: vinculosError } = await supabase
          .from('vinculos_usuarios')
          .select('usuario_id')
          .eq('usuario_principal_id', currentUser.id)
          .eq('ativo', true);
        
        if (!vinculosError && userIds && userIds.length > 0) {
          const ids = userIds.map(v => v.usuario_id);
          const { data: linkedUsers, error: usersError } = await supabase
            .from('usuarios')
            .select('id, nome_completo, email, tipo_usuario')
            .in('id', ids);
          
          if (!usersError && linkedUsers) {
            const usersWithResponsavel = linkedUsers.map(user => ({
              ...user,
              responsavel_nome: currentUser.nome_completo,
              responsavel_tipo: currentUser.tipo_usuario as 'gestor'
            }));
            setUsers([currentUser, ...usersWithResponsavel]);
          } else {
            setUsers([currentUser]);
          }
        } else {
          setUsers([currentUser]);
        }
      } else {
        // Regular users only see themselves
        setUsers([currentUser]);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (tipoUsuario: string | null) => {
    if (tipoUsuario === 'gestor') return 'destructive';
    if (tipoUsuario === 'socio') return 'secondary';
    if (tipoUsuario === 'dependente') return 'outline';
    return 'default';
  };

  const getRoleDisplayName = (tipoUsuario: string | null) => {
    if (tipoUsuario === 'gestor') return 'Gestor';
    if (tipoUsuario === 'socio') return 'Sócio';
    if (tipoUsuario === 'dependente') return 'Dependente';
    return 'Cliente';
  };

  // Don't show selector if user can only see themselves
  if (users.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
      <Users className="h-5 w-5 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Visualizando dados de:</span>
        <Select value={selectedUserId} onValueChange={onUserChange}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span>{user.nome_completo || user.email}</span>
                    {user.tipo_usuario === 'dependente' && user.responsavel_nome && (
                      <span className="text-xs text-muted-foreground">
                        Responsável: {user.responsavel_nome}
                      </span>
                    )}
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.tipo_usuario)} className="text-xs">
                    {getRoleDisplayName(user.tipo_usuario)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}