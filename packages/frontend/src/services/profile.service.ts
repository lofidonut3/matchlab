import api from '../lib/api'
import type { 
  OnboardingRequest, 
  ProfileUpdateRequest, 
  Profile,
  EvidenceLinkRequest 
} from '@matchlab/shared'

export const profileService = {
  async completeOnboarding(data: OnboardingRequest): Promise<Profile> {
    const response = await api.post<Profile>('/onboarding', data)
    return response.data
  },

  async getMyProfile(): Promise<Profile> {
    const response = await api.get<Profile>('/profile')
    return response.data
  },

  async getProfile(userId: string): Promise<Profile> {
    const response = await api.get<Profile>(`/profile/${userId}`)
    return response.data
  },

  async updateProfile(data: ProfileUpdateRequest): Promise<Profile> {
    const response = await api.put<Profile>('/profile', data)
    return response.data
  },

  async addEvidenceLink(data: EvidenceLinkRequest): Promise<void> {
    await api.post('/profile/evidence', data)
  },
}
