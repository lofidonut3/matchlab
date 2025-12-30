import { create } from 'zustand'
import type { Invite } from '@matchlab/shared'
import { inviteService } from '../services'

interface InviteState {
  sentInvites: Invite[]
  receivedInvites: Invite[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchInvites: () => Promise<void>
  sendInvite: (targetUserId: string, message?: string) => Promise<void>
  acceptInvite: (inviteId: string) => Promise<void>
  declineInvite: (inviteId: string) => Promise<void>
}

export const useInviteStore = create<InviteState>((set, get) => ({
  sentInvites: [],
  receivedInvites: [],
  isLoading: false,
  error: null,

  fetchInvites: async () => {
    set({ isLoading: true, error: null })
    try {
      const { sent, received } = await inviteService.getInvites()
      set({ sentInvites: sent, receivedInvites: received, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '초대 목록을 불러오는데 실패했습니다.'
      set({ error: message, isLoading: false })
    }
  },

  sendInvite: async (targetUserId: string, message?: string) => {
    set({ isLoading: true, error: null })
    try {
      const invite = await inviteService.sendInvite({ toUserId: targetUserId, message })
      set({ 
        sentInvites: [...get().sentInvites, invite], 
        isLoading: false 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '초대 전송에 실패했습니다.'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  acceptInvite: async (inviteId: string) => {
    set({ isLoading: true, error: null })
    try {
      await inviteService.acceptInvite(inviteId)
      set({
        receivedInvites: get().receivedInvites.map(inv =>
          inv.id === inviteId ? { ...inv, status: 'accepted' as const } : inv
        ),
        isLoading: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '초대 수락에 실패했습니다.'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  declineInvite: async (inviteId: string) => {
    set({ isLoading: true, error: null })
    try {
      await inviteService.declineInvite(inviteId)
      set({
        receivedInvites: get().receivedInvites.map(inv =>
          inv.id === inviteId ? { ...inv, status: 'declined' as const } : inv
        ),
        isLoading: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '초대 거절에 실패했습니다.'
      set({ error: message, isLoading: false })
      throw error
    }
  },
}))
