import api from '../lib/api'
import type { 
  SendInviteRequest, 
  Invite 
} from '@matchlab/shared'

interface InvitesResponse {
  sent: Invite[]
  received: Invite[]
}

export const inviteService = {
  async sendInvite(data: SendInviteRequest): Promise<Invite> {
    const response = await api.post<Invite>('/invites', data)
    return response.data
  },

  async getInvites(): Promise<InvitesResponse> {
    const response = await api.get<InvitesResponse>('/invites')
    return response.data
  },

  async acceptInvite(inviteId: string): Promise<void> {
    await api.put(`/invites/${inviteId}/accept`)
  },

  async declineInvite(inviteId: string): Promise<void> {
    await api.put(`/invites/${inviteId}/decline`)
  },
}
