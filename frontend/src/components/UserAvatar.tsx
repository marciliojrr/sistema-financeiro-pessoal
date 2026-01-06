import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface UserAvatarProps {
  name: string | null;
  avatar?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function UserAvatar({ name, avatar, className, size = 'md' }: UserAvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };

  // Check if avatar is a valid URL (http) or local path (/)
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('/'))) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden shrink-0 border border-border/50',
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={avatar}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
          unoptimized 
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
