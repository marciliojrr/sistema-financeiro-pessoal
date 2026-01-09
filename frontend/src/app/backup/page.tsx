'use client';

import { useState, useRef } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle,
  CheckCircle2,
  FileJson,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { backupService, BackupData } from '@/services/backupService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const profileId = localStorage.getItem('profileId');
    if (!profileId) {
      toast.error('Perfil não encontrado');
      return;
    }

    setDownloading(true);
    try {
      const blob = await backupService.exportBackup(profileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Backup baixado com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo .json');
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const backup = JSON.parse(text) as BackupData;
      
      if (!backup.version || !backup.data) {
        toast.error('Arquivo de backup inválido');
        setSelectedFile(null);
        return;
      }

      setBackupPreview(backup);
    } catch {
      toast.error('Erro ao ler arquivo de backup');
      setSelectedFile(null);
    }
  };

  const handleRestore = async () => {
    if (!backupPreview) return;

    const profileId = localStorage.getItem('profileId');
    if (!profileId) {
      toast.error('Perfil não encontrado');
      return;
    }

    setRestoring(true);
    try {
      const result = await backupService.restoreBackup(profileId, backupPreview);
      
      if (result.success) {
        const total = Object.values(result.restored).reduce((a, b) => a + b, 0);
        toast.success(`Backup restaurado! ${total} itens recuperados.`);
        setSelectedFile(null);
        setBackupPreview(null);
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Erro ao restaurar backup');
    } finally {
      setRestoring(false);
      setShowConfirmDialog(false);
    }
  };

  const getBackupStats = (backup: BackupData) => {
    const stats = [];
    if (backup.data.categories?.length) stats.push(`${backup.data.categories.length} categorias`);
    if (backup.data.movements?.length) stats.push(`${backup.data.movements.length} movimentações`);
    if (backup.data.creditCards?.length) stats.push(`${backup.data.creditCards.length} cartões`);
    if (backup.data.debts?.length) stats.push(`${backup.data.debts.length} dívidas`);
    if (backup.data.reserves?.length) stats.push(`${backup.data.reserves.length} reservas`);
    if (backup.data.budgets?.length) stats.push(`${backup.data.budgets.length} orçamentos`);
    if (backup.data.recurringTransactions?.length) stats.push(`${backup.data.recurringTransactions.length} recorrentes`);
    return stats;
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-2">
            <Database className="h-6 w-6" />
            Backup de Dados
          </h1>
          <p className="text-muted-foreground">
            Gerencie cópias de segurança dos seus dados financeiros.
          </p>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-green-600" />
              Exportar Backup
            </CardTitle>
            <CardDescription>
              Baixe uma cópia completa dos seus dados financeiros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                O backup inclui: categorias, movimentações, cartões, dívidas, reservas, orçamentos e transações recorrentes.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={handleExport}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Backup (JSON)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-blue-600" />
              Restaurar Backup
            </CardTitle>
            <CardDescription>
              Restaure seus dados a partir de um arquivo de backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700">
                  <strong>Atenção:</strong> Restaurar um backup irá substituir todos os seus dados atuais. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />

            {backupPreview && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Arquivo selecionado</span>
                </div>
                <p className="text-xs text-blue-600">
                  Data do backup: {new Date(backupPreview.exportDate).toLocaleString('pt-BR')}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {getBackupStats(backupPreview).map((stat, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {stat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              variant="destructive"
              onClick={() => setShowConfirmDialog(true)}
              disabled={!backupPreview || restoring}
            >
              {restoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Dados
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Dicas de Segurança
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Faça backups regularmente (pelo menos 1x por mês)</li>
              <li>• Guarde seus backups em local seguro (Google Drive, Dropbox)</li>
              <li>• Não compartilhe arquivos de backup - contém dados financeiros</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja restaurar este backup? Todos os seus dados atuais serão substituídos pelos dados do backup.
              <br /><br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Sim, Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
