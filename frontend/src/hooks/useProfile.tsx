'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import api from '@/services/api';

interface Profile {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

interface ProfileContextType {
  currentProfileId: string | null;
  profiles: Profile[];
  setProfile: (profileId: string) => void;
  isLoading: boolean;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
        const response = await api.get('/profiles');
        // Filter out inactive if needed, or handle in UI
        setProfiles(response.data);
        
        // Auto-select logic
        const storedProfileId = localStorage.getItem('profileId');
        if (storedProfileId && response.data.find((p: Profile) => p.id === storedProfileId)) {
          setCurrentProfileId(storedProfileId);
        } else if (response.data.length > 0) {
          // Default to first profile if none selected
          const first = response.data[0];
          setCurrentProfileId(first.id);
          localStorage.setItem('profileId', first.id);
        }
    } catch (error) {
      console.error('Failed to fetch profiles', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfiles();
    } else {
      setProfiles([]);
      setCurrentProfileId(null);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const setProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
    localStorage.setItem('profileId', profileId);
  };

  const refreshProfiles = async () => {
      setIsLoading(true);
      await fetchProfiles();
  };

  return (
    <ProfileContext.Provider value={{ currentProfileId, profiles, setProfile, isLoading, refreshProfiles }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
