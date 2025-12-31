'use client';

import { useState, useRef } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ImportResult = {
  total: number;
  imported: number;
  skipped: number;
};

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'ofx') {
      toast.error('Formato inválido. Use arquivos CSV ou OFX.');
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const profileId = localStorage.getItem('profileId');
      
      if (!profileId) {
        toast.error('Perfil não encontrado. Faça login novamente.');
        return;
      }

      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      const endpoint = ext === 'ofx' ? 'ofx' : 'csv';
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('profileId', profileId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/imports/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro na importação');
      }

      const data: ImportResult = await response.json();
      setResult(data);
      toast.success(`${data.imported} transações importadas com sucesso!`);
    } catch (error: any) {
      console.error('Import failed', error);
      toast.error(error.message || 'Erro ao importar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
  };

  return (
    <MobileLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Importar Dados
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Importe transações de arquivos CSV ou OFX
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Arquivo</CardTitle>
          <CardDescription>
            Arraste um arquivo ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging && "border-primary bg-primary/5",
              !isDragging && "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                {selectedFile.name.endsWith('.csv') ? (
                  <FileSpreadsheet className="h-12 w-12 text-green-500" />
                ) : (
                  <FileText className="h-12 w-12 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Arraste seu arquivo aqui</p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: CSV, OFX
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedFile && !result && (
            <div className="flex gap-3 mt-4">
              <Button 
                className="flex-1" 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isUploading}>
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Importação Concluída</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">{result.total}</span> transações encontradas</p>
                  <p className="text-green-700"><span className="font-medium">{result.imported}</span> importadas com sucesso</p>
                  {result.skipped > 0 && (
                    <p className="text-orange-600"><span className="font-medium">{result.skipped}</span> ignoradas (dados inválidos)</p>
                  )}
                </div>
                <Button className="mt-4" variant="outline" onClick={handleReset}>
                  Importar outro arquivo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Formato do CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>O arquivo CSV deve conter as seguintes colunas:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Date</strong> ou <strong>Data</strong> - Data da transação</li>
            <li><strong>Description</strong> ou <strong>Descricao</strong> - Descrição</li>
            <li><strong>Amount</strong> ou <strong>Valor</strong> - Valor (negativo = despesa)</li>
            <li><strong>Category</strong> ou <strong>Categoria</strong> (opcional)</li>
            <li><strong>Type</strong> ou <strong>Tipo</strong> (opcional: Income/Expense)</li>
          </ul>
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
