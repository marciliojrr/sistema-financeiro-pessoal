import api from './api';

export interface Profile {
  id: string;
  name: string;
  userId: string;
  role?: string;
}

export const profileService = {
  getAll: async (): Promise<Profile[]> => {
    const response = await api.get<Profile[]>('/profiles');
    return response.data;
  },

  getByUserId: async (userId: string): Promise<Profile> => {
    // Assuming there's an endpoint to get profiles by userId or getting 'me'
    // If not, we might need to filter profiles.
    // Let's assume GET /profiles?userId=... or similar exists, or GET /users/:id/profiles
    // Based on previous files, I haven't seen a clear "get my profile" endpoint.
    // I will check ProfilesController next. For now, I'll assume we can search by userId on Profiles.
    const response = await api.get<Profile[]>(`/profiles`, { params: { userId } });
    // Return the first profile for now (MVP)
    return response.data[0]; 
  },
  
  createDefault: async (userId: string): Promise<Profile> => {
      const response = await api.post<Profile>('/profiles', {
          name: 'Principal',
          userId
      });
      return response.data;
  }
};
