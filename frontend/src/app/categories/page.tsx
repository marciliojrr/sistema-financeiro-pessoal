'use client';

import { useState, useEffect, useCallback } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { categoriesService, Category, IncomeSource } from '@/services/categoriesService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDataRefresh, emitDataChange } from '@/hooks/useDataRefresh';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        isFixed: false,
        incomeSource: undefined as IncomeSource | undefined,
    });

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const profileId = localStorage.getItem('profileId');
            const data = await categoriesService.getAll(profileId || undefined);
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    }, []);

    // Escuta eventos de mudança de dados para atualizar automaticamente
    useDataRefresh('categories', fetchCategories);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const resetForm = () => {
        setFormData({ name: '', type: 'EXPENSE', isFixed: false, incomeSource: undefined });
        setEditingCategory(null);
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                type: category.type,
                isFixed: category.isFixed,
                incomeSource: category.incomeSource,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const profileId = localStorage.getItem('profileId');
        if (!profileId) {
             toast.error('Perfil não identificado');
             return;
        }

        try {
            if (editingCategory) {
                await categoriesService.update(editingCategory.id, formData);
                toast.success('Categoria atualizada com sucesso');
            } else {
                await categoriesService.create(formData, profileId);
                toast.success('Categoria criada com sucesso');
            }
            setIsDialogOpen(false);
            // Emite evento para atualizar outras telas
            emitDataChange('categories');
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar categoria');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await categoriesService.delete(deleteConfirmId);
            toast.success('Categoria excluída com sucesso');
            emitDataChange('categories');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir categoria');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    return (
        <MobileLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Tag className="h-6 w-6" />
                    Categorias
                </h1>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Nova
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                     <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                     <h3 className="text-lg font-medium">Nenhuma categoria</h3>
                     <p className="text-sm text-muted-foreground mt-2 mb-6">Crie categorias para organizar suas finanças.</p>
                     <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> Criar Categoria
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Income Section */}
                    {categories.filter(c => c.type === 'INCOME').length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Receitas</h2>
                            <div className="grid gap-3">
                                {categories.filter(c => c.type === 'INCOME').map((category) => (
                                    <CategoryItem key={category.id} category={category} onEdit={handleOpenDialog} onDelete={handleDeleteClick} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expense Section */}
                     {categories.filter(c => c.type === 'EXPENSE').length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Despesas</h2>
                            <div className="grid gap-3">
                                {categories.filter(c => c.type === 'EXPENSE').map((category) => (
                                    <CategoryItem key={category.id} category={category} onEdit={handleOpenDialog} onDelete={handleDeleteClick} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados da categoria abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder="Ex: Alimentação, Salário"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(value: 'INCOME' | 'EXPENSE') => setFormData({...formData, type: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">Receita</SelectItem>
                                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="flex items-center space-x-2 pt-8">
                                <Switch 
                                    id="isFixed" 
                                    checked={formData.isFixed}
                                    onCheckedChange={(checked) => setFormData({...formData, isFixed: checked})}
                                />
                                <Label htmlFor="isFixed">Fixa/Recorrente</Label>
                            </div>
                        </div>

                        {formData.type === 'INCOME' && (
                            <div className="space-y-2">
                                <Label htmlFor="incomeSource">Fonte de Renda</Label>
                                <Select
                                    value={formData.incomeSource || ''}
                                    onValueChange={(value: IncomeSource) => setFormData({...formData, incomeSource: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a fonte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SALARY">Salário CLT</SelectItem>
                                        <SelectItem value="SCHOLARSHIP">Bolsa de Estudos</SelectItem>
                                        <SelectItem value="FREELANCE">Freelance</SelectItem>
                                        <SelectItem value="INVESTMENT">Investimentos</SelectItem>
                                        <SelectItem value="OTHER">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter>
                             <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MobileLayout>
    );
}

function CategoryItem({ category, onEdit, onDelete }: { category: Category, onEdit: (c: Category) => void, onDelete: (id: string) => void }) {
    return (
        <Card className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3" onClick={() => onEdit(category)}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${category.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Tag className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">
                        {category.isFixed ? 'Fixa' : 'Variável'}
                    </p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </Card>
    );
}
