import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Eye, Calendar, Trash2, AlertCircle } from "lucide-react";
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportsFilters, ReportFilters } from './ReportsFilters';

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

interface ReportsTableProps {
  reports: ReportData[];
  loading: boolean;
  onViewReport: (report: ReportData) => void;
  onExportReport: (reportId: string) => void;
  onDeleteReport: (report: ReportData) => void;
  deletingReportId?: string | null;
  showFilters?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[90px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-6 w-[60px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-8 w-[70px]" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsTable({ reports, loading, onViewReport, onExportReport, onDeleteReport, deletingReportId, showFilters = true }: ReportsTableProps) {
  const [filters, setFilters] = useState<ReportFilters>({});

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const period = `${formatDate(report.data_inicio)} - ${formatDate(report.data_fim)}`;
        if (!period.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && report.status_envio !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const reportStartDate = parseISO(report.data_inicio);
        
        if (filters.startDate && filters.endDate) {
          if (!isWithinInterval(reportStartDate, {
            start: filters.startDate,
            end: filters.endDate
          })) {
            return false;
          }
        } else if (filters.startDate) {
          if (reportStartDate < filters.startDate) {
            return false;
          }
        } else if (filters.endDate) {
          if (reportStartDate > filters.endDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [reports, filters]);
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'falha':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'Enviado';
      case 'pendente':
        return 'Pendente';
      case 'falha':
        return 'Falha';
      default:
        return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasReports = reports.length > 0;
  const hasFilteredReports = filteredReports.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && hasReports && (
        <ReportsFilters
          onFiltersChange={setFilters}
          totalReports={reports.length}
          filteredReports={filteredReports.length}
        />
      )}

      {/* No reports at all */}
      {!hasReports ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum relatório encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                Gere seu primeiro relatório para começar a acompanhar seu progresso.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !hasFilteredReports ? (
        /* No filtered results */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum relatório encontrado com os filtros aplicados
              </h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros para encontrar os relatórios desejados.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Reports table */

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios ({filteredReports.length})
              {filteredReports.length !== reports.length && (
                <span className="text-sm text-muted-foreground">
                  de {reports.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {formatDate(report.data_inicio)} - {formatDate(report.data_fim)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {report.insights ? 'Com insights' : 'Sem insights'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(report.status_envio)}>
                      {getStatusText(report.status_envio)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(report.criado_em)}
                  </TableCell>
                  <TableCell>
                    {report.enviado_em ? formatDateTime(report.enviado_em) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewReport(report)}
                        aria-label={`Visualizar relatório de ${formatDate(report.data_inicio)} a ${formatDate(report.data_fim)}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportReport(report.id)}
                        aria-label={`Baixar relatório de ${formatDate(report.data_inicio)} a ${formatDate(report.data_fim)}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteReport(report)}
                        disabled={deletingReportId === report.id}
                        aria-label={`Deletar relatório de ${formatDate(report.data_inicio)} a ${formatDate(report.data_fim)}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingReportId === report.id ? "Deletando..." : "Deletar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}