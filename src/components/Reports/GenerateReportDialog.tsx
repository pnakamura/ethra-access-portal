import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: { tipo: string; dataInicio: string; dataFim: string }) => void;
}

export function GenerateReportDialog({ open, onOpenChange, onGenerate }: GenerateReportDialogProps) {
  const [tipo, setTipo] = useState<string>('completo');
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!dataInicio || !dataFim) return;

    setGenerating(true);
    try {
      await onGenerate({
        tipo,
        dataInicio: format(dataInicio, 'yyyy-MM-dd'),
        dataFim: format(dataFim, 'yyyy-MM-dd'),
      });
    } finally {
      setGenerating(false);
    }
  };

  const setPresetDates = (preset: string) => {
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    let start = new Date(today);

    switch (preset) {
      case '7d':
        start.setDate(today.getDate() - 7);
        break;
      case '30d':
        start.setDate(today.getDate() - 30);
        break;
      case '90d':
        start.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth':
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        start = firstDayLastMonth;
        end.setTime(lastDayLastMonth.getTime());
        break;
    }

    start.setHours(0, 0, 0, 0);
    setDataInicio(start);
    setDataFim(end);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Gerar Novo Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Relatório</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completo">Relatório Completo</SelectItem>
                <SelectItem value="nutricional">Apenas Nutricional</SelectItem>
                <SelectItem value="peso">Apenas Peso</SelectItem>
                <SelectItem value="hidratacao">Apenas Hidratação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preset Date Ranges */}
          <div className="space-y-2">
            <Label>Períodos Predefinidos</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDates('7d')}
                className="text-xs"
              >
                Últimos 7 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDates('30d')}
                className="text-xs"
              >
                Últimos 30 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDates('thisMonth')}
                className="text-xs"
              >
                Este mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresetDates('lastMonth')}
                className="text-xs"
              >
                Mês passado
              </Button>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dataInicio && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={setDataInicio}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dataFim && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!dataInicio || !dataFim || generating}
            className="bg-ethra hover:bg-ethra/90"
          >
            {generating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}