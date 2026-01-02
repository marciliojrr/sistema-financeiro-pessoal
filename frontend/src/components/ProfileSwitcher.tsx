'use client';

import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Check, ChevronDown } from 'lucide-react';

export function ProfileSwitcher() {
  const { profiles, currentProfileId, setProfile, isLoading } = useProfile();
  
  const activeProfile = profiles.find(p => p.id === currentProfileId);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-8 gap-1">
        <User className="h-4 w-4" />
        <span className="text-xs">...</span>
      </Button>
    );
  }

  if (profiles.length === 0) {
    return null;
  }

  // If only one profile, just show the name without dropdown
  if (profiles.length === 1) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground px-2">
        <User className="h-4 w-4" />
        <span className="text-xs">{activeProfile?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2">
          <User className="h-4 w-4" />
          <span className="text-xs max-w-[80px] truncate">{activeProfile?.name || 'Perfil'}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Alternar Perfil
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => setProfile(profile.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{profile.name}</span>
            {currentProfileId === profile.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
