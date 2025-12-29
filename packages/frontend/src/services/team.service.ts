import api from '../lib/api'
import type { 
  Team, 
  Sprint 
} from '@matchlab/shared'

interface TeamListResponse {
  active: Team[]
  finished: Team[]
}

export const teamService = {
  async getMyTeams(): Promise<TeamListResponse> {
    const response = await api.get<TeamListResponse>('/teams')
    return response.data
  },

  async getTeam(teamId: string): Promise<{ team: Team; sprint: Sprint | null }> {
    const response = await api.get<{ team: Team; sprint: Sprint | null }>(`/teams/${teamId}`)
    return response.data
  },

  async toggleChecklistItem(teamId: string, itemId: string): Promise<void> {
    await api.patch(`/teams/${teamId}/checklist/${itemId}/toggle`)
  },

  async finishTeam(teamId: string): Promise<void> {
    await api.post(`/teams/${teamId}/finish`)
  },
}
