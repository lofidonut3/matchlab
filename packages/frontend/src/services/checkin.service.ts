import api from '../lib/api'
import type { 
  CheckInRequest, 
  CheckIn 
} from '@matchlab/shared'

interface CheckInNeededResponse {
  needed: boolean
  nextDueAt?: string
}

export const checkinService = {
  async submitCheckIn(teamId: string, data: CheckInRequest): Promise<CheckIn> {
    const response = await api.post<CheckIn>(`/teams/${teamId}/checkins`, data)
    return response.data
  },

  async getCheckIns(teamId: string): Promise<CheckIn[]> {
    const response = await api.get<CheckIn[]>(`/teams/${teamId}/checkins`)
    return response.data
  },

  async checkInNeeded(teamId: string): Promise<CheckInNeededResponse> {
    const response = await api.get<CheckInNeededResponse>(`/teams/${teamId}/checkins/needed`)
    return response.data
  },
}
