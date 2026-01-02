'use client';

import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { reportsService } from '@/services/reportsService';
import { useProfile } from '@/hooks/useProfile';

export default function ExportPage() {
  const { currentProfileId } = useProfile();
  const [exporting, setExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExportCsv = async () => {
    setExporting('csv');
    try {
      const blob = await reportsService.exportCsv(currentProfileId || undefined);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setLastExport('csv');
      toast.success('Exportação concluída!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'csv',
      title: 'Movimentações (CSV)',
      description: 'Exporte todas as suas movimentações financeiras em formato CSV para uso em planilhas.',
      icon: FileSpreadsheet,
      action: handleExportCsv,
      available: true,
    },
    {
      id: 'pdf',
      title: 'Relatório Completo (PDF)',
      description: 'Relatório detalhado com gráficos e resumos em formato PDF.',
      icon: FileText,
      action: () => toast.info('Em breve!'),
      available: false,
    },
  ];

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6" />
            Exportar Dados
          </h1>
          <p className="text-sm text-muted-foreground">
            Baixe seus dados financeiros em diferentes formatos
          </p>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isExporting = exporting === option.id;
            const wasExported = lastExport === option.id;
            
            return (
              <Card 
                key={option.id} 
                className={`${!option.available ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${option.available ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`h-6 w-6 ${option.available ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{option.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={option.action}
                    disabled={!option.available || isExporting}
                    className="w-full"
                    variant={option.available ? 'default' : 'secondary'}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : wasExported ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Exportado! Baixar novamente
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {option.available ? 'Baixar' : 'Em breve'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Sobre a exportação CSV</p>
                <p className="text-xs text-blue-600 mt-1">
                  O arquivo contém todas as suas movimentações financeiras com data, 
                  descrição, valor, tipo e categoria. Pode ser aberto no Excel, 
                  Google Sheets ou qualquer programa de planilhas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
