'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface AvatarSelectionProps {
  selectedAvatar: string | null;
  onSelect: (avatar: string) => void;
  userName: string;
}

// Local pet avatars (stored in public/avatars/pets/)
const PET_AVATARS = [
  { name: 'Cachorro', file: 'pet_dog_happy_1767735834968.png' },
  { name: 'Gato', file: 'pet_cat_happy_1767735848521.png' },
  { name: 'Coelho', file: 'pet_bunny_happy_1767735861448.png' },
  { name: 'Hamster', file: 'pet_hamster_happy_1767735875418.png' },
  { name: 'Pássaro', file: 'pet_bird_happy_1767735889014.png' },
  { name: 'Panda', file: 'pet_panda_happy_1767735919036.png' },
  { name: 'Raposa', file: 'pet_fox_happy_1767735932301.png' },
  { name: 'Coala', file: 'pet_koala_happy_1767735945209.png' },
  { name: 'Pinguim', file: 'pet_penguin_happy_1767735959208.png' },
  { name: 'Unicórnio', file: 'pet_unicorn_happy_1767735974494.png' },
];

// Curated happy avatars using DiceBear styles with specific happy parameters
// All DiceBear avatars are free and open source (CC0/public domain)
const AVATAR_CATEGORIES = [
  {
    id: 'lorelei',
    name: '😊 Amigáveis',
    avatars: [
      { seed: 'Felix', params: '&mouth=happy01' },
      { seed: 'Aneka', params: '&mouth=happy02' },
      { seed: 'Jasper', params: '&mouth=happy03' },
      { seed: 'Milo', params: '&mouth=happy04' },
      { seed: 'Luna', params: '&mouth=happy05' },
      { seed: 'Coco', params: '&mouth=happy06' },
      { seed: 'Bella', params: '&mouth=happy07' },
      { seed: 'Max', params: '&mouth=happy08' },
      { seed: 'Charlie', params: '&mouth=happy09' },
      { seed: 'Lucy', params: '&mouth=happy10' },
    ],
  },
  {
    id: 'adventurer',
    name: '🧑 Aventureiros',
    avatars: [
      { seed: 'explorer1', params: '' },
      { seed: 'traveler2', params: '' },
      { seed: 'pioneer3', params: '' },
      { seed: 'voyager4', params: '' },
      { seed: 'wanderer5', params: '' },
      { seed: 'nomad6', params: '' },
      { seed: 'ranger7', params: '' },
      { seed: 'scout8', params: '' },
      { seed: 'hiker9', params: '' },
      { seed: 'camper10', params: '' },
    ],
  },
  {
    id: 'open-peeps',
    name: '👥 Amigos (Círculos)',
    avatars: [
      { seed: 'friend1', params: '&face=smile' },
      { seed: 'friend2', params: '&face=smile' },
      { seed: 'friend3', params: '&face=smile' },
      { seed: 'friend4', params: '&face=smile' },
      { seed: 'friend5', params: '&face=smile' },
      { seed: 'pal1', params: '&face=smile' },
      { seed: 'pal2', params: '&face=smile' },
      { seed: 'pal3', params: '&face=smile' },
      { seed: 'buddy1', params: '&face=smile' },
      { seed: 'buddy2', params: '&face=smile' },
    ],
  },
  {
    id: 'personas',
    name: '🙂 Personas',
    avatars: [
      { seed: 'happy1', params: '' },
      { seed: 'happy2', params: '' },
      { seed: 'happy3', params: '' },
      { seed: 'joyful1', params: '' },
      { seed: 'joyful2', params: '' },
      { seed: 'cheerful1', params: '' },
      { seed: 'cheerful2', params: '' },
      { seed: 'bright1', params: '' },
      { seed: 'bright2', params: '' },
      { seed: 'sunny1', params: '' },
    ],
  },
  {
    id: 'bottts',
    name: '🤖 Robôs Simpáticos',
    avatars: [
      { seed: 'robot1', params: '&mouth=smile01' },
      { seed: 'robot2', params: '&mouth=smile02' },
      { seed: 'bot1', params: '&mouth=smile01' },
      { seed: 'bot2', params: '&mouth=smile02' },
      { seed: 'droid1', params: '&mouth=smile01' },
      { seed: 'droid2', params: '&mouth=smile02' },
      { seed: 'android1', params: '&mouth=smile01' },
      { seed: 'android2', params: '&mouth=smile02' },
      { seed: 'mech1', params: '&mouth=smile01' },
      { seed: 'mech2', params: '&mouth=smile02' },
    ],
  },
  {
    id: 'avataaars',
    name: '🎭 Personagens',
    avatars: [
      { seed: 'char1', params: '&mouth=smile' },
      { seed: 'char2', params: '&mouth=smile' },
      { seed: 'char3', params: '&mouth=smile' },
      { seed: 'char4', params: '&mouth=smile' },
      { seed: 'char5', params: '&mouth=smile' },
      { seed: 'person1', params: '&mouth=smile' },
      { seed: 'person2', params: '&mouth=smile' },
      { seed: 'person3', params: '&mouth=smile' },
      { seed: 'person4', params: '&mouth=smile' },
      { seed: 'person5', params: '&mouth=smile' },
    ],
  },
];

export function AvatarSelection({ selectedAvatar, onSelect }: AvatarSelectionProps) {
  const getAvatarUrl = (style: string, seed: string, params: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}${params}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc,transparent`;
  };

  const getPetAvatarUrl = (file: string) => {
    return `/avatars/pets/${file}`;
  };

  return (
    <div className="space-y-6">
      {/* Pet Avatars - Local Images */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          🐾 Pets Felizes
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {PET_AVATARS.map((pet, index) => {
            const url = getPetAvatarUrl(pet.file);
            const isSelected = selectedAvatar === url;
            
            return (
              <button
                key={`pet-${index}`}
                onClick={() => onSelect(url)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 bg-white",
                  isSelected 
                    ? "border-primary ring-2 ring-primary/30 shadow-lg" 
                    : "border-transparent hover:border-primary/50"
                )}
                type="button"
                title={pet.name}
              >
                <Image 
                  src={url} 
                  alt={pet.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* DiceBear Avatars */}
      {AVATAR_CATEGORIES.map((category) => (
        <div key={category.id} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {category.name}
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {category.avatars.map((avatar, index) => {
              const url = getAvatarUrl(category.id, avatar.seed, avatar.params);
              const isSelected = selectedAvatar === url;
              
              return (
                <button
                  key={`${category.id}-${index}`}
                  onClick={() => onSelect(url)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 bg-muted/30",
                    isSelected 
                      ? "border-primary ring-2 ring-primary/30 shadow-lg" 
                      : "border-transparent hover:border-primary/50"
                  )}
                  type="button"
                  title={avatar.seed}
                >
                  <Image 
                    src={url} 
                    alt={`${category.name} - ${avatar.seed}`}
                    fill
                    className="object-cover p-1"
                    unoptimized
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      <p className="text-xs text-muted-foreground text-center pt-2">
        Avatares gratuitos • Pets: gerados por IA • Outros: DiceBear (CC0)
      </p>
    </div>
  );
}
