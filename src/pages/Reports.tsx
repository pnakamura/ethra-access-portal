import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, FileText, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { ReportsTable } from '@/components/Reports/ReportsTable';
import { ReportView } from '@/components/Reports/ReportView';
import { GenerateReportDialog } from '@/components/Reports/GenerateReportDialog';
import { UserSelector } from '@/components/Dashboard/UserSelector';
import { useNavigate } from 'react-router-dom';

interface Usuario {
  id: string;
  nome_completo: string | null;
  email: string | null;
  tipo_usuario: 'cliente' | 'socio' | 'gestor' | 'dependente' | null;
}

interface ReportData {
  id: string;
  usuario_id: string;
  data_inicio: string;
  data_fim: string;
  dados_nutricionais: any;
  insights: string | null;
  status_envio: string;
  criado_em: string;
  enviado_em: string | null;
  comparacao_semanal: any;
}

export default function Reports() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserProfile, setSelectedUserProfile] = useState<Usuario | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<ReportData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      setUser(user);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        toast({
          title: "Erro",
          description: "Falha ao carregar perfil do usuário",
          variant: "destructive",
        });
        return;
      }

      setUserProfile(profile);
      setSelectedUserId(user.id);
      setSelectedUserProfile(profile);
      await loadReports(user.id);
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      navigate('/auth');
    }
  };

  const loadReports = async (userId: string) => {
    try {
      setLoading(true);
      
      // Load reports based on user permissions
      let query = supabase
        .from('relatorios_semanais')
        .select('*')
        .eq('usuario_id', userId)
        .order('criado_em', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar relatórios:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar relatórios",
          variant: "destructive",
        });
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar relatórios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = async (newUserId: string) => {
    setSelectedUserId(newUserId);
    
    // Load selected user profile
    const { data: profile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', newUserId)
      .single();
    
    if (profile) {
      setSelectedUserProfile(profile);
      await loadReports(newUserId);
    }
  };

  const handleRefresh = async () => {
    if (selectedUserId) {
      setRefreshing(true);
      await loadReports(selectedUserId);
      setRefreshing(false);
      toast({
        title: "Dados atualizados",
        description: "Relatórios atualizados com sucesso!",
      });
    }
  };

  const handleGenerateReport = async (reportData: { tipo: string; dataInicio: string; dataFim: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report-on-demand', {
        body: {
          usuario_id: selectedUserId,
          tipo: reportData.tipo,
          data_inicio: reportData.dataInicio,
          data_fim: reportData.dataFim,
        }
      });

      if (error) throw error;

      toast({
        title: "Relatório gerado",
        description: "Relatório gerado com sucesso!",
      });

      setShowGenerateDialog(false);
      await loadReports(selectedUserId);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório",
        variant: "destructive",
      });
    }
  };

  const handleViewReport = (report: ReportData) => {
    setSelectedReport(report);
  };

  const handleExportReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('export-report-html', {
        body: { report_id: reportId }
      });

      if (error) throw error;

      // Create and download HTML file
      const blob = new Blob([data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${reportId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Sucesso",
        description: "Relatório baixado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: "Falha ao baixar relatório",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReportClick = (report: ReportData) => {
    setReportToDelete(report);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;

    try {
      setDeletingReportId(reportToDelete.id);
      
      const { error } = await supabase
        .from('relatorios_semanais')
        .delete()
        .eq('id', reportToDelete.id);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Erro",
          description: "Erro ao deletar relatório",
          variant: "destructive",
        });
        return;
      }

      // Refresh reports list
      await loadReports(selectedUserId);
      
      toast({
        title: "Sucesso",
        description: "Relatório deletado com sucesso",
      });
      
      setShowDeleteDialog(false);
      setReportToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar relatório",
        variant: "destructive",
      });
    } finally {
      setDeletingReportId(null);
    }
  };

  // If viewing a specific report
  if (selectedReport) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6">
          <Breadcrumbs />
          <PageHeader
            title="Visualizar Relatório"
            description={`Relatório de ${selectedReport.data_inicio} a ${selectedReport.data_fim}`}
            showBackButton
            onBack={() => setSelectedReport(null)}
          />
          <ReportView 
            report={selectedReport} 
            onExport={() => handleExportReport(selectedReport.id)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        <Breadcrumbs />
        
        <PageHeader
          title="Relatórios"
          description="Visualize e gere relatórios de progresso nutricional"
          showBackButton
          onBack={() => navigate('/dashboard')}
          showRefresh
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        >
          {selectedUserProfile && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {selectedUserId === user?.id ? 'Seus relatórios:' : 'Relatórios de:'}
              </span>
              <span className="text-sm font-medium">{selectedUserProfile.nome_completo || selectedUserProfile.email}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={() => setShowGenerateDialog(true)} className="bg-ethra hover:bg-ethra/90">
              <Plus className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </PageHeader>

        {/* User Selector for Managers and Partners */}
        {userProfile && (userProfile.tipo_usuario === 'gestor' || userProfile.tipo_usuario === 'socio') && (
          <UserSelector
            currentUser={userProfile}
            selectedUserId={selectedUserId}
            onUserChange={handleUserChange}
          />
        )}

        {/* Reports Table */}
        <ReportsTable
          reports={reports}
          loading={loading}
          onViewReport={handleViewReport}
          onExportReport={handleExportReport}
          onDeleteReport={handleDeleteReportClick}
          deletingReportId={deletingReportId}
        />

        {/* Generate Report Dialog */}
        <GenerateReportDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          onGenerate={handleGenerateReport}
          selectedUserId={selectedUserId}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este relatório?
                {reportToDelete && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-medium text-foreground">
                      Período: {new Date(reportToDelete.data_inicio).toLocaleDateString('pt-BR')} até {new Date(reportToDelete.data_fim).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Criado em: {new Date(reportToDelete.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <p className="mt-3 text-destructive font-medium">
                  Esta ação não pode ser desfeita.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!deletingReportId}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={!!deletingReportId}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingReportId ? "Deletando..." : "Deletar Relatório"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}