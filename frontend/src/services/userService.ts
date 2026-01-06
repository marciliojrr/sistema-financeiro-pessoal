import api from './api';

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
}

export const userService = {
  update: async (id: string, data: UpdateUserDto) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
};
