import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Plus, AlertTriangle, Info } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: { tipo: string; dataInicio: string; dataFim: string }) => void;
  selectedUserId: string;
}

export function GenerateReportDialog({ open, onOpenChange, onGenerate, selectedUserId }: GenerateReportDialogProps) {
  const [tipo, setTipo] = useState<string>('completo');
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (dataInicio && dataFim) {
      validateDates();
      loadPreviewData();
    } else {
      setValidationErrors([]);
      setPreviewData(null);
    }
  }, [dataInicio, dataFim, tipo, selectedUserId]);

  const validateDates = () => {
    const errors: string[] = [];
    
    if (!dataInicio || !dataFim) {
      errors.push('Selecione as datas de início e fim');
      setValidationErrors(errors);
      return false;
    }

    if (isAfter(dataInicio, dataFim)) {
      errors.push('Data de início deve ser anterior à data de fim');
    }

    if (isAfter(dataInicio, new Date())) {
      errors.push('Data de início não pode ser no futuro');
    }

    if (isAfter(dataFim, new Date())) {
      errors.push('Data de fim não pode ser no futuro');
    }

    const daysDiff = differenceInDays(dataFim, dataInicio);
    if (daysDiff > 365) {
      errors.push('Período máximo permitido é de 365 dias');
    }

    if (daysDiff < 1) {
      errors.push('Período mínimo é de 1 dia');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const loadPreviewData = async () => {
    if (!validateDates()) return;

    setLoadingPreview(true);
    try {
      // Get preview data from database
      const { data: nutritionData } = await supabase
        .from('informacoes_nutricionais')
        .select('data_registro')
        .eq('usuario_id', selectedUserId)
        .gte('data_registro', format(dataInicio!, 'yyyy-MM-dd'))
        .lte('data_registro', format(dataFim!, 'yyyy-MM-dd'))
        .is('deletado_em', null);

      const { data: weightData } = await supabase
        .from('registro_peso')
        .select('data_registro')
        .eq('usuario_id', selectedUserId)
        .gte('data_registro', format(dataInicio!, 'yyyy-MM-dd'))
        .lte('data_registro', format(dataFim!, 'yyyy-MM-dd'))
        .is('deletado_em', null);

      const { data: hydrationData } = await supabase
        .from('registro_hidratacao')
        .select('horario')
        .eq('usuario_id', selectedUserId)
        .gte('horario', format(dataInicio!, 'yyyy-MM-dd'))
        .lte('horario', format(dataFim!, 'yyyy-MM-dd'))
        .is('deletado_em', null);

      setPreviewData({
        nutritionRecords: nutritionData?.length || 0,
        weightRecords: weightData?.length || 0,
        hydrationRecords: hydrationData?.length || 0,
        totalDays: differenceInDays(dataFim!, dataInicio!) + 1,
      });
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGenerate = async () => {
    if (!validateDates()) return;

    setGenerating(true);
    try {
      await onGenerate({
        tipo,
        dataInicio: format(dataInicio!, 'yyyy-MM-dd'),
        dataFim: format(dataFim!, 'yyyy-MM-dd'),
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
                <SelectItem value="completo">
                  <div className="flex flex-col">
                    <span>Relatório Completo</span>
                    <span className="text-xs text-muted-foreground">Nutrição, peso e hidratação</span>
                  </div>
                </SelectItem>
                <SelectItem value="nutricional">
                  <div className="flex flex-col">
                    <span>Apenas Nutricional</span>
                    <span className="text-xs text-muted-foreground">Calorias, macros e refeições</span>
                  </div>
                </SelectItem>
                <SelectItem value="peso">
                  <div className="flex flex-col">
                    <span>Apenas Peso</span>
                    <span className="text-xs text-muted-foreground">Registro de peso e evolução</span>
                  </div>
                </SelectItem>
                <SelectItem value="hidratacao">
                  <div className="flex flex-col">
                    <span>Apenas Hidratação</span>
                    <span className="text-xs text-muted-foreground">Consumo de líquidos</span>
                  </div>
                </SelectItem>
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
                  disabled={(date) => 
                    date > new Date() || 
                    (dataInicio && isBefore(date, dataInicio))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {previewData && validationErrors.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Preview do Relatório:</p>
                  <div className="text-sm space-y-1">
                    <p>• Período: {differenceInDays(dataFim!, dataInicio!) + 1} dias</p>
                    {(tipo === 'completo' || tipo === 'nutricional') && (
                      <p>• Registros nutricionais: {previewData.nutritionRecords}</p>
                    )}
                    {(tipo === 'completo' || tipo === 'peso') && (
                      <p>• Registros de peso: {previewData.weightRecords}</p>
                    )}
                    {(tipo === 'completo' || tipo === 'hidratacao') && (
                      <p>• Registros de hidratação: {previewData.hydrationRecords}</p>
                    )}
                  </div>
                  {previewData.nutritionRecords === 0 && previewData.weightRecords === 0 && previewData.hydrationRecords === 0 && (
                    <p className="text-yellow-600 text-sm mt-2">
                      ⚠️ Nenhum registro encontrado para este período. O relatório será gerado mesmo assim.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {loadingPreview && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Carregando preview...</span>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!dataInicio || !dataFim || generating || validationErrors.length > 0}
            className="bg-ethra hover:bg-ethra/90"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando...</span>
              </div>
            ) : (
              'Gerar Relatório'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}