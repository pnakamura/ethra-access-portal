import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface FilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  tipoUsuarioFilter: string;
  setTipoUsuarioFilter: (tipo: string) => void;
  dataInicioFilter: string;
  setDataInicioFilter: (data: string) => void;
  dataFimFilter: string;
  setDataFimFilter: (data: string) => void;
  onClearFilters: () => void;
}

export function UserFilters({
  searchTerm,
  setSearchTerm,
  tipoUsuarioFilter,
  setTipoUsuarioFilter,
  dataInicioFilter,
  setDataInicioFilter,
  dataFimFilter,
  setDataFimFilter,
  onClearFilters
}: FilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-card-dark border-primary/20 mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca sempre visível */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar por nome ou email</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Digite o nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <Select value={tipoUsuarioFilter} onValueChange={setTipoUsuarioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="socio">Sócio</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="dependente">Dependente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicioFilter}
                onChange={(e) => setDataInicioFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFimFilter}
                onChange={(e) => setDataFimFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}