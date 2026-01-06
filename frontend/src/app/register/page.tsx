'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AvatarSelection } from '@/components/auth/AvatarSelection';
import { UserAvatar } from '@/components/UserAvatar';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  avatar: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'avatar'>('details');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      avatar: '',
    }
  });

  const selectedAvatar = watch('avatar');
  const userName = watch('name');

  const onNextStep = async () => {
    const isValid = await trigger(['name', 'email', 'password', 'confirmPassword']);
    if (isValid) {
      setStep('avatar');
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await api.post('/users', {
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: data.avatar || undefined,
      });
      
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      router.push('/login');
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 409) {
          toast.error('Este email já está em uso.');
      } else {
          toast.error('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {step === 'details' ? 'Criar Conta' : 'Escolha seu Avatar'}
          </CardTitle>
          <CardDescription>
            {step === 'details' 
              ? 'Insira seus dados para começar a usar o sistema'
              : 'Personalize sua experiência com um avatar (opcional)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 'details' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button className="w-full" type="button" onClick={onNextStep}>
                  Continuar
                </Button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <UserAvatar 
                    name={userName} 
                    avatar={selectedAvatar} 
                    size="xl" 
                    className="h-32 w-32 border-4 border-primary/10"
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   <AvatarSelection 
                    selectedAvatar={selectedAvatar || null} 
                    onSelect={(avatar) => setValue('avatar', avatar)}
                    userName={userName || 'User'}
                   />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" type="button" onClick={() => setStep('details')} className="flex-1">
                    Voltar
                  </Button>
                  <Button className="flex-1" type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Finalizar Cadastro'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        {step === 'details' && (
          <CardFooter className="flex flex-col gap-2">
            <div className="text-sm text-gray-500 text-center">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
