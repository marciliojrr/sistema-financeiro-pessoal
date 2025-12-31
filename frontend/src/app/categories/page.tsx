'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Plus, Tag, Trash2, Edit, X } from 'lucide-react';
import { categoriesService, Category } from '@/services/categoriesService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        isFixed: false
    });

    const fetchCategories = async () => {
        try {
            const profileId = localStorage.getItem('profileId');
            const data = await categoriesService.getAll(profileId || undefined);
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', type: 'EXPENSE', isFixed: false });
        setEditingCategory(null);
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                type: category.type,
                isFixed: category.isFixed
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
                await categoriesService.update(editingCategory.id, formData, profileId);
                toast.success('Categoria atualizada com sucesso');
            } else {
                await categoriesService.create(formData, profileId);
                toast.success('Categoria criada com sucesso');
            }
            setIsDialogOpen(false);
            fetchCategories();
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar categoria');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
        const profileId = localStorage.getItem('profileId');
        try {
            await categoriesService.delete(id, profileId || undefined);
            toast.success('Categoria excluída com sucesso');
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir categoria');
        }
    };

    return (
        <MobileLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Categorias</h1>
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
                                    <CategoryItem key={category.id} category={category} onEdit={handleOpenDialog} onDelete={handleDelete} />
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
                                    <CategoryItem key={category.id} category={category} onEdit={handleOpenDialog} onDelete={handleDelete} />
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
                        <DialogFooter>
                             <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
