'use client';

import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Settings, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Shield,
  Eye,
  PenLine
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';

interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

const roleConfig = {
  admin: { label: 'Administrador', icon: Shield, color: 'bg-green-100 text-green-700 border-green-200' },
  editor: { label: 'Editor', icon: PenLine, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  viewer: { label: 'Visualizador', icon: Eye, color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function SettingsPage() {
  const { profiles, currentProfileId, setProfile, isLoading, refreshProfiles } = useProfile();
  const { userName } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'admin' as 'admin' | 'editor' | 'viewer',
  });

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do perfil é obrigatório');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProfile) {
        await api.put(`/profiles/${editingProfile.id}`, {
          name: formData.name,
          role: formData.role,
        });
        toast.success('Perfil atualizado!');
      } else {
        await api.post('/profiles', {
          name: formData.name,
          role: formData.role,
          active: true,
        });
        toast.success('Perfil criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      refreshProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;
    
    try {
      await api.delete(`/profiles/${deletingProfile.id}`);
      toast.success('Perfil excluído');
      setIsDeleteDialogOpen(false);
      setDeletingProfile(null);
      refreshProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Erro ao excluir perfil');
    }
  };

  const handleSetDefault = (profile: Profile) => {
    setProfile(profile.id);
    toast.success(`${profile.name} definido como perfil padrão`);
  };

  const openEditDialog = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({ name: profile.name, role: profile.role });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (profile: Profile) => {
    setDeletingProfile(profile);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProfile(null);
    setFormData({ name: '', role: 'admin' });
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie sua conta e preferências
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Nome</span>
                <span className="text-sm font-medium">{userName || 'Usuário'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Perfil Ativo</span>
                <Badge variant="outline">
                  {profiles.find(p => p.id === currentProfileId)?.name || 'Nenhum'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Perfis ({profiles.length})
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Crie perfis para diferentes contextos financeiros
                </CardDescription>
              </div>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : profiles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum perfil cadastrado.</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const config = roleConfig[profile.role as keyof typeof roleConfig] || roleConfig.admin;
                const RoleIcon = config.icon;
                const isDefault = profile.id === currentProfileId;
                
                return (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-lg border ${isDefault ? 'border-primary bg-primary/5' : 'bg-card'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${config.color}`}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile.name}</span>
                            {isDefault && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{config.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSetDefault(profile)}
                            title="Definir como padrão"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {profiles.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(profile)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? 'Editar Perfil' : 'Novo Perfil'}
            </DialogTitle>
            <DialogDescription>
              {editingProfile 
                ? 'Atualize as informações do perfil.'
                : 'Crie um novo perfil para organizar suas finanças.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Perfil *</Label>
              <Input
                id="name"
                placeholder="Ex: Pessoal, Empresa, Família"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'editor' | 'viewer') => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrador - Controle total
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Editor - Pode editar
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Visualizador - Apenas leitura
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrUpdate} disabled={submitting}>
              {submitting ? 'Salvando...' : editingProfile ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil &quot;{deletingProfile?.name}&quot;? 
              Todos os dados associados a este perfil serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
