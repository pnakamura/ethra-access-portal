import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface Usuario {
  id: string;
  nome_completo: string | null;
  email: string | null;
  tipo_usuario: 'cliente' | 'socio' | 'gestor' | 'dependente' | null;
  atualizado_em: string | null;
  nome_plano?: string | null;
}

interface UserTableProps {
  usuarios: Usuario[];
  user: User | null;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  getRoleBadgeVariant: (tipoUsuario: string | null) => string;
  getRoleDisplayName: (tipoUsuario: string | null) => string;
}

export function UserTable({ 
  usuarios, 
  user, 
  onEdit, 
  onDelete, 
  getRoleBadgeVariant, 
  getRoleDisplayName 
}: UserTableProps) {
  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Lista de Usuários ({usuarios.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.filter(usuario => usuario !== null).map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">
                        {usuario.nome_completo || 'Não informado'}
                      </TableCell>
                      <TableCell>{usuario.email || 'Não informado'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(usuario.tipo_usuario) as any}>
                          {getRoleDisplayName(usuario.tipo_usuario)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuario.nome_plano ? (
                          <Badge variant="secondary">{usuario.nome_plano}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Sem plano</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {usuario.atualizado_em ? new Date(usuario.atualizado_em).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(usuario)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(usuario)}
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
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {usuarios.filter(usuario => usuario !== null).map((usuario) => (
                <Card key={usuario.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {usuario.nome_completo || 'Não informado'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {usuario.email || 'Não informado'}
                          </p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(usuario.tipo_usuario) as any}>
                          {getRoleDisplayName(usuario.tipo_usuario)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-muted-foreground">Plano: </span>
                        {usuario.nome_plano ? (
                          <Badge variant="secondary" className="text-xs">{usuario.nome_plano}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Sem plano</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Última atualização: {usuario.atualizado_em ? new Date(usuario.atualizado_em).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(usuario)}
                          className="flex-1"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(usuario)}
                          disabled={usuario.id === user?.id}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}