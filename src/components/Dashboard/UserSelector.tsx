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
      
      // Only gestores and socios can see other users
      if (currentUser.tipo_usuario === 'gestor') {
        // Gestores can see all users
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nome_completo, email, tipo_usuario')
          .order('nome_completo');
        
        if (!error && data) {
          setUsers(data);
        }
      } else if (currentUser.tipo_usuario === 'socio') {
        // Socios can see their own dependents and clients
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nome_completo, email, tipo_usuario')
          .in('tipo_usuario', ['cliente', 'dependente'])
          .order('nome_completo');
        
        if (!error && data) {
          setUsers([currentUser, ...data]);
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
                  <span>{user.nome_completo || user.email}</span>
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