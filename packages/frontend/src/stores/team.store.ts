import { create } from 'zustand'
import type { Team, Sprint } from '@matchlab/shared'
import { teamService } from '../services'

interface TeamState {
  activeTeams: Team[]
  finishedTeams: Team[]
  currentTeam: Team | null
  currentSprint: Sprint | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchTeams: () => Promise<void>
  fetchTeam: (teamId: string) => Promise<void>
  toggleChecklistItem: (teamId: string, itemId: string) => Promise<void>
  finishTeam: (teamId: string) => Promise<void>
  clearCurrentTeam: () => void
}

export const useTeamStore = create<TeamState>((set, get) => ({
  activeTeams: [],
  finishedTeams: [],
  currentTeam: null,
  currentSprint: null,
  isLoading: false,
  error: null,

  fetchTeams: async () => {
    set({ isLoading: true, error: null })
    try {
      const { active, finished } = await teamService.getMyTeams()
      set({ activeTeams: active, finishedTeams: finished, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 목록을 불러오는데 실패했습니다.'
      set({ error: message, isLoading: false })
    }
  },

  fetchTeam: async (teamId: string) => {
    set({ isLoading: true, error: null })
    try {
      const { team, sprint } = await teamService.getTeam(teamId)
      set({ currentTeam: team, currentSprint: sprint, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 정보를 불러오는데 실패했습니다.'
      set({ error: message, isLoading: false })
    }
  },

  toggleChecklistItem: async (teamId: string, itemId: string) => {
    try {
      await teamService.toggleChecklistItem(teamId, itemId)
      // Refresh current sprint to get updated checklist
      const { team, sprint } = await teamService.getTeam(teamId)
      set({ currentTeam: team, currentSprint: sprint })
    } catch (error) {
      const message = error instanceof Error ? error.message : '체크리스트 업데이트에 실패했습니다.'
      set({ error: message })
    }
  },

  finishTeam: async (teamId: string) => {
    set({ isLoading: true, error: null })
    try {
      await teamService.finishTeam(teamId)
      // Refresh teams list
      await get().fetchTeams()
      set({ isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : '팀 종료에 실패했습니다.'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  clearCurrentTeam: () => set({ currentTeam: null, currentSprint: null }),
}))
